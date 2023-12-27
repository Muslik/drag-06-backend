import { Maybe } from '@sweet-monads/maybe';
import { UserIdentity } from 'src/infrastructure/decorators';

import { SessionEntity } from '../../entities/session.entity';

export interface ISessionService {
  getSessionUserById: (sessionId: string) => Promise<Maybe<SessionEntity['userAccount']>>;
  getSessionById: (sessionId: string) => Promise<Maybe<Omit<SessionEntity, 'userAccount'>>>;
  createSession: (userId: string, userIdentity: UserIdentity) => Promise<{ sessionId: string }>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteAllSessions: (userAccountId: string) => Promise<void>;
}
