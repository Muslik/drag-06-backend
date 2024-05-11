import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';

import { ConfigModule } from 'src/infrastructure/config';

import { AUTH_SERVICE, AUTH_SERVICE_OPTIONS } from '../../auth.constants';
import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInProvider, SignInDto } from '../../dto/signIn.dto';
import { AuthSessionService } from './authSession.service';

const mockAuthServiceOptions = {
  sessionService: {
    createSession: jest.fn(),
    deleteSession: jest.fn(),
  },
};

const mockAuthService = {
  signIn: jest.fn(),
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

describe('AuthSessionService', () => {
  let authSessionService: AuthSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: AUTH_SERVICE,
          useValue: mockAuthService,
        },
        {
          provide: AUTH_SERVICE_OPTIONS,
          useValue: mockAuthServiceOptions,
        },
        AuthSessionService,
      ],
    }).compile();

    authSessionService = module.get<AuthSessionService>(AuthSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should sign in using Google provider successfully and return user and sessionId', async () => {
    const expectedSession = { sessionId: 'test-session-id' };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(right(mockUser));
    jest.spyOn(mockAuthServiceOptions.sessionService, 'createSession').mockResolvedValueOnce(expectedSession);

    const result = await authSessionService.signIn(mockSignInDto, mockUserIdentity);

    expect(result).toEqual(right({ user: mockUser, sessionId: expectedSession.sessionId }));
  });

  it('should return an error for an unknown provider', async () => {
    const signInDto: SignInDto = {
      provider: 'unknown-provider' as SignInProvider,
      token: 'some-token',
    };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(left(new UnknownProviderError()));
    const result = await authSessionService.signIn(signInDto, mockUserIdentity);

    expect(result).toEqual(left(new UnknownProviderError()));
  });

  it('should return an error for an invalid token error', async () => {
    const signInDto: SignInDto = {
      provider: SignInProvider.GOOGLE,
      token: 'invalid-token',
    };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(left(new InvalidTokenError()));
    const result = await authSessionService.signIn(signInDto, mockUserIdentity);

    expect(result).toEqual(left(new InvalidTokenError()));
  });

  it('should logout successfully', async () => {
    jest.spyOn(mockAuthServiceOptions.sessionService, 'deleteSession').mockResolvedValueOnce(undefined);

    const result = await authSessionService.logout('test-session-id');

    expect(mockAuthServiceOptions.sessionService.deleteSession).toHaveBeenCalledWith('test-session-id');
    expect(result).toEqual(undefined);
  });
});
