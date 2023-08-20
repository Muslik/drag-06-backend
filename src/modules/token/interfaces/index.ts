export type JWTPayload = {
  userId: string;
  iat: number;
  exp: number;
  iss: string;
};

export type Token = {
  accessToken: string;
  refreshToken: string;
};
