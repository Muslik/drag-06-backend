import { Module } from '@nestjs/common';
import { ConfigModule as NestjsConfigModule } from '@nestjs/config';

import { configValidationScheme } from './config.scheme';
import { ConfigService, NODE_ENV, config } from './config.service';

@Module({
  imports: [NestjsConfigModule],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {
  static forRoot() {
    return {
      module: ConfigModule,
      imports: [
        NestjsConfigModule.forRoot({
          load: [config],
          isGlobal: false,
          envFilePath: NODE_ENV === 'production' ? '.env' : `.env.${NODE_ENV}`,
          validationSchema: configValidationScheme,
        }),
      ],
    };
  }
}
