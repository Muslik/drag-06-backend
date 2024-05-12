import { Prisma } from '@prisma/client';

export { User, UserSocialCredentials, Session, RefreshToken } from '@prisma/client';

export type UserCreate = Prisma.UserCreateArgs['data'];
export type UserSocialCredentialsCreate = Prisma.UserSocialCredentialsCreateArgs['data'];

export type SessionCreate = Prisma.SessionCreateArgs['data'];
export type SessionWithUser = Prisma.SessionGetPayload<{ include: { user: true } }>;

export type RefreshTokenCreate = Prisma.RefreshTokenCreateArgs['data'];
