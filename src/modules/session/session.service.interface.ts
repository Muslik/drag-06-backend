import { Maybe } from '@sweet-monads/maybe';

import { Session, SessionWithUserAccount } from 'src/infrastructure/database';
import { UserIdentity } from 'src/infrastructure/decorators';

export interface ISessionService {
  getSessionUserById: (sessionId: string) => Promise<Maybe<SessionWithUserAccount>>;
  getSessionById: (sessionId: string) => Promise<Maybe<Session>>;
  createSession: (userId: number, userIdentity: UserIdentity) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteAllSessions: (userId: number) => Promise<void>;
}
