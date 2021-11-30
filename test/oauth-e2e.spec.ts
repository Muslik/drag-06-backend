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
  family_name: 'Ivanov',
  given_name: 'Ivan',
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
): InjectOptions => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  url,
  payload,
});

const tokens = {
  accessToken: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  refreshToken: expect.stringMatching(NON_EMPTY_STRING_REGEX),
};

describe('Oauth', () => {
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

  const userLogin = (payload: Record<string, string> = { token: 'gToken' }) =>
    app.inject(request('/oauth/login/google', payload));
  const refreshTokens = (payload: Record<string, string>) =>
    app.inject(request('/oauth/refresh-tokens', payload));

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
        .where('user.provider_user_id = :providerUserId', { providerUserId: '1' })
        .getOne();
      const refreshToken = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user?.id })
        .getOne();
      expect(user).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(userSocialCredentials).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('Authenticates a user if exists and return a jwt token in the response', async () => {
      // ARRANGE
      await userLogin();
      // ACT
      const response = await userLogin();
      // ASSERT
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('Throws exception if no token provided', async () => {
      const response = await userLogin({});
      expect(response.statusCode).toBe(400);
    });
  });

  describe('/refresh-tokens', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Update user tokens', async () => {
      const response = await refreshTokens({ refreshToken: loginResponse.json().refreshToken });
      expect(response.json()).toEqual(tokens);
      expect(response.statusCode).toBe(201);
    });

    it('Throws exception if token was not verified', async () => {
      const response = await refreshTokens({ refreshToken: 'signedPayload' });
      expect(response.statusCode).toBe(401);
    });
  });
});
