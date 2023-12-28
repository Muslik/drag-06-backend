import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from '@sweet-monads/either';
import { google, oauth2_v2 } from 'googleapis';

import { InvalidTokenError } from '../../auth.errors';
import { AuthGoogleService, GOOGLE_AUTH_CLIENT_PROVIDER } from './authGoogle.service';

const mockGoogleAuthClient = { setCredentials: jest.fn() };

const mockGoogleAuthClientProvider = {
  getOAuthClient: jest.fn().mockReturnValue(mockGoogleAuthClient),
};

const mockGoogleUserInfo = {
  email: 'test@test.com',
  id: '123',
  family_name: 'Test',
  given_name: 'User',
};

const oAuth2ResolvedMock = {
  userinfo: {
    get: jest.fn().mockResolvedValue({
      data: mockGoogleUserInfo,
    }),
  },
} as unknown as oauth2_v2.Oauth2;

const oAuth2RejectedMock = {
  userinfo: {
    get: jest.fn().mockRejectedValue('some-error'),
  },
} as unknown as oauth2_v2.Oauth2;

describe('AuthGoogleService', () => {
  let authGoogleService: AuthGoogleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: GOOGLE_AUTH_CLIENT_PROVIDER,
          useValue: mockGoogleAuthClientProvider,
        },
        AuthGoogleService,
      ],
    }).compile();

    authGoogleService = module.get<AuthGoogleService>(AuthGoogleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should return user info with social credentials', async () => {
    jest.spyOn(google, 'oauth2').mockReturnValue(oAuth2ResolvedMock);

    const result = await authGoogleService.getUserInfo('valid-token');

    const expectedUser = {
      providerUserId: '123',
      email: 'test@test.com',
      firstName: 'User',
      lastName: 'Test',
      providerType: 'google',
    };

    expect(mockGoogleAuthClient.setCredentials).toHaveBeenCalledWith({ access_token: 'valid-token' });

    expect(result).toEqual(right(expectedUser));
  });

  it('should return an error for an any error from get userinfo', async () => {
    jest.spyOn(google, 'oauth2').mockReturnValue(oAuth2RejectedMock);
    const result = await authGoogleService.getUserInfo('invalid-token');

    expect(result).toEqual(left(new InvalidTokenError()));
  });
});
