import { Test } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';
import { just, none } from '@sweet-monads/maybe';

import { ConfigModule } from 'src/infrastructure/config';
import { User } from 'src/infrastructure/database';

import { AUTH_SERVICE_OPTIONS, AUTH_GOOGLE_SERVICE } from '../../auth.constants';
import { InvalidTokenError } from '../../auth.errors';
import { SignInDto, SignInProvider } from '../../dto/signIn.dto';
import { AuthService } from './auth.service';

const mockAuthGoogleService = {
  getUserInfo: jest.fn(),
};

const mockAuthServiceOptions = {
  userService: {
    getByEmail: jest.fn(),
    getById: jest.fn(),
    createWithSocialCredentials: jest.fn(),
  },
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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

    const expectedUser: User = {} as User;

    jest.spyOn(mockAuthGoogleService, 'getUserInfo').mockResolvedValueOnce(right({ email: 'test@example.com' }));
    jest.spyOn(mockAuthServiceOptions.userService, 'getByEmail').mockResolvedValueOnce(just(expectedUser));

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(right(expectedUser));
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

    const expectedUser: User = {} as User;

    jest.spyOn(mockAuthGoogleService, 'getUserInfo').mockResolvedValueOnce(right({ email: 'test@example.com' }));
    jest.spyOn(mockAuthServiceOptions.userService, 'getByEmail').mockResolvedValueOnce(none());
    jest.spyOn(mockAuthServiceOptions.userService, 'createWithSocialCredentials').mockResolvedValueOnce(expectedUser);

    const result = await authService.signIn(signInDto);

    expect(result).toEqual(right(expectedUser));
    expect(mockAuthServiceOptions.userService.createWithSocialCredentials).toHaveBeenCalledWith(googleUserInfo);
  });

  it('should return current user if the user exists', async () => {
    const expectedUser: User = { id: 123, firstName: 'Ivan' } as User;

    jest.spyOn(mockAuthServiceOptions.userService, 'getById').mockResolvedValueOnce(just(expectedUser));

    const result = await authService.getMe(123);

    expect(result).toEqual(just(expectedUser));
    expect(mockAuthServiceOptions.userService.getById).toHaveBeenCalledWith(123);
  });
});
