export interface UserIdentity {
  fingerprint: string;
  userAgent: string;
  ip: string;
}

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
  iss: string;
}
