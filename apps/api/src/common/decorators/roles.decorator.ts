import { SetMetadata } from '@nestjs/common';
import { RoleKey } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Requires the caller to hold at least one of the listed roles. */
export const Roles = (...roles: RoleKey[]) => SetMetadata(ROLES_KEY, roles);
