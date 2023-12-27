export type JWTPayload = {
  userId: string;
  iat: number;
  exp: number;
  iss: string;
};
