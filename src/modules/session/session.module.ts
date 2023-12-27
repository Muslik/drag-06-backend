import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';

import { SessionEntity } from './entities/session.entity';
import { SessionService } from './services/session/session.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [
    {
      provide: getRepositoryToken(SessionEntity),
      useClass: SessionEntity,
    },
    SessionService,
  ],
  exports: [SessionService],
})
export class SessionModule {}
