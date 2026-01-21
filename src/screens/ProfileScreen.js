import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const { totalItems, showCart } = useCart();
  const { t, language, changeLanguage } = useI18n();
  const { theme, isDark, colors, changeTheme } = useTheme();
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      const response = await api.get('/cars');
      setCars(response.data || []);
    } catch (error) {
      console.log('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    Alert.alert(
      t('profile.selectLanguage'),
      language === 'en' 
        ? 'تغيير اللغة إلى العربية؟' 
        : 'Change language to English?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await changeLanguage(newLanguage);
            Alert.alert(
              t('common.done'),
              newLanguage === 'ar' 
                ? 'تم تغيير اللغة. قد تحتاج إلى إعادة تشغيل التطبيق.'
                : 'Language changed. You may need to restart the app.',
              [{ text: t('common.close') }]
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('profile.loadingProfile')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const defaultCar = cars.find(c => c.is_default) || cars[0];

  const menuSections = [
    {
      title: t('profile.quickActions'),
      items: [
        {
          id: 'cart',
          icon: 'cart-outline',
          label: t('profile.cart'),
          badge: totalItems > 0 ? totalItems : null,
          onPress: () => {
            if (totalItems > 0) {
              showCart();
            }
          }
        },
        {
          id: 'orders',
          icon: 'receipt-outline',
          label: t('profile.orders'),
          onPress: () => navigation.navigate('Orders')
        },
        {
          id: 'cars',
          icon: 'car-outline',
          label: t('profile.cars'),
          badge: cars.length > 0 ? cars.length : null,
          onPress: () => navigation.navigate('MyCars')
        }
      ]
    },
    {
      title: t('profile.settings'),
      items: [
        {
          id: 'language',
          icon: 'language-outline',
          label: t('profile.language'),
          rightText: language === 'en' ? 'English' : 'العربية',
          onPress: handleLanguageChange
        },
        {
          id: 'theme',
          icon: isDark ? 'sunny-outline' : 'moon-outline',
          label: isDark ? t('profile.lightMode') : t('profile.darkMode'),
          rightComponent: (
            <Switch
              value={isDark}
              onValueChange={(value) => changeTheme(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          )
        }
      ]
    },
    {
      title: t('profile.support'),
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: t('profile.helpSupport'),
          onPress: () => Alert.alert(t('profile.helpSupport'), 'Contact support: support@otlob.com')
        },
        {
          id: 'about',
          icon: 'information-circle-outline',
          label: t('profile.about'),
          onPress: () => Alert.alert(t('profile.about'), 'Otlob App v1.0.0\nFood delivery to your car')
        }
      ]
    }
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        { 
          backgroundColor: colors.card,
          borderBottomColor: colors.border 
        }
      ]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name={item.icon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>
          {item.label}
        </Text>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      {item.rightText ? (
        <Text style={[styles.menuItemRight, { color: colors.textSecondary }]}>
          {item.rightText}
        </Text>
      ) : item.rightComponent ? (
        item.rightComponent
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.full_name || 'User'}
              </Text>
              <Text style={[styles.userPhone, { color: colors.textSecondary }]}>
                {user?.phone_number || ''}
              </Text>
            </View>
          </View>

          {/* Default Car Info */}
          {defaultCar && (
            <View style={[styles.carInfo, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="car" size={20} color={colors.primary} />
              <View style={styles.carInfoText}>
                <Text style={[styles.carModel, { color: colors.text }]}>
                  {defaultCar.model}
                </Text>
                <Text style={[styles.carDetails, { color: colors.textSecondary }]}>
                  {defaultCar.color} • {defaultCar.plate_number}
                </Text>
              </View>
              {defaultCar.is_default && (
                <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.defaultBadgeText}>{t('profile.active')}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t('auth.logout')}
          </Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textLight }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // Header
  header: {
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Car Info
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  carInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  carModel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  carDetails: {
    fontSize: 13,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  menuItemRight: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});

export default ProfileScreen;
