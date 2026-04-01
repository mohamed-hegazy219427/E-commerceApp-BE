import { systemRoles } from '@utils/systemRoles.js';

export const orderRoles = {
  createOrder: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
  fromCartToOrder: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
  deliverOrder: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
  cancelOrder: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
} as const;
