import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectOptions, LightMyRequestResponse } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import { IncomingHttpHeaders } from 'http';
import { Connection } from 'typeorm';

import { AppModule } from '@drag/app.module';
import { ValidationException } from '@drag/exceptions';
import { SessionEntity } from '@drag/session/entities/session.entity';
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
      JWT: '123',
      OAuth2: function () {
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

const mockedUser = {
  id: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  firstName: 'Ivan',
  lastName: 'Ivanov',
  email: 'Ivan@mail.ru',
  username: 'Ivan@mail.ru',
};

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

  const userLogin = (payload: Record<string, string> = { token: 'gToken' }) =>
    app.inject(request('/auth/login/google', payload));
  const getCurrentSession = (cookies?: Record<string, any>) =>
    app.inject(request('/auth/session', {}, {}, cookies));
  const logout = (cookies?: Record<string, any>) =>
    app.inject(request('/auth/logout', {}, {}, cookies));
  const logoutAll = (cookies?: Record<string, any>) =>
    app.inject(request('/auth/logout-all', {}, {}, cookies));

  afterAll(async () => {
    await app.close();
  });

  describe('/login/google POST', () => {
    it('Creates new user if not exist and returns sessionId and user data in the response', async () => {
      const response = await userLogin();
      const cookie = response.cookies[0];
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
      const session = await connection
        .getRepository(SessionEntity)
        .createQueryBuilder('session')
        .where('session.user_account_id = :userId', { userId: user?.id })
        .getOne();
      expect(user).toBeDefined();
      expect(session).toBeDefined();
      expect(userSocialCredentials).toBeDefined();
      expect(cookie).toEqual(
        expect.objectContaining({ name: 'sessionId', value: session?.sessionId }),
      );
      expect(response.json()).toEqual(mockedUser);
      expect(response.statusCode).toBe(201);
    });

    it('Authenticates a user if exists and return a user in the response', async () => {
      // ARRANGE
      await userLogin();
      // ACT
      const response = await userLogin();
      // ASSERT
      expect(response.json()).toEqual(mockedUser);
      expect(response.statusCode).toBe(201);
    });

    it('If already 5 sessions per user created, all sessions will be cleared, and one will be created', async () => {
      await userLogin({ token: 'gToken' });
      await userLogin({ token: 'gToken' });
      await userLogin({ token: 'gToken' });
      await userLogin({ token: 'gToken' });
      await userLogin({ token: 'gToken' });
      const user = await connection
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email: 'Ivan@mail.ru' })
        .getOne();
      let sessionCount = await connection
        .getRepository(SessionEntity)
        .createQueryBuilder('session')
        .where('session.user_account_id = :userId', { userId: user?.id })
        .getCount();
      expect(sessionCount).toBe(5);
      await userLogin();
      sessionCount = await connection
        .getRepository(SessionEntity)
        .createQueryBuilder('session')
        .where('session.user_account_id = :userId', { userId: user?.id })
        .getCount();
      expect(sessionCount).toBe(1);
    });

    it('Throws exception if no token provided', async () => {
      const response = await userLogin({});
      expect(response.statusCode).toBe(400);
    });
  });

  describe('/auth/session', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Return current user data', async () => {
      const cookie = loginResponse.cookies[0] as Record<string, unknown>;
      const response = await getCurrentSession({ sessionId: cookie.value });

      expect(response.json()).toEqual(mockedUser);
      expect(response.statusCode).toBe(201);
    });

    it("Throws exception if user doesn't have active session", async () => {
      const response = await getCurrentSession();

      expect(response.statusCode).toBe(401);
    });
  });

  describe('/auth/logout', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Delete current session', async () => {
      const cookie = loginResponse.cookies[0] as Record<string, unknown>;
      const response = await logout({ sessionId: cookie.value });
      expect(response.cookies[0]).toEqual(expect.objectContaining({ value: '' }));
    });

    it("Throws exception if user doesn't have active session", async () => {
      const response = await logout();

      expect(response.statusCode).toBe(401);
    });
  });

  describe('/auth/logout-all', () => {
    let loginResponse: LightMyRequestResponse;
    beforeEach(async () => {
      loginResponse = await userLogin();
    });

    it('Delete all user sessions', async () => {
      await userLogin();
      await userLogin();
      await userLogin();
      const cookie = loginResponse.cookies[0] as Record<string, unknown>;
      const user = await connection
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email: 'Ivan@mail.ru' })
        .getOne();
      const response = await logoutAll({ sessionId: cookie.value });
      const sessionCount = await connection
        .getRepository(RefreshTokenEntity)
        .createQueryBuilder('token')
        .where('token.user_account_id = :userId', { userId: user?.id })
        .getCount();
      expect(response.cookies[0]).toEqual(undefined);
      expect(sessionCount).toBe(0);
    });

    it("Throws exception if user doesn't have active session", async () => {
      const response = await logoutAll();

      expect(response.statusCode).toBe(401);
    });
  });
});
