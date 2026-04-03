export const systemRoles = {
  USER: 'User',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'SuperAdmin',
}

export type SystemRole = (typeof systemRoles)[keyof typeof systemRoles];
