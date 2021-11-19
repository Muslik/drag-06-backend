import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvironmentVariables } from '@drag/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', { infer: true }),
        // port: configService.get("DATABASE_PORT", { infer: true }),
        username: configService.get('DATABASE_USER', { infer: true }),
        password: configService.get('DATABASE_PASSWORD', { infer: true }),
        database: configService.get('DATABASE_NAME', { infer: true }),
        entities: [__dirname + '/**/*.entity.ts'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
