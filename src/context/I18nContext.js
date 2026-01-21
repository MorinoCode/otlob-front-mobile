import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';

const I18nContext = createContext();

const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
    },
    // Auth
    auth: {
      phoneNumber: 'Phone Number',
      enterPhone: 'Enter your phone number',
      sendOtp: 'Send OTP',
      verifyOtp: 'Verify OTP',
      enterOtp: 'Enter the verification code',
      login: 'Login',
      register: 'Register',
      logout: 'Log Out',
      logoutConfirm: 'Are you sure you want to log out?',
      fullName: 'Full Name',
      email: 'Email',
      mobileNumber: 'Mobile Number',
      welcomeText: 'Hungry? Order directly to your car.',
      letsEat: "Let's Eat! 🍔",
      termsText: 'By continuing, you agree to our Terms & Privacy Policy.',
      invalidPhone: 'Please enter a valid mobile number 📱',
      selectCountry: 'Select Country',
      connectionError: 'Connection Error',
      checkConnection: 'Check your internet connection.',
      error: 'Error',
      serverError: 'Server error',
      verifyCode: 'Verify Code',
      resendOtp: 'Resend OTP',
      enter4Digit: 'Please enter the 4-digit code',
      loginFailed: 'Login Failed',
      somethingWentWrong: 'Something went wrong',
    },
    // Home
    home: {
      searchPlaceholder: 'Search for restaurants or cuisines...',
      closed: 'CLOSED',
      closedBadge: 'Closed',
      menu: 'Menu',
      listView: 'List View',
      mapView: 'Map View',
      openingHours: 'Opening Hours',
      explore: 'Explore',
    },
    // Profile
    profile: {
      myProfile: 'My Profile',
      myVehicles: 'My Vehicles',
      quickActions: 'Quick Actions',
      helpSupport: 'Help & Support',
      about: 'About',
      cart: 'Cart',
      orders: 'Orders',
      cars: 'Cars',
      settings: 'Settings',
      defaultVehicle: 'Default Vehicle',
      myGarage: 'My Garage',
      allVehicles: 'All Vehicles',
      manage: 'Manage',
      addCar: 'Add Car',
      viewAll: 'View All',
      noVehicles: 'No vehicles added yet',
      addVehiclePrompt: 'Add a vehicle for faster checkout',
      addVehicle: 'Add Vehicle',
      deliveryLocation: 'Delivery Location',
      active: 'Active',
      loadingProfile: 'Loading profile...',
      language: 'Language',
      selectLanguage: 'Select Language',
      english: 'English',
      arabic: 'Arabic',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      support: 'Support',
    },
    // Cart
    cart: {
      cart: 'Cart',
      empty: 'Your cart is empty',
      total: 'Total',
      checkout: 'Checkout',
      remove: 'Remove',
      quantity: 'Quantity',
      viewCart: 'View Cart',
      yourOrder: 'Your Order',
      totalAmount: 'Total Amount',
      goToCheckout: 'Go to Checkout',
    },
    // Menu
    menu: {
      menu: 'Menu',
      rating: 'Rating',
      reviews: 'Reviews',
      openingTime: 'Opens at',
      closingTime: 'Closes at',
      addToCart: 'Add to Cart',
      outOfStock: 'Out of Stock',
      closed: 'Closed',
      open: 'Open',
      reviewsCount: 'Reviews',
    },
    // Checkout
    checkout: {
      checkout: 'Checkout',
      orderSummary: 'Order Summary',
      selectCar: 'Select Vehicle',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      card: 'Card',
      notes: 'Order Notes (Optional)',
      placeOrder: 'Place Order',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      total: 'Total',
    },
    // Orders
    orders: {
      orders: 'Orders',
      activeOrders: 'Active Orders',
      orderHistory: 'Order History',
      noActiveOrders: 'No active orders',
      noOrderHistory: 'No order history',
      orderDetails: 'Order Details',
      status: 'Status',
      pending: 'Pending',
      accepted: 'Accepted',
      cooking: 'Cooking',
      ready: 'Ready',
      completed: 'Completed',
      cancelled: 'Cancelled',
      orderId: 'Order ID',
      orderDate: 'Order Date',
      totalAmount: 'Total Amount',
      reOrder: 'Re-Order',
      trackOrder: 'Track Order',
      items: 'Items',
      estimatedTime: 'Estimated Time',
      minutes: 'minutes',
      callRestaurant: 'Call Restaurant',
      navigateRestaurant: 'Navigate to Restaurant',
      imHere: "I'M HERE",
      notifyArrived: 'Notify restaurant that you have arrived',
      cooldown: 'Cooldown',
      restaurantInfo: 'Restaurant Info',
      customerNote: 'Customer Note',
      noNote: 'No note',
      pickupTime: 'Pickup Time',
      viewOnMap: 'View on Map',
    },
    // Cars
    cars: {
      myCars: 'My Vehicles',
      addCar: 'Add Vehicle',
      carModel: 'Car Model',
      carColor: 'Color',
      plateNumber: 'Plate Number',
      setAsDefault: 'Set as Default',
      default: 'Default',
      noCars: 'No vehicles added',
      defaultVehicle: 'Default Vehicle',
      addNewVehicle: 'Add New Vehicle',
      editVehicle: 'Edit Vehicle',
      saveVehicle: 'Save Vehicle',
      deleteVehicle: 'Delete Vehicle',
      selectColor: 'Select Color',
      enterModel: 'Enter car model',
      enterPlate: 'Enter plate number',
      vehicleAdded: 'Vehicle added successfully',
      vehicleUpdated: 'Vehicle updated successfully',
      vehicleDeleted: 'Vehicle deleted successfully',
      deleteConfirm: 'Are you sure you want to delete this vehicle?',
      selectDefault: 'Select as default vehicle',
    },
  },
  ar: {
    // Common
    common: {
      loading: 'جاري التحميل...',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      done: 'تم',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
    },
    // Register
    register: {
      finishSetup: 'إنهاء الإعداد',
      helpRecognize: 'ساعدنا في التعرف على سيارتك فوراً! 🚗',
      vehicleDetails: 'تفاصيل المركبة',
      getStarted: 'ابدأ 🚀',
      saveProfileError: 'لا يمكن حفظ الملف الشخصي. الرجاء المحاولة مرة أخرى.',
    },
    // Auth
    auth: {
      phoneNumber: 'رقم الهاتف',
      enterPhone: 'أدخل رقم هاتفك',
      sendOtp: 'إرسال رمز التحقق',
      verifyOtp: 'تحقق من رمز التحقق',
      enterOtp: 'أدخل رمز التحقق',
      login: 'تسجيل الدخول',
      register: 'التسجيل',
      logout: 'تسجيل الخروج',
      logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      mobileNumber: 'رقم الجوال',
      welcomeText: 'جائع؟ اطلب مباشرة إلى سيارتك.',
      letsEat: 'لنأكل! 🍔',
      termsText: 'بالمتابعة، أنت توافق على الشروط وسياسة الخصوصية.',
      invalidPhone: 'الرجاء إدخال رقم جوال صحيح 📱',
      selectCountry: 'اختر الدولة',
      connectionError: 'خطأ في الاتصال',
      checkConnection: 'تحقق من اتصالك بالإنترنت.',
      error: 'خطأ',
      serverError: 'خطأ في الخادم',
      verifyCode: 'تحقق من الرمز',
      resendOtp: 'إعادة إرسال الرمز',
      enter4Digit: 'الرجاء إدخال رمز مكون من 4 أرقام',
      loginFailed: 'فشل تسجيل الدخول',
      somethingWentWrong: 'حدث خطأ ما',
    },
    // Home
    home: {
      searchPlaceholder: 'ابحث عن المطاعم أو المأكولات...',
      closed: 'مغلق',
      closedBadge: 'مغلق',
      menu: 'القائمة',
      listView: 'عرض القائمة',
      mapView: 'عرض الخريطة',
      openingHours: 'ساعات العمل',
      explore: 'استكشف',
    },
    // Profile
    profile: {
      myProfile: 'ملفي الشخصي',
      myVehicles: 'مركباتي',
      quickActions: 'إجراءات سريعة',
      helpSupport: 'المساعدة والدعم',
      about: 'حول التطبيق',
      cart: 'السلة',
      orders: 'الطلبات',
      cars: 'المركبات',
      settings: 'الإعدادات',
      defaultVehicle: 'المركبة الافتراضية',
      myGarage: 'مرآبي',
      allVehicles: 'جميع المركبات',
      manage: 'إدارة',
      addCar: 'إضافة مركبة',
      viewAll: 'عرض الكل',
      noVehicles: 'لم تتم إضافة مركبات بعد',
      addVehiclePrompt: 'أضف مركبة للدفع السريع',
      addVehicle: 'إضافة مركبة',
      deliveryLocation: 'موقع التوصيل',
      active: 'نشط',
      loadingProfile: 'جاري تحميل الملف الشخصي...',
      language: 'اللغة',
      selectLanguage: 'اختر اللغة',
      english: 'الإنجليزية',
      arabic: 'العربية',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      support: 'الدعم',
    },
    // Cart
    cart: {
      cart: 'السلة',
      empty: 'سلتك فارغة',
      total: 'الإجمالي',
      checkout: 'الدفع',
      remove: 'حذف',
      quantity: 'الكمية',
      viewCart: 'عرض السلة',
      yourOrder: 'طلباتك',
      totalAmount: 'المبلغ الإجمالي',
      goToCheckout: 'الذهاب إلى الدفع',
    },
    // Menu
    menu: {
      menu: 'القائمة',
      rating: 'التقييم',
      reviews: 'التقييمات',
      openingTime: 'يفتح في',
      closingTime: 'يغلق في',
      addToCart: 'أضف إلى السلة',
      outOfStock: 'نفد المخزون',
      closed: 'مغلق',
      open: 'مفتوح',
      reviewsCount: 'تقييم',
    },
    // Checkout
    checkout: {
      checkout: 'الدفع',
      orderSummary: 'ملخص الطلب',
      selectCar: 'اختر المركبة',
      paymentMethod: 'طريقة الدفع',
      cash: 'نقدي',
      card: 'بطاقة',
      notes: 'ملاحظات الطلب (اختياري)',
      placeOrder: 'تأكيد الطلب',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      total: 'الإجمالي',
    },
    // Orders
    orders: {
      orders: 'الطلبات',
      activeOrders: 'الطلبات النشطة',
      orderHistory: 'سجل الطلبات',
      noActiveOrders: 'لا توجد طلبات نشطة',
      noOrderHistory: 'لا يوجد سجل طلبات',
      orderDetails: 'تفاصيل الطلب',
      status: 'الحالة',
      pending: 'قيد الانتظار',
      accepted: 'تم القبول',
      cooking: 'قيد التحضير',
      ready: 'جاهز',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      orderId: 'رقم الطلب',
      orderDate: 'تاريخ الطلب',
      totalAmount: 'المبلغ الإجمالي',
      reOrder: 'إعادة الطلب',
      trackOrder: 'تتبع الطلب',
      items: 'العناصر',
      estimatedTime: 'الوقت المقدر',
      minutes: 'دقائق',
      callRestaurant: 'اتصل بالمطعم',
      navigateRestaurant: 'الانتقال إلى المطعم',
      imHere: 'وصلت',
      notifyArrived: 'إعلام المطعم بأنك وصلت',
      cooldown: 'مهلة الانتظار',
      restaurantInfo: 'معلومات المطعم',
      customerNote: 'ملاحظة العميل',
      noNote: 'لا توجد ملاحظة',
      pickupTime: 'وقت الاستلام',
      viewOnMap: 'عرض على الخريطة',
    },
    // Cars
    cars: {
      myCars: 'مركباتي',
      addCar: 'إضافة مركبة',
      carModel: 'موديل المركبة',
      carColor: 'اللون',
      plateNumber: 'رقم اللوحة',
      setAsDefault: 'تعيين كافتراضي',
      default: 'افتراضي',
      noCars: 'لم تتم إضافة مركبات',
      defaultVehicle: 'المركبة الافتراضية',
      addNewVehicle: 'إضافة مركبة جديدة',
      editVehicle: 'تعديل المركبة',
      saveVehicle: 'حفظ المركبة',
      deleteVehicle: 'حذف المركبة',
      selectColor: 'اختر اللون',
      enterModel: 'أدخل موديل المركبة',
      enterPlate: 'أدخل رقم اللوحة',
      vehicleAdded: 'تمت إضافة المركبة بنجاح',
      vehicleUpdated: 'تم تحديث المركبة بنجاح',
      vehicleDeleted: 'تم حذف المركبة بنجاح',
      deleteConfirm: 'هل أنت متأكد من حذف هذه المركبة؟',
      selectDefault: 'اختر كمركبة افتراضية',
    },
  },
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
        setLanguage(savedLanguage);
        // Enable RTL for Arabic
        if (savedLanguage === 'ar' && !I18nManager.isRTL) {
          I18nManager.forceRTL(true);
          // Need to restart app for RTL to take effect
        } else if (savedLanguage === 'en' && I18nManager.isRTL) {
          I18nManager.forceRTL(false);
        }
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsReady(true);
    }
  };

  const changeLanguage = async (newLanguage) => {
    if (newLanguage === language) return;

    try {
      await SecureStore.setItemAsync('app_language', newLanguage);
      setLanguage(newLanguage);

      // Enable/Disable RTL
      // Note: RTL changes require app restart to take effect
      if (newLanguage === 'ar' && !I18nManager.isRTL) {
        I18nManager.forceRTL(true);
        // User will need to restart the app for RTL to take full effect
      } else if (newLanguage === 'en' && I18nManager.isRTL) {
        I18nManager.forceRTL(false);
      }
    } catch (error) {
      console.log('Error changing language:', error);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t, isReady }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
