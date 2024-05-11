import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';

import { ConfigModule } from 'src/infrastructure/config';
import { RefreshTokenInvalidError } from 'src/modules/token';

import { AUTH_SERVICE, AUTH_SERVICE_OPTIONS } from '../../auth.constants';
import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInProvider, SignInDto } from '../../dto/signIn.dto';
import { AuthJwtService } from './authJwt.service';

const mockAuthServiceOptions = {
  tokenService: {
    getUserTokens: jest.fn(),
    getRefreshedUserTokens: jest.fn(),
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

describe('AuthJwtService', () => {
  let authJwtService: AuthJwtService;

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
        AuthJwtService,
      ],
    }).compile();

    authJwtService = module.get<AuthJwtService>(AuthJwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should sign in using Google provider successfully and return pair of tokens', async () => {
    const expectedTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(right(mockUser));
    jest.spyOn(mockAuthServiceOptions.tokenService, 'getUserTokens').mockResolvedValueOnce(expectedTokens);

    const result = await authJwtService.signIn(mockSignInDto, mockUserIdentity);

    expect(result).toEqual(right(expectedTokens));
  });

  it('should return an error for an unknown provider', async () => {
    const signInDto: SignInDto = {
      provider: 'unknown-provider' as SignInProvider,
      token: 'some-token',
    };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(left(new UnknownProviderError()));
    const result = await authJwtService.signIn(signInDto, mockUserIdentity);

    expect(result).toEqual(left(new UnknownProviderError()));
  });

  it('should return an error for an invalid token error', async () => {
    const signInDto: SignInDto = {
      provider: SignInProvider.GOOGLE,
      token: 'invalid-token',
    };

    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(left(new InvalidTokenError()));
    const result = await authJwtService.signIn(signInDto, mockUserIdentity);

    expect(result).toEqual(left(new InvalidTokenError()));
  });

  it('Should return new pair of tokens if refresh is correct', async () => {
    const expectedTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    jest
      .spyOn(mockAuthServiceOptions.tokenService, 'getRefreshedUserTokens')
      .mockResolvedValueOnce(right(expectedTokens));

    const result = await authJwtService.refresh({ refreshToken: 'valid-refresh-token' }, mockUserIdentity);

    expect(result).toEqual(right(expectedTokens));
  });

  it('Should return an error if refresh is not correct', async () => {
    jest
      .spyOn(mockAuthServiceOptions.tokenService, 'getRefreshedUserTokens')
      .mockResolvedValueOnce(left(new RefreshTokenInvalidError()));

    const result = await authJwtService.refresh({ refreshToken: 'invalid-refresh-token' }, mockUserIdentity);

    expect(result).toEqual(left(new RefreshTokenInvalidError()));
  });
});
