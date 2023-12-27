import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { RefreshTokenEntity } from './entities';
import { RefreshTokenInvalidError } from './token.errors';
import { TokenService } from './token.service';

const mockUserIdentity = { ip: '127.0.0.1', userAgent: 'test user agent' };

const mockJwtPayload = {
  userId: 'test-user-id',
  iat: 1234567890,
  exp: 1234567890,
  iss: 'test-iss',
};

const mockTokens = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
};

const mockRefreshTokenEntity = {
  refreshToken: mockTokens.refreshToken,
  userAgent: mockUserIdentity.userAgent,
  ip: mockUserIdentity.ip,
  userAccountId: mockJwtPayload.userId,
  expires: mockJwtPayload.exp,
};

const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

const dataSourceMock = {
  transaction: jest.fn(),
};

class MockRepository {
  create = jest.fn();
  findAndCount = jest.fn();
  findOne = jest.fn();
  save = jest.fn();
  delete = jest.fn();
}

const mockRepository = new MockRepository();

describe('Token Service', () => {
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
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
    mockRepository.create.mockReturnValueOnce(mockRefreshTokenEntity);
    mockJwtService.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
    mockJwtService.verify.mockReturnValueOnce(mockJwtPayload);

    const result = await tokenService.getUserTokens('test-user-id', mockUserIdentity);

    expect(mockRepository.save).toHaveBeenCalledWith({
      refreshToken: 'refreshToken',
      userAgent: mockUserIdentity.userAgent,
      ip: mockUserIdentity.ip,
      userAccountId: mockJwtPayload.userId,
      expires: 1234567890,
    });

    expect(result).toEqual({
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });
  });

  it('Return refreshed tokens if refresh is invalid', async () => {
    mockJwtService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    dataSourceMock.transaction.mockResolvedValueOnce(mockTokens);
    /* mockJwtService.verify.mockReturnValueOnce(mockJwtPayload); */
    mockRepository.findOne.mockResolvedValueOnce(mockRefreshTokenEntity);

    const eitherResult = await tokenService.getRefreshedUserTokens('invalid-refresh-token', mockUserIdentity);

    expect(eitherResult.value).toBeInstanceOf(RefreshTokenInvalidError);
  });
});
