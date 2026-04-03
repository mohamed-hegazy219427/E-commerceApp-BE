//   Process Signals   ─
export const ProcessSignals = {
  SIGTERM: 'SIGTERM',
  SIGINT: 'SIGINT',
};

export type ProcessSignal = (typeof ProcessSignals)[keyof typeof ProcessSignals];

//   MongoDB Model Names  ─
export const ModelNames = {
  USER: 'User',
  PRODUCT: 'Product',
  CATEGORY: 'Category',
  SUB_CATEGORY: 'SubCategory',
  BRAND: 'Brand',
  REVIEW: 'Review',
  COUPON: 'Coupon',
  CART: 'Cart',
  ORDER: 'Order',
  REFRESH_TOKEN: 'RefreshToken',
};

export type ModelName = (typeof ModelNames)[keyof typeof ModelNames];

//   API Routes     ─
const API_PREFIX = '/api/v1';

export const ROUTES = {
  AUTH: `${API_PREFIX}/auth`,
  CATEGORY: `${API_PREFIX}/category`,
  SUB_CATEGORY: `${API_PREFIX}/subCategory`,
  BRAND: `${API_PREFIX}/brand`,
  PRODUCT: `${API_PREFIX}/product`,
  COUPON: `${API_PREFIX}/coupon`,
  CART: `${API_PREFIX}/cart`,
  ORDER: `${API_PREFIX}/order`,
  REVIEW: `${API_PREFIX}/review`,
  GRAPHQL_CATEGORY: `${API_PREFIX}/graphqlCategory`,
};

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
