import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectOptions, LightMyRequestResponse } from 'fastify';
import { IncomingHttpHeaders } from 'http';
import { DataSource } from 'typeorm';

import { AppModule } from 'src/app.module';
import { SessionEntity } from 'src/modules/session';
import { RefreshTokenEntity } from 'src/modules/token';
import { UserAccountEntity, UserSocialCredentialsEntity } from 'src/modules/user';

const email = 'Ivan@mail.ru';

const mockedGoogleData = {
  id: '1',
  family_name: 'Ivanov',
  given_name: 'Ivan',
  email,
};

jest.mock('googleapis', () => ({
  google: {
    auth: {
      JWT: '123',
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
  cookies?: Record<string, string>,
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
  avatarColor: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  lastName: 'Ivanov',
  email,
  username: email,
};

describe.skip('Auth', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const fastifyAdapter = new FastifyAdapter();
    fastifyAdapter.register(fastifyCookie);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(fastifyAdapter);
    dataSource = app.get(DataSource);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await dataSource.synchronize(true);
  });

  const userLogin = (payload: Record<string, string> = { token: 'gToken' }) =>
    app.inject(request('/auth/login/google', payload));
  const getCurrentSession = (cookies?: Record<string, string>) => app.inject(request('/auth/session', {}, {}, cookies));
  const logout = (cookies?: Record<string, string>) => app.inject(request('/auth/logout', {}, {}, cookies));
  const logoutAll = (cookies?: Record<string, string>) => app.inject(request('/auth/logout-all', {}, {}, cookies));

  afterAll(async () => {
    await app.close();
  });

  describe('/login/google POST', () => {
    it('Creates new user if not exist and returns sessionId and user data in the response', async () => {
      const response = await userLogin();
      const cookie = response.cookies[0];
      const user = await dataSource
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .getOne();
      const userSocialCredentials = await dataSource
        .getRepository(UserSocialCredentialsEntity)
        .createQueryBuilder('user')
        .where('user.provider_user_id = :providerUserId', { providerUserId: '1' })
        .getOne();
      const session = await dataSource
        .getRepository(SessionEntity)
        .createQueryBuilder('session')
        .where('session.user_account_id = :userId', { userId: user?.id })
        .getOne();
      expect(user).toBeDefined();
      expect(session).toBeDefined();
      expect(userSocialCredentials).toBeDefined();
      expect(cookie).toEqual(expect.objectContaining({ name: 'sessionId', value: session?.sessionId }));
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
      const user = await dataSource
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .getOne();
      let sessionCount = await dataSource
        .getRepository(SessionEntity)
        .createQueryBuilder('session')
        .where('session.user_account_id = :userId', { userId: user?.id })
        .getCount();
      expect(sessionCount).toBe(5);
      await userLogin();
      sessionCount = await dataSource
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
      const cookie = loginResponse.cookies[0];
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
      const cookie = loginResponse.cookies[0];
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
      const cookie = loginResponse.cookies[0];
      const user = await dataSource
        .getRepository(UserAccountEntity)
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .getOne();
      const response = await logoutAll({ sessionId: cookie.value });
      const sessionCount = await dataSource
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
