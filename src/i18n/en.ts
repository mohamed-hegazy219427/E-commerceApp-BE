export const en = {
  // Generic
  done: 'Done',
  serverError: 'Internal server error',
  invalidRouting: 'Invalid routing',
  unauthorized: 'Unauthorized to access this API',
  forbidden: 'Forbidden',

  // Auth
  auth: {
    loginFirst: 'Please login first',
    invalidTokenPrefix: 'Invalid token prefix',
    invalidToken: 'Invalid token',
    invalidEmail: 'Invalid email',
    invalidPassword: 'Invalid password',
    emailExists: 'Email already exists',
    notConfirmed: 'Email not confirmed',
    alreadyConfirmed: 'Email already confirmed',
    confirmedDone: 'Email confirmed successfully, please login',
    loginDone: 'Login successful',
    logoutDone: 'Logged out successfully',
    tokenRefreshed: 'Token refreshed',
    signupDone: 'Signup successful, please check your email to confirm',
    failConfirmEmail: 'Failed to send confirmation email',
    pleaseSignup: 'User not found, please sign up',
    checkEmail: 'Check your email for the OTP code',
    failSendResetEmail: 'Failed to send reset password email',
    invalidResetToken: 'Invalid reset password token',
    alreadyResetPassword: 'Password already reset',
    passwordResetSuccess: 'Password reset successfully, please login',
    invalidOtp: 'Invalid OTP code',
  },

  // Category
  category: {
    notFound: 'Category not found',
    duplicateName: 'Category name already exists',
    sameOldName: 'New name is the same as the old name',
    uploadImage: 'Please upload a category image',
    deletedDone: 'Category deleted successfully',
    deleteSubCategoriesFailed: 'Failed to delete related sub-categories',
    deleteProductsFailed: 'Failed to delete related products',
  },

  // SubCategory
  subCategory: {
    notFound: 'Sub-category not found',
    duplicateName: 'Sub-category name already exists',
    sameOldName: 'New name is the same as the old name',
    uploadImage: 'Please upload a sub-category image',
  },

  // Brand
  brand: {
    notFound: 'Brand not found',
    duplicateName: 'Brand name already exists',
    uploadLogo: 'Please upload a brand logo',
    invalidCategoryId: 'Invalid category ID',
    invalidSubCategoryId: 'Invalid sub-category ID',
    deleteProductsFailed: 'Failed to delete related products',
  },

  // Product
  product: {
    notFound: 'Product not found',
    invalidSubCategoryId: 'Invalid sub-category ID',
    categoryNotFound: 'Category not found, may have been deleted',
    invalidBrandId: 'Invalid brand ID',
    uploadImages: 'Please upload product images',
    insufficientStock: 'Insufficient stock for this product',
    invalidProductId: 'Invalid product ID',
  },

  // Coupon
  coupon: {
    notFound: 'Coupon not found',
    invalidCode: 'Invalid coupon code',
    duplicateCode: 'Coupon code already exists',
    expired: 'Coupon has expired',
    notStarted: 'Coupon has not started yet',
    notAssigned: 'You are not assigned to use this coupon',
    exceededUsage: 'Exceeded maximum coupon usage',
    noAssignedUsers: 'No assigned users for this coupon',
    selectType: 'Please select either percentage or fixed amount coupon type',
  },

  // Cart
  cart: {
    notFound: 'Cart not found',
    productNotInCart: 'Product not found in cart',
    emptyCart: 'Cart is empty',
    invalidProductId: 'Invalid product ID',
    stockExceeded: 'Requested quantity exceeds available stock',
  },

  // Order
  order: {
    created: 'Order created successfully',
    notFound: 'Order not found',
    invalidProductId: 'Invalid product or insufficient stock',
    failCreate: 'Failed to create order',
    invalidCartId: 'Invalid cart ID',
    emptyCart: 'Cart is empty',
    alreadyCanceled: 'Order is already canceled',
    delivered: 'Order delivered successfully',
    invalidOrderId: 'Invalid order ID',
  },

  // Review
  review: {
    added: 'Review added successfully',
    notFound: 'Product not found',
    buyFirst: 'You must purchase this product before reviewing it',
    failAdd: 'Failed to add review',
  },
}

export type TranslationKeys = typeof en;
