export interface Config {
  port: number;
  nodeEnv: string;
  database: {
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
}

export const config = () => ({
  port: Number.parseInt(process.env.PORT || '', 10) || 3000,
  nodeEnv: process.env.NODE_ENV,
  database: {
    host: process.env.DATABASE_HOST,
    port: Number.parseInt(process.env.DATABASE_PORT || '', 10),
    user: process.env.DATABASE_USER,
    name: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    accessTokenTtl: Number.parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '', 10),
    refreshTokenTtl: Number.parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '', 10),
    issuer: process.env.JWT_ISSUER,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
