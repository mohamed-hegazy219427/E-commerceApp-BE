import { systemRoles } from '@utils/systemRoles.js';

export const cartRoles = {
  addToCart: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
  deleteFromCart: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
  clearCart: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
}   
