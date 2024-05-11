import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { just } from '@sweet-monads/maybe';

import { ConfigModule, ConfigService } from 'src/infrastructure/config';

import { RefreshTokenRepository } from './refreshToken.repository';
import { RefreshTokenInvalidError } from './token.errors';
import { TokenService } from './token.service';

const mockUserIdentity = { ip: '127.0.0.1', userAgent: 'test user agent' };

const mockJwtPayload = {
  userId: 123,
  iat: 1234567890,
  exp: 1234567890,
  iss: 'test-iss',
};

const mockTokens = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
};

const mockRefreshTokenEntity = {
  token: mockTokens.refreshToken,
  userAgent: mockUserIdentity.userAgent,
  ip: mockUserIdentity.ip,
  userId: mockJwtPayload.userId,
  expires: mockJwtPayload.exp,
};

const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

const mockRepository = {
  insert: jest.fn(),
  findByToken: jest.fn(),
  transaction: (callback: any) => callback(),
  deleteById: jest.fn(),
};

describe('Token Service', () => {
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            jwt: {
              accessTokenTtl: 90000,
              refreshTokenTtl: 90000,
            },
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        TokenService,
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Creates token for userId', async () => {
    mockRepository.insert.mockResolvedValue(mockRefreshTokenEntity);
    mockJwtService.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
    mockJwtService.verify.mockReturnValue(mockJwtPayload);

    const result = await tokenService.getUserTokens(123, mockUserIdentity);

    expect(mockRepository.insert).toHaveBeenCalledWith(
      {
        token: 'refreshToken',
        userAgent: mockUserIdentity.userAgent,
        ip: mockUserIdentity.ip,
        userId: mockJwtPayload.userId,
        expires: 1234567890,
      },
      undefined,
    );

    expect(result).toEqual({
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });
  });

  it.skip('Return refreshed token error if refresh is invalid', async () => {
    mockJwtService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const result = await tokenService.getRefreshedUserTokens('invalid-refresh-token', mockUserIdentity);

    expect(result.value).toBeInstanceOf(RefreshTokenInvalidError);
  });

  it.skip('Return refreshed token error if refresh is valid', async () => {
    mockJwtService.verify.mockReturnValueOnce(mockJwtPayload);
    mockRepository.findByToken.mockResolvedValueOnce(just(mockRefreshTokenEntity));
    mockRepository.deleteById.mockResolvedValueOnce(undefined);

    const result = await tokenService.getRefreshedUserTokens('invalid-refresh-token', mockUserIdentity);

    expect(result.unwrap()).toEqual(mockRefreshTokenEntity);
  });
});
