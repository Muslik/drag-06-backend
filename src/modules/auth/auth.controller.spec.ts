import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';
import { just, none } from '@sweet-monads/maybe';
import { FastifyReply } from 'fastify';

import { SESSION_ID } from 'src/infrastructure/decorators/auth.decorator';

import { RefreshTokenInvalidError } from '../token';
import {
  AUTH_GOOGLE_SERVICE,
  AUTH_SERVICE_OPTIONS,
  AUTH_SERVICE,
  AUTH_SESSION_SERVICE,
  AUTH_JWT_SERVICE,
} from './auth.constants';
import { AuthController } from './auth.controller';
import { InvalidTokenError, UnauthorizedError } from './auth.errors';
import { SignInProvider } from './dto/signIn.dto';

const mockGoogleAuthService = {
  getUserInfo: jest.fn(),
};

const mockAuthService = {
  signIn: jest.fn(),
  getMe: jest.fn(),
};

const mockAuthSessionService = {
  signIn: jest.fn(),
  logout: jest.fn(),
};

const mockAuthJwtService = {
  signIn: jest.fn(),
  refresh: jest.fn(),
};

const mockFastifyReply = {
  setCookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as FastifyReply;

const mockAuthServiceOptions = {
  userService: {
    getByEmail: jest.fn(),
    getById: jest.fn(),
    createWithSocialCredentials: jest.fn(),
  },
};

const mockSignInDto = { token: 'google-token', provider: SignInProvider.GOOGLE };

const mockUser = {
  id: 'test-id',
  username: 'test-username',
  firstName: 'test-first-name',
  lastName: 'test-last-name',
  email: 'test-email',
  avatarColor: 'test-avatar-color',
};

const mockUserIdentity = { ip: '127.0.0.1', userAgent: 'test user agent' };

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH_SERVICE,
          useValue: mockAuthService,
        },
        {
          provide: AUTH_GOOGLE_SERVICE,
          useValue: mockGoogleAuthService,
        },
        {
          provide: AUTH_SERVICE_OPTIONS,
          useValue: mockAuthServiceOptions,
        },
        {
          provide: AUTH_SESSION_SERVICE,
          useValue: mockAuthSessionService,
        },
        {
          provide: AUTH_JWT_SERVICE,
          useValue: mockAuthJwtService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/sign-in', () => {
    it('should return user info when authorized', async () => {
      jest
        .spyOn(mockAuthSessionService, 'signIn')
        .mockResolvedValueOnce(right({ user: mockUser, sessionId: 'test-session-id' }));

      const result = await authController.signIn(mockSignInDto, mockFastifyReply, mockUserIdentity);

      expect(result).toEqual(mockUser);
      expect(mockFastifyReply.setCookie).toHaveBeenCalledWith(SESSION_ID, 'test-session-id', {
        httpOnly: true,
        path: '/',
      });
    });

    it('should throw error when not authorized', async () => {
      jest.spyOn(mockAuthSessionService, 'signIn').mockResolvedValueOnce(left(new InvalidTokenError()));

      await expect(authController.signIn(mockSignInDto, mockFastifyReply, mockUserIdentity)).rejects.toBeInstanceOf(
        InvalidTokenError,
      );
    });
  });

  describe('POST /auth/me', () => {
    it('Should return user session if authorized', async () => {
      jest.spyOn(mockAuthService, 'getMe').mockResolvedValueOnce(just(mockUser));

      const result = await authController.me('userId');

      expect(result).toEqual(mockUser);
    });

    it('should return error when not authorized', async () => {
      jest.spyOn(mockAuthService, 'getMe').mockResolvedValueOnce(none());

      await expect(authController.me('unknownUserId')).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear session when authorized', async () => {
      jest.spyOn(mockAuthSessionService, 'logout').mockResolvedValueOnce(true);

      await authController.logout(mockFastifyReply, { sessionId: 'test-session-id' });

      expect(mockAuthSessionService.logout).toHaveBeenCalledWith('test-session-id');
      expect(mockFastifyReply.clearCookie).toHaveBeenCalledWith(SESSION_ID);
    });

    it('should return error when not authorized', async () => {
      await expect(authController.logout(mockFastifyReply, { sessionId: '' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });

  describe('POST /auth/jwt/sign-in', () => {
    it('should return user session and set sessionId when authorized', async () => {
      const expectedTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      jest.spyOn(mockAuthJwtService, 'signIn').mockResolvedValueOnce(right(expectedTokens));

      const result = await authController.jwtSignIn(mockSignInDto, mockUserIdentity);

      expect(result).toEqual(expectedTokens);
    });

    it('should return error when not authorized', async () => {
      jest.spyOn(mockAuthJwtService, 'signIn').mockResolvedValueOnce(left(new InvalidTokenError()));

      await expect(authController.jwtSignIn(mockSignInDto, mockUserIdentity)).rejects.toBeInstanceOf(InvalidTokenError);
    });
  });

  describe('POST /auth/jwt/refresh', () => {
    it('should return new pair of tokens if refresh token is valid', async () => {
      const expectedTokens = { accessToken: 'access-token', refreshToken: 'new-refresh-token' };

      jest.spyOn(mockAuthJwtService, 'refresh').mockResolvedValueOnce(right(expectedTokens));

      const result = await authController.refreshTokens(mockUserIdentity, { refreshToken: 'refresh-token' });

      expect(result).toEqual(expectedTokens);
    });

    it('should return error when refresh token is not valid', async () => {
      jest.spyOn(mockAuthJwtService, 'refresh').mockResolvedValueOnce(left(new RefreshTokenInvalidError()));

      await expect(
        authController.refreshTokens(mockUserIdentity, { refreshToken: 'invalid-refresh-token' }),
      ).rejects.toBeInstanceOf(RefreshTokenInvalidError);
    });
  });
});
