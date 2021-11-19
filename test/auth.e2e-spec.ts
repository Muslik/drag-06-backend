import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectOptions, LightMyRequestResponse } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import { IncomingHttpHeaders } from 'http';
import { Connection } from 'typeorm';

import { AppModule } from '@drag/app.module';
import { ValidationException } from '@drag/exceptions';
import { RefreshTokenEntity } from '@drag/token/entities';
import { UserAccountEntity, UserSocialCredentialsEntity } from '@drag/users/entities';

const mockedGoogleData = {
  id: '1',
  name: 'Ivan',
  email: 'Ivan@mail.ru',
};

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2() {
        this.setCredentials = () => {};
      },
    },
    oauth2: () => ({
      userinfo: {
        get: () => Promise.resolve({ data: mockedGoogleData }),
      },
    }),
  },
}));

const NON_EMPTY_STRING_REGEX = new RegExp('^(?!s*$).+');

const request = (
  url: string,
  payload: Record<string, string>,
  headers: IncomingHttpHeaders = {},
  cookies?: Record<string, any>,
): InjectOptions => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  url,
  payload,
  cookies,
});

const waitForTokenExpire = () => new Promise((r) => setTimeout(r, 5000));

const authCookieReponse = {
  name: 'refreshToken',
  value: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  path: '/auth',
  httpOnly: true,
};

const tokens = {
  accessToken: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  refreshToken: expect.stringMatching(NON_EMPTY_STRING_REGEX),
};

jest.setTimeout(10000);

describe('Auth', () => {
  let app: NestFastifyApplication;
  let connection: Connection;

  beforeAll(async () => {
    const fastifyAdapter = new FastifyAdapter();
    fastifyAdapter.register(fastifyCookie);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(fastifyAdapter);
    app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (errors) => new ValidationException(errors),
      }),
    );
    connection = app.get(Connection);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await connection.synchronize(true);
  });

  const userLogin = (payload: Record<string, string> = { token: 'gToken', fingerprint: 'hello' }) =>
    app.inject(request('/auth/login/google', payload));
  const refreshTokens = (payload: Record<string, string>, cookies: Record<string, any>) =>
    app.inject(request('/auth/refresh-tokens', payload, {}, cookies));
  const logout = (
    payload: Record<string, string>,
    headers: IncomingHttpHeaders,
    cookies: Record<string, any>,
  ) => app.inject(request('/auth/logout', payload, headers, cookies));
  const logoutAll = (
    payload: Record<string, string>,
    headers: IncomingHttpHeaders,
    cookies: Record<string, any>,
  ) => app.inject(request('/auth/logout-all', payload, headers, cookies));

  afterAll(async () => {
    await app.close();
  });

  describe('/login/google POST', () => {
    it('Creates new user if not exist and return a jwt token in the response', async () => {
      const response = await userLogin();
      const user = await connection
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email: 'Ivan@mail.ru' })
        .getOne();
      const userSocialCredentials = await connection
        .getRepository(UserSocialCredentialsEntity)
        .createQueryBuilder('user')
        .where('user.provider_id = :providerId', { providerId: '1' })
        .getOne();
      const refreshToken = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user.id })
        .getOne();
      expect(user).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(userSocialCredentials).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(response.cookies[0]).toEqual(expect.objectContaining(authCookieReponse));
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('Authenticates a user if exists and return a jwt token in the response', async () => {
      // ARRANGE
      await userLogin();
      // ACT
      const response = await userLogin();
      // ASSERT
      expect(response.cookies[0]).toEqual(expect.objectContaining(authCookieReponse));
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('If already 5 tokens per user created, all tokens will be cleared, and one will be created', async () => {
      await userLogin({ fingerprint: '1', token: 'gToken' });
      await userLogin({ fingerprint: '2', token: 'gToken' });
      await userLogin({ fingerprint: '3', token: 'gToken' });
      await userLogin({ fingerprint: '4', token: 'gToken' });
      await userLogin({ fingerprint: '5', token: 'gToken' });
      const user = await connection
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email: 'Ivan@mail.ru' })
        .getOne();
      let refreshTokensCount = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user.id })
        .getCount();
      expect(refreshTokensCount).toBe(5);
      await userLogin();
      refreshTokensCount = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user.id })
        .getCount();
      expect(refreshTokensCount).toBe(1);
    });

    it('Throws exception if no token provided', async () => {
      const response = await userLogin({ fingerprint: 'hello' });
      expect(response.statusCode).toBe(400);
    });

    it('Throws exception if no fingerprint provided', async () => {
      const response = await userLogin({ token: 'gToken' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('/refresh-tokens', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Update user tokens', async () => {
      const cookies: Record<string, any> = loginResponse.cookies[0];
      const refreshToken = cookies.value;
      const response = await refreshTokens({ fingerprint: 'hello' }, { refreshToken });
      expect(response.cookies[0]).toEqual(expect.objectContaining(authCookieReponse));
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('Throws exception if token was not verified', async () => {
      await waitForTokenExpire();
      const response = await refreshTokens(
        { fingerprint: 'hello' },
        { refreshToken: 'signedPayload' },
      );
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
      expect(response.statusCode).toBe(401);
    });

    it('Throws exception if fingerprint was not defined', async () => {
      const response = await refreshTokens({}, { refreshToken: 'signedPayload' });
      expect(response.statusCode).toBe(400);
    });

    it('Throws exception if fingerprint is not as when token was signed', async () => {
      const response = await refreshTokens(
        { fingerprint: 'fakeToken' },
        { refreshToken: 'signedPayload' },
      );
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
      expect(response.statusCode).toBe(401);
    });
  });
  describe('/auth/logout', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Removes token from cookie', async () => {
      const { accessToken, refreshToken } = loginResponse.json();
      const response = await logout(
        { fingerprint: 'hello' },
        { authorization: accessToken },
        { refreshToken },
      );
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
    });

    it('Throws exception if fingerprint was not defined', async () => {
      const { accessToken, refreshToken } = loginResponse.json();
      const response = await logout({}, { authorization: accessToken }, { refreshToken });
      expect(response.statusCode).toBe(400);
    });

    it('Throws exception if fingerprint is not as when token was signed', async () => {
      const { accessToken, refreshToken } = loginResponse.json();
      const response = await logout(
        { fingerprint: 'fake' },
        { authorization: accessToken },
        { refreshToken },
      );
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
      expect(response.statusCode).toBe(401);
    });
  });

  describe('/auth/logout-all', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Throws exception if fingerprint was not defined', async () => {
      const { accessToken, refreshToken } = loginResponse.json();
      const response = await logoutAll({}, { authorization: accessToken }, { refreshToken });
      expect(response.statusCode).toBe(400);
    });

    it('Throws exception if fingerprint is not as when token was signed', async () => {
      const { accessToken, refreshToken } = loginResponse.json();
      const response = await logoutAll(
        { fingerprint: 'fake' },
        { authorization: accessToken },
        { refreshToken },
      );
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
      expect(response.statusCode).toBe(401);
    });

    it('Removes all tokens except current', async () => {
      await userLogin();
      await userLogin();
      const resp = await userLogin();
      const { accessToken, refreshToken } = resp.json();
      const user = await connection
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email: 'Ivan@mail.ru' })
        .getOne();
      await logoutAll({ fingerprint: 'hello' }, { authorization: accessToken }, { refreshToken });
      const refreshTokensCount = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user.id })
        .getCount();
      expect(refreshTokensCount).toBe(1);
    });
  });
});
