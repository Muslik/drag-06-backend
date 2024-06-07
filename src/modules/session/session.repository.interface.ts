import { Maybe } from '@sweet-monads/maybe';

import { Session, SessionCreate, SessionWithUser } from 'src/infrastructure/database';

export interface ISessionRepository {
  insert(entity: SessionCreate): Promise<Session>;
  update(entity: SessionCreate): Promise<Session>;
  delete(sessionId: string): Promise<void>;
  deleteAll(userId: number): Promise<void>;
  findBySessionId(sessionId: string): Promise<Maybe<Session>>;
  findSessionUserBySessionId(sessionId: string): Promise<Maybe<SessionWithUser>>;
}
