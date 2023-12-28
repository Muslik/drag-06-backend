import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { UserAccountEntity } from './entities/userAccount.entity';
import { UserSocialCredentialsEntity } from './entities/userSocialCredentials.entity';
import { UserService } from './user.service';

const dataSourceMock = {
  transaction: jest.fn(),
};

const mockRepository = {
  create: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
};

describe('User Service', () => {
  let userService: UserService;
  let queryBuilderMock: ReturnType<typeof mockRepository.createQueryBuilder>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: getRepositoryToken(UserAccountEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(UserSocialCredentialsEntity),
          useValue: mockRepository,
        },
        UserService,
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    queryBuilderMock = mockRepository.createQueryBuilder();
    jest.spyOn(mockRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get user all users with specified fields', async () => {
    const mockUsers: Pick<UserAccountEntity, 'id' | 'username' | 'email'>[] = [
      {
        id: 'test-id',
        username: 'Test User',
        email: 'test@example.com',
      },
      {
        id: 'test-id-2',
        username: 'Test User 2',
        email: 'test2@example.com',
      },
    ];

    queryBuilderMock.getMany.mockResolvedValueOnce(mockUsers);

    const result = await userService.getAll(['id', 'username', 'email']);

    expect(result).toEqual(mockUsers);

    expect(queryBuilderMock.select).toHaveBeenCalledWith(['user.id', 'user.username', 'user.email']);
  });

  it('should get user by id with specified fields', async () => {
    const mockUser: Pick<UserAccountEntity, 'id' | 'username' | 'email'> = {
      id: 'test-id',
      username: 'Test User',
      email: 'test@example.com',
    };

    queryBuilderMock.getOne.mockResolvedValueOnce(mockUser);

    const result = await userService.getById('test-id', ['id', 'username', 'email']);

    expect(result.value).toEqual({
      id: 'test-id',
      username: 'Test User',
      email: 'test@example.com',
    });

    expect(queryBuilderMock.select).toHaveBeenCalledWith(['user.id', 'user.username', 'user.email']);
    expect(queryBuilderMock.where).toHaveBeenCalledWith('user.id = :id', { id: 'test-id' });
  });
});
