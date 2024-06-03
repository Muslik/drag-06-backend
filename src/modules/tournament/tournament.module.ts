import { Logger, Module } from '@nestjs/common';

import { DatabaseModule } from 'src/infrastructure/database';

import { TOURNAMENT_REPOSITORY, TOURNAMENT_SERVICE } from './tournament.constants';
import { TournamentController } from './tournament.controller';
import { TournamentRepository } from './tournament.repository';
import { TournamentService } from './tournament.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    Logger,
    TournamentRepository,
    {
      provide: TOURNAMENT_SERVICE,
      useClass: TournamentService,
    },
    {
      provide: TOURNAMENT_REPOSITORY,
      useClass: TournamentRepository,
    },
  ],
  controllers: [TournamentController],
})
export class TournamentModule {}
