import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { just } from '@sweet-monads/maybe';
import { Equal } from 'typeorm';

import { SessionEntity } from '../../entities/session.entity';
import { SessionService } from './session.service';

const mockUserIdentity = { ip: '127.0.0.1', userAgent: 'test user agent' };

const mockUser = {
  id: 'test-id',
  username: 'test-username',
  firstName: 'test-first-name',
  lastName: 'test-last-name',
  email: 'test-email',
  avatarColor: 'test-avatar-color',
};

const mockRepository = {
  create: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockCreatedSession = {
  id: 'test-id',
  sessionId: 'test-session-id',
  userAgent: 'test-user-agent',
  ip: '127.0.0.1',
};

const mockSession = {
  id: 'test-id',
  sessionId: 'test-session-id',
  userAgent: 'test-user-agent',
  ip: '127.0.0.1',
  createdAt: new Date('2023-01-01'),
  lastAccessAt: new Date('2022-01-01'),
  userAccountId: 'test-user-account-id',
};

const mockSessionWithUserAccount = {
  ...mockSession,
  userAccount: mockUser,
};

describe('AuthJwtService', () => {
  let sessionService: SessionService;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-02-02'));
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
        SessionService,
      ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks().useRealTimers();
  });

  it('Return session by id and updates lastAccessAt', async () => {
    mockRepository.findOne.mockResolvedValueOnce(mockSession);

    const expectedSession = {
      id: 'test-id',
      sessionId: 'test-session-id',
      userAgent: 'test-user-agent',
      ip: '127.0.0.1',
      createdAt: new Date('2023-01-01'),
      lastAccessAt: new Date('2023-02-02'),
      userAccountId: 'test-user-account-id',
    };

    const result = await sessionService.getSessionById('test-session-id');

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { sessionId: Equal('test-session-id') },
    });
    expect(mockRepository.save).toHaveBeenCalledWith(expectedSession);
    expect(result).toEqual(just(expectedSession));
  });

  it('Return session user by session id', async () => {
    mockRepository.findOne.mockResolvedValueOnce(mockSessionWithUserAccount);

    const expectedSessionUser = {
      id: 'test-id',
      username: 'test-username',
      firstName: 'test-first-name',
      lastName: 'test-last-name',
      email: 'test-email',
      avatarColor: 'test-avatar-color',
    };

    const result = await sessionService.getSessionUserById('test-id');

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { sessionId: Equal('test-id') },
      relations: ['userAccount'],
    });
    expect(result).toEqual(just(expectedSessionUser));
  });

  it('Creates new session and return session-id', async () => {
    const userId = 'test-user-id';

    mockRepository.create.mockReturnValueOnce(mockCreatedSession);

    const result = await sessionService.createSession(userId, mockUserIdentity);

    expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedSession);

    expect(result).toEqual({
      sessionId: expect.any(String),
    });
  });

  it('Deletes session by id', async () => {
    await sessionService.deleteSession('test-id');

    expect(mockRepository.delete).toHaveBeenCalledWith({
      sessionId: Equal('test-id'),
    });
  });

  it('Deletes all sessions by user account id', async () => {
    await sessionService.deleteAllSessions('user-account-id');

    expect(mockRepository.delete).toHaveBeenCalledWith({
      userAccountId: Equal('user-account-id'),
    });
  });
});
