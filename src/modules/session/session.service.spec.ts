import { Test, TestingModule } from '@nestjs/testing';
import { just } from '@sweet-monads/maybe';

import { ConfigModule } from 'src/infrastructure/config';

import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

const mockUserIdentity = { ip: '127.0.0.1', userAgent: 'test user agent' };

const mockRepository = {
  findBySessionId: jest.fn(),
  findSessionUserById: jest.fn(),
  updateLastAccessAt: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteAll: jest.fn(),
};

const sessionId = 'test-session-id';

describe('AuthJwtService', () => {
  let sessionService: SessionService;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-02-02'));
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: SessionRepository,
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

  it('Return session by id', async () => {
    const existingSession = {
      id: 'test-id',
      sessionId,
      userAgent: 'test-user-agent',
      ip: '127.0.0.1',
      createdAt: new Date('2023-01-01'),
      lastAccessAt: new Date('2022-01-01'),
      userId: 123,
    };

    mockRepository.findBySessionId.mockResolvedValueOnce(just(existingSession));

    const session = await sessionService.getSessionById(sessionId);

    expect(session.unwrap()).toEqual(existingSession);
    expect(mockRepository.findBySessionId).toHaveBeenCalledWith(sessionId);
  });

  it('Returns session user by id', async () => {
    const existingSession = {
      id: 'test-id',
      sessionId,
      userAgent: 'test-user-agent',
      ip: '127.0.0.1',
      createdAt: new Date('2023-01-01'),
      lastAccessAt: new Date('2022-01-01'),
      userId: 123,
    };

    mockRepository.findBySessionId.mockResolvedValueOnce(just(existingSession));

    const session = await sessionService.getSessionById(sessionId);

    expect(session.unwrap()).toEqual(existingSession);
    expect(mockRepository.findBySessionId).toHaveBeenCalledWith(sessionId);
  });

  it('Creates new session and return session-id', async () => {
    const userId = 1;
    const expectedCreatedSession = {
      id: 'test-id',
      sessionId,
      userAgent: 'test-user-agent',
      ip: '127.0.0.1',
    };

    mockRepository.insert.mockResolvedValue(expectedCreatedSession);
    const createdSession = await sessionService.createSession(userId, mockUserIdentity);

    expect(mockRepository.insert).toHaveBeenCalledWith({
      userId,
      sessionId: expect.any(String),
      ...mockUserIdentity,
    });

    expect(createdSession).toEqual(createdSession);
  });

  it('Deletes session by id', async () => {
    await sessionService.deleteSession(sessionId);

    expect(mockRepository.delete).toHaveBeenCalledWith(sessionId);
  });

  it('Deletes all sessions by user id', async () => {
    await sessionService.deleteAllSessions(1);

    expect(mockRepository.deleteAll).toHaveBeenCalledWith(1);
  });
});
