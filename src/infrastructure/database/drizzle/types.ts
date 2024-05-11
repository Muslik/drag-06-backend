import { InferSelectModel } from 'drizzle-orm';

import * as schema from './schema';

export type UserSchema = typeof schema.users;
export type User = (typeof schema.users)['$inferSelect'];

export type UserSocialCredentialsSchema = typeof schema.userSocialCredentials;
export type UserSocialCredentials = (typeof schema.userSocialCredentials)['$inferSelect'];

export type SessionSchema = typeof schema.sessions;
export type Session = (typeof schema.sessions)['$inferSelect'];
export type SessionWithUserAccount = InferSelectModel<typeof schema.sessions> & {
  user: User;
};

export type RefreshTokensSchema = typeof schema.refreshTokens;
export type RefreshToken = (typeof schema.refreshTokens)['$inferSelect'];
