export type JWTPayload = {
  userId: number;
  iat: number;
  exp: number;
  iss: string;
};
