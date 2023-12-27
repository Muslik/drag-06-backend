import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { just } from '@sweet-monads/maybe';
import { DataSource } from 'typeorm';

import { SessionEntity } from '../../entities/session.entity';
import { SessionService } from './session.service';

const mockUser = {
  id: 'test-id',
  username: 'test-username',
  firstName: 'test-first-name',
  lastName: 'test-last-name',
  email: 'test-email',
  avatarColor: 'test-avatar-color',
};

export const dataSourceMock = jest.fn(() => ({
  transaction: jest.fn(),
}));

class MockRepository {
  findAndCount = jest.fn();
  findOne = jest.fn();
  save = jest.fn();
  delete = jest.fn();
}

const mockRepository = new MockRepository();

const mockSession = {
  id: 'test-id',
  sessionId: 'test-session-id',
  userAgent: 'test-user-agent',
  ip: '127.0.0.1',
  createdAt: new Date(),
  lastAccessAt: new Date(),
  userAccountId: 'test-user-account-id',
};

const mockSessionWithUserAccount = {
  ...mockSession,
  userAccount: mockUser,
};

describe('AuthJwtService', () => {
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useClass: dataSourceMock,
        },
        SessionService,
      ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Returns session by id', async () => {
    mockRepository.findOne.mockResolvedValueOnce(just(mockSession));

    const result = await sessionService.getSessionById('test-session-id');

    expect(result).toEqual(just(mockSession));
  });
});
