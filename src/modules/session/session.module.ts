import { Module } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SessionEntity } from './entities/session.entity';
import { SessionService } from './services/session/session.service';

@Module({
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
