import { Prisma } from '@prisma/client';

export {
  Role,
  CarClass,
  Tournament,
  User,
  UserSocialCredentials,
  Session,
  RefreshToken,
  TournamentStatus,
} from '@prisma/client';

export type UserCreate = Prisma.UserCreateArgs['data'];
export type UserSocialCredentialsCreate = Prisma.UserSocialCredentialsCreateArgs['data'];

export type SessionCreate = Prisma.SessionCreateArgs['data'];
export type SessionWithUser = Prisma.SessionGetPayload<{ include: { user: true } }>;

export type RefreshTokenCreate = Prisma.RefreshTokenCreateArgs['data'];

export type TournamentCreate = Prisma.TournamentCreateArgs['data'];

export type TournamentParticipantCreate = Prisma.TournamentParticipantCreateArgs['data'];
