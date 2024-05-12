import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { just } from '@sweet-monads/maybe';
import { ClsModule } from 'nestjs-cls';

import { ConfigModule } from 'src/infrastructure/config';
import { DatabaseModule, PrismaService, User } from 'src/infrastructure/database';

import { UserRepository } from './repositories/user.repository';
import { UserSocialCredentialsRepository } from './repositories/userSocialCredentials.repository';
import { UserService } from './user.service';

const mockRepository = {
  findById: jest.fn(),
};

describe('User Service', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        ClsModule.forRoot({
          plugins: [
            new ClsPluginTransactional({
              imports: [DatabaseModule],
              adapter: new TransactionalAdapterPrisma({
                prismaInjectionToken: PrismaService,
              }),
            }),
          ],
        }),
      ],
      providers: [
        Logger,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
        {
          provide: UserSocialCredentialsRepository,
          useValue: mockRepository,
        },
        UserService,
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get user by id', async () => {
    const mockUser: User = {
      id: 1,
      username: 'Test User',
      email: 'test@example.com',
    } as User;

    mockRepository.findById.mockResolvedValueOnce(just(mockUser));
    const result = await userService.getById(1);

    expect(result.unwrap()).toEqual({
      id: 1,
      username: 'Test User',
      email: 'test@example.com',
    });
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
  });
});
