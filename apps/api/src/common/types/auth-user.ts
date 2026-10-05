import { RoleKey } from '@prisma/client';

/** What the JWT guard attaches to request.user */
export interface AuthUser {
  id: string;
  roles: RoleKey[];
}

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}
