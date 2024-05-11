import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';

export type Config = {
  port: number;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  database: {
    type: string;
    host: string;
    port?: number;
    user: string;
    name: string;
    password: string;
  };
  jwt: {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    issuer: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
};

export const config = (): Config => ({
  port: Number.parseInt(process.env.PORT || '', 10) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '', 10),
    user: process.env.DATABASE_USER ?? '',
    name: process.env.DATABASE_NAME ?? '',
    password: process.env.DATABASE_PASSWORD ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY ?? '',
    accessTokenTtl: Number.parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '', 10),
    refreshTokenTtl: Number.parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '', 10),
    issuer: process.env.JWT_ISSUER ?? '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },
});

@Injectable()
export class ConfigService {
  constructor(public nestConfigService: NestConfigService<Config, true>) {}

  get isProduction() {
    return this.nestConfigService.get<boolean>('isProduction');
  }

  get isDevelopment() {
    return this.nestConfigService.get<boolean>('isDevelopment');
  }

  get isTest() {
    return this.nestConfigService.get<boolean>('isTest');
  }

  get port() {
    return this.nestConfigService.get<number>('port');
  }

  get jwt() {
    return this.nestConfigService.get<Config['jwt']>('jwt');
  }

  get database() {
    return this.nestConfigService.get<Config['database']>('database');
  }

  get google() {
    return this.nestConfigService.get<Config['google']>('google');
  }
}
