import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/infrastructure/database';

import { SESSION_REPOSITORY, SESSION_SERVICE } from './session.constants';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionRepository,
    },
    {
      provide: SESSION_SERVICE,
      useClass: SessionService,
    },
  ],
  exports: [SESSION_SERVICE],
})
export class SessionModule {}
