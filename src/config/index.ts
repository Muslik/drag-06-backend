import * as Joi from "joi";

export const NODE_ENV = process.env.NODE_ENV ?? 'development';

export type Config = {
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
};

export const configValidationScheme = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  DATABASE_HOST: Joi.string().default("localhost"),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  JWT_SECRET_KEY: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().required(),
  JWT_ISSUER: Joi.string().required(),
});

export const config = () => ({
  port: Number.parseInt(process.env.PORT || "", 10) || 3000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  database: {
    type: "postgres",
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number.parseInt(process.env.DATABASE_PORT || "", 10),
    user: process.env.DATABASE_USER,
    name: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    accessTokenTtl: Number.parseInt(process.env.JWT_ACCESS_TOKEN_TTL || "", 10),
    refreshTokenTtl: Number.parseInt(
      process.env.JWT_REFRESH_TOKEN_TTL || "",
      10
    ),
    issuer: process.env.JWT_ISSUER,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
