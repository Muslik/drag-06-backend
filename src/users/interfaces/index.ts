export interface UserWithSocialCredentials {
  firstName: string;
  lastName: string;
  email: string;
  providerType: 'google';
  providerUserId: string;
}
