/**
 * Centralized Arabic UI Strings (Standard Arabic with Jordanian-friendly phrasing)
 */
export const Strings = {
  common: {
    appName: 'محفظتي',
    appSlogan: 'محفظتك المالية الذكية',
    currency: 'د.أ',
    back: 'رجوع',
    continue: 'متابعة',
    finish: 'إتمام',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    loading: 'جاري التحميل...',
    hydratingVault: 'جاري تأمين خزنتك المالية...',
    errorOccurred: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    networkError: 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل الخادم والاتصال بالإنترنت.',
    timeoutError: 'انتهت مهلة الطلب. يرجى التحقق من اتصالك والمحاولة مجدداً.',
  },

  auth: {
    loginTitle: 'تسجيل الدخول إلى محفظتي',
    loginSubtitle: 'أدخل بريدك الإلكتروني لإدارة مصاريفك، ومحافظك، وميزانيتك بكل سهولة.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    sendCodeButton: 'إرسال رمز التحقق',
    waitCooldown: (seconds: number) => `انتظر ${seconds} ثانية`,
    rateLimitWarning: (seconds: number) =>
      `وصلت إلى الحد الأقصى للمحاولات. يرجى الانتظار ${seconds} ثانية قبل طلب رمز جديد.`,
    emailRequired: 'يرجى إدخال البريد الإلكتروني',
    emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح',
    otpDisclaimer: 'سنرسل رمز تحقق مكوّن من 6 أرقام إلى بريدك. لا حاجة لكلمة مرور للبدء.',

    otpTitle: 'أدخل رمز التحقق',
    otpSubtitle: 'أرسلنا رمز تحقق مكوّناً من 6 أرقام إلى',
    changeEmail: 'تعديل البريد الإلكتروني',
    verifyButton: 'تأكيد ومتابعة',
    otpIncomplete: 'يرجى إدخال رمز التحقق كاملاً المكوّن من 6 أرقام',
    resendIn: (seconds: number) => `إعادة إرسال الرمز خلال ${seconds} ثانية`,
    resendAction: 'لم يصلك الرمز؟ إعادة الإرسال',
    resending: 'جاري الإرسال...',
    welcomeBack: 'أهلاً بك مجدداً!',
  },

  onboarding: {
    // Step 1: Profile
    profileStepIndicator: 'الخطوة 1 من 2: الملف الشخصي',
    profileTitle: 'عرّفنا عن نفسك',
    profileSubtitle: 'أكمل ملفك الشخصي لتخصيص تجربتك المالية ومتابعة حسابك.',
    verifiedEmailLabel: 'البريد الإلكتروني الموثق',
    nameLabel: 'الاسم الكامل *',
    namePlaceholder: 'مثال: إبراهيم كنعان',
    nameRequired: 'يرجى إدخال اسمك الكامل',
    passwordLabel: 'كلمة المرور (اختياري)',
    passwordPlaceholder: '8 خانات على الأقل',
    passwordHelper: 'اختياري: يمكنك تعيينها أو تعديلها لاحقاً من الإعدادات.',
    passwordLengthError: 'يجب أن تكون كلمة المرور 8 خانات على الأقل',
    continueToFinanceButton: 'المتابعة إلى الإعداد المالي',

    // Step 2: Financial Setup
    financialStepIndicator: 'الخطوة 2 من 2: الإعداد المالي',
    financialTitle: 'إعداد المحفظة والميزانية',
    financialSubtitle: 'اختر نوع محفظتك الأساسية وحدد دخلك الشهري التقديري.',
    selectWalletTypeLabel: 'اختر نوع المحفظة الأساسية *',
    walletBankTitle: 'حساب بنكي',
    walletBankDesc: 'حساب جاري أو توفير للرواتب والتحويلات الرسمية',
    walletCashTitle: 'كاش (نقدي)',
    walletCashDesc: 'أموال نقدية للمصاريف اليومية والمشتريات السريعة',
    walletCardTitle: 'بطاقة دفع',
    walletCardDesc: 'بطاقة ائتمانية أو مدينة للمشتريات اليومية والدفع الإلكتروني',
    defaultWalletNames: {
      bank: 'الحساب البنكي الأساسي',
      cash: 'محفظة الكاش',
      card: 'البطاقة الأساسية',
    },
    monthlyIncomeLabel: 'الدخل الشهري المتوقع / الميزانية *',
    monthlyIncomePlaceholder: 'مثال: 500',
    monthlyIncomeHelper: 'يحدد هذا ميزانيتك الشهرية التلقائية لتتبع توفيرك ومصاريفك.',
    incomeRequiredError: 'يرجى إدخال مبلغ صحيح وموجب للدخل الشهري',
    finishSetupButton: 'إتمام الإعداد وبدء الاستخدام',
  },

  dashboard: {
    headerSubtitle: 'لوحة التحكم المالية',
    greeting: (name?: string | null) => (name ? `أهلاً، ${name}` : 'مرحباً بك'),
    totalAssets: 'إجمالي رصيد الأصول',
    statusActive: 'نشط',
    monthlyBudget: 'الميزانية الشهرية',
    walletsCount: 'المحافظ الأساسية',
    accountsUnit: (count: number) => (count === 1 ? 'محفظة واحدة' : count === 2 ? 'محفظتان' : `${count} محافظ`),
    walletsSectionTitle: 'حساباتك ومحافظك',
    emptyWallets: 'لا توجد محافظ مسجلة حالياً. أضف محفظة للبدء!',
    accountTypeSuffix: (type: string) => {
      switch (type) {
        case 'bank':
          return 'حساب بنكي';
        case 'cash':
          return 'كاش نقدي';
        case 'card':
          return 'بطاقة دفع';
        default:
          return 'محفظة';
      }
    },
    signOutButton: 'تسجيل الخروج',
  },
} as const;

export default Strings;
