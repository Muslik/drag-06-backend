import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '@drag/session/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity])
  ],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}
