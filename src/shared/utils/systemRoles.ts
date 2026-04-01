export const systemRoles = {
  USER: 'User',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'SuperAdmin',
} as const;

export type SystemRole = (typeof systemRoles)[keyof typeof systemRoles];
