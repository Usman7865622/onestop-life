export type PublicUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  locale: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  user: PublicUser;
};

export type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

export type AuthMode = 'login' | 'signup';
