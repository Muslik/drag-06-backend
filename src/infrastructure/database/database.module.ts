import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '../config';
import { DRIZZLE_SERVICE } from './database.contants';
import { DrizzleService } from './drizzle/drizzle.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_SERVICE,
      useFactory: async (configService: ConfigService) => {
        return await DrizzleService.getDrizzle({
          pg: {
            connection: 'pool',
            config: {
              port: configService.database.port,
              database: configService.database.name,
              user: configService.database.user,
              host: configService.database.host,
              password: configService.database.password,
            },
          },
        });
      },
      inject: [ConfigService],
    },
    DrizzleService,
  ],
  exports: [DrizzleService],
})
export class DatabaseModule {}
