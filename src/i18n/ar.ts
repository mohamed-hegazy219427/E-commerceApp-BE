export const ar = {
  // Generic
  done: 'تم بنجاح',
  serverError: 'خطأ في الخادم الداخلي',
  invalidRouting: 'مسار غير صالح',
  unauthorized: 'غير مصرح لك بالوصول إلى هذه الواجهة',
  forbidden: 'محظور',

  // Auth
  auth: {
    loginFirst: 'من فضلك سجل دخولك أولاً',
    invalidTokenPrefix: 'بادئة الرمز المميز غير صالحة',
    invalidToken: 'رمز مميز غير صالح',
    invalidEmail: 'البريد الإلكتروني غير صالح',
    invalidPassword: 'كلمة المرور غير صالحة',
    emailExists: 'البريد الإلكتروني موجود مسبقاً',
    notConfirmed: 'البريد الإلكتروني غير مؤكد',
    alreadyConfirmed: 'تم تأكيد البريد الإلكتروني مسبقاً',
    confirmedDone: 'تم التأكيد بنجاح، من فضلك سجل دخولك',
    loginDone: 'تم تسجيل الدخول بنجاح',
    logoutDone: 'تم تسجيل الخروج بنجاح',
    tokenRefreshed: 'تم تجديد الرمز المميز',
    signupDone: 'تم التسجيل بنجاح، تحقق من بريدك الإلكتروني للتأكيد',
    failConfirmEmail: 'فشل إرسال بريد التأكيد',
    pleaseSignup: 'المستخدم غير موجود، من فضلك سجل',
    checkEmail: 'تحقق من بريدك الإلكتروني للحصول على رمز OTP',
    failSendResetEmail: 'فشل إرسال بريد إعادة تعيين كلمة المرور',
    invalidResetToken: 'رمز إعادة تعيين كلمة المرور غير صالح',
    alreadyResetPassword: 'تم إعادة تعيين كلمة المرور مسبقاً',
    passwordResetSuccess: 'تم إعادة تعيين كلمة المرور بنجاح، من فضلك سجل دخولك',
    invalidOtp: 'رمز OTP غير صالح',
  },

  // Category
  category: {
    notFound: 'الفئة غير موجودة',
    duplicateName: 'اسم الفئة موجود مسبقاً',
    sameOldName: 'الاسم الجديد مطابق للاسم القديم',
    uploadImage: 'من فضلك ارفع صورة الفئة',
    deletedDone: 'تم حذف الفئة بنجاح',
    deleteSubCategoriesFailed: 'فشل حذف الفئات الفرعية المرتبطة',
    deleteProductsFailed: 'فشل حذف المنتجات المرتبطة',
  },

  // SubCategory
  subCategory: {
    notFound: 'الفئة الفرعية غير موجودة',
    duplicateName: 'اسم الفئة الفرعية موجود مسبقاً',
    sameOldName: 'الاسم الجديد مطابق للاسم القديم',
    uploadImage: 'من فضلك ارفع صورة الفئة الفرعية',
  },

  // Brand
  brand: {
    notFound: 'العلامة التجارية غير موجودة',
    duplicateName: 'اسم العلامة التجارية موجود مسبقاً',
    uploadLogo: 'من فضلك ارفع شعار العلامة التجارية',
    invalidCategoryId: 'معرف الفئة غير صالح',
    invalidSubCategoryId: 'معرف الفئة الفرعية غير صالح',
    deleteProductsFailed: 'فشل حذف المنتجات المرتبطة',
  },

  // Product
  product: {
    notFound: 'المنتج غير موجود',
    invalidSubCategoryId: 'معرف الفئة الفرعية غير صالح',
    categoryNotFound: 'الفئة غير موجودة، ربما تم حذفها',
    invalidBrandId: 'معرف العلامة التجارية غير صالح',
    uploadImages: 'من فضلك ارفع صور المنتج',
    insufficientStock: 'المخزون غير كافٍ لهذا المنتج',
    invalidProductId: 'معرف المنتج غير صالح',
  },

  // Coupon
  coupon: {
    notFound: 'الكوبون غير موجود',
    invalidCode: 'رمز الكوبون غير صالح',
    duplicateCode: 'رمز الكوبون موجود مسبقاً',
    expired: 'انتهت صلاحية الكوبون',
    notStarted: 'لم يبدأ الكوبون بعد',
    notAssigned: 'غير مصرح لك باستخدام هذا الكوبون',
    exceededUsage: 'تجاوزت الحد الأقصى لاستخدام الكوبون',
    noAssignedUsers: 'لا يوجد مستخدمون مخصصون لهذا الكوبون',
    selectType: 'اختر نوع الكوبون: نسبة مئوية أو مبلغ ثابت',
  },

  // Cart
  cart: {
    notFound: 'عربة التسوق غير موجودة',
    productNotInCart: 'المنتج غير موجود في عربة التسوق',
    emptyCart: 'عربة التسوق فارغة',
    invalidProductId: 'معرف المنتج غير صالح',
    stockExceeded: 'الكمية المطلوبة تتجاوز المخزون المتاح',
  },

  // Order
  order: {
    created: 'تم إنشاء الطلب بنجاح',
    notFound: 'الطلب غير موجود',
    invalidProductId: 'منتج غير صالح أو المخزون غير كافٍ',
    failCreate: 'فشل إنشاء الطلب',
    invalidCartId: 'معرف عربة التسوق غير صالح',
    emptyCart: 'عربة التسوق فارغة',
    alreadyCanceled: 'الطلب ملغى مسبقاً',
    delivered: 'تم تسليم الطلب بنجاح',
    invalidOrderId: 'معرف الطلب غير صالح',
  },

  // Review
  review: {
    added: 'تمت إضافة التقييم بنجاح',
    notFound: 'المنتج غير موجود',
    buyFirst: 'يجب شراء المنتج أولاً قبل التقييم',
    failAdd: 'فشل إضافة التقييم',
  },
} as const;
