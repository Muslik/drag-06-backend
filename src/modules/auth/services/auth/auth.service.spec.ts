import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';
import { just, none } from '@sweet-monads/maybe';

import { UserAccountEntity } from 'src/modules/users';

import { AUTH_SERVICE_OPTIONS, AUTH_GOOGLE_SERVICE } from '../../auth.constants';
import { InvalidTokenError, UnknownProviderError } from '../../auth.errors';
import { SignInDto, SignInProvider } from '../../dto/signIn.dto';
import { AuthService } from './auth.service';

const mockAuthGoogleService = {
  getUserInfo: jest.fn(),
};

const mockAuthServiceOptions = {
  usersService: {
    getByEmail: jest.fn(),
    getById: jest.fn(),
    createWithSocialCredentials: jest.fn(),
  },
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        AuthService,
        {
          provide: AUTH_GOOGLE_SERVICE,
          useValue: mockAuthGoogleService,
        },
        {
          provide: AUTH_SERVICE_OPTIONS,
          useValue: mockAuthServiceOptions,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should sign in using Google provider successfully', async () => {
    const signInDto: SignInDto = {
      provider: SignInProvider.GOOGLE,
      token: 'google-token',
    };

    const expectedUser: UserAccountEntity = {} as UserAccountEntity;

    jest.spyOn(mockAuthGoogleService, 'getUserInfo').mockResolvedValueOnce(right({ email: 'test@example.com' }));
    jest.spyOn(mockAuthServiceOptions.usersService, 'getByEmail').mockResolvedValueOnce(just(expectedUser));

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(right(expectedUser));
  });

  it('should return an error for an unknown provider', async () => {
    const signInDto: SignInDto = {
      provider: 'unknown-provider' as SignInProvider,
      token: 'some-token',
    };

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(left(new UnknownProviderError()));
  });

  it('should return an error if GoogleAuthService getUserInfo fails', async () => {
    const signInDto: SignInDto = {
      provider: SignInProvider.GOOGLE,
      token: 'invalid-token',
    };

    const error = new InvalidTokenError();

    jest.spyOn(mockAuthGoogleService, 'getUserInfo').mockResolvedValueOnce(left(error));

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(left(error));
  });

  it('creates a new user if the user does not exist', async () => {
    const googleUserInfo = { email: 'test@example.com' };
    const signInDto: SignInDto = {
      provider: SignInProvider.GOOGLE,
      token: 'invalid-token',
    };

    const expectedUser: UserAccountEntity = {} as UserAccountEntity;

    jest.spyOn(mockAuthGoogleService, 'getUserInfo').mockResolvedValueOnce(right({ email: 'test@example.com' }));
    jest.spyOn(mockAuthServiceOptions.usersService, 'getByEmail').mockResolvedValueOnce(none());
    jest.spyOn(mockAuthServiceOptions.usersService, 'createWithSocialCredentials').mockResolvedValueOnce(expectedUser);

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(right(expectedUser));
    expect(mockAuthServiceOptions.usersService.createWithSocialCredentials).toHaveBeenCalledWith(googleUserInfo);
  });

  it('should return current user if the user exists', async () => {
    const expectedUser: UserAccountEntity = {} as UserAccountEntity;

    jest.spyOn(mockAuthServiceOptions.usersService, 'getById').mockResolvedValueOnce(just(expectedUser));

    const result = await authService.getMe('userId');

    expect(result).toEqual(just(expectedUser));
    expect(mockAuthServiceOptions.usersService.getById).toHaveBeenCalledWith('userId', [
      'id',
      'email',
      'firstName',
      'lastName',
      'avatarColor',
      'username',
    ]);
  });
});
