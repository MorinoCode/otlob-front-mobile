import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import api from '../utils/api';
import socket from '../utils/socket';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const orderId = route?.params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(null);
  const [isArrivedClicked, setIsArrivedClicked] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      console.error('Order ID is missing');
      setLoading(false);
      return;
    }
    
    fetchOrderDetails();

    // ۲. گوش دادن به تغییرات وضعیت از سمت سرور
    const handleStatusUpdate = (data) => {
      console.log('⚡ Real-time update received:', data);
      if (data && data.orderId === orderId) {
        setOrder(prevOrder => {
          if (!prevOrder) return prevOrder;
          return {
            ...prevOrder,
            status: data.status
          };
        });
      }
    };

    // Check socket connection
    console.log('🔌 Socket connected:', socket.connected);
    const handleConnect = () => {
      console.log('✅ Socket connected!');
      socket.emit('join_order', orderId);
    };
    
    if (!socket.connected) {
      console.log('⚠️ Socket not connected, waiting for connection...');
      socket.on('connect', handleConnect);
    } else {
      // ۱. اتصال به اتاق مخصوص این سفارش در سوکت
      socket.emit('join_order', orderId);
    }
    
    socket.on('order_status_updated', handleStatusUpdate);

    // ۳. پولینگ به عنوان پشتیبان (هر ۱۰ ثانیه)
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 10000);

    // Load sound file
    loadSound();

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('connect', handleConnect);
      if (interval) clearInterval(interval);
      unloadSound();
    };
  }, [orderId]);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.mp3')
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playSound = async () => {
    try {
      console.log('🔊 Attempting to play sound...');
      if (soundRef.current) {
        console.log('Sound ref exists, playing...');
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        console.log('✅ Sound played successfully');
      } else {
        console.log('⚠️ Sound ref is null, trying to reload...');
        await loadSound();
        if (soundRef.current) {
          await soundRef.current.playAsync();
          console.log('✅ Sound played after reload');
        }
      }
    } catch (error) {
      console.log('❌ Error playing sound:', error);
      console.log('Error details:', error.message);
    }
  };

  const fetchOrderDetails = async () => {
    if (!orderId) {
      console.error('Cannot fetch order details: orderId is missing');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response && response.data) {
        setOrder(response.data);
        // Debug: Log order data to check vendor_phone
        console.log('📞 Order Details:', {
          id: response.data.id,
          vendor_id: response.data.vendor_id,
          vendor_name: response.data.vendor_name,
          vendor_phone: response.data.vendor_phone,
          vendor_address: response.data.vendor_address,
          status: response.data.status,
        });
        // اگر قبلاً امتیاز ثبت شده باشد، آن را نمایش می‌دهیم
        if (response.data.rating) {
          setUserRating(response.data.rating);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error.response?.status || error.message);
      if (loading) setLoading(false);
    }
  };

  const handleRate = async (stars) => {
    try {
      await api.post(`/orders/${orderId}/rate`, { rating: stars });
      setUserRating(stars);
      Alert.alert(t('common.done') + " ⭐", "Your feedback helps us improve.");
    } catch (error) {
      console.error('Rating Error:', error);
      Alert.alert(t('auth.error'), "Could not submit rating. Please try again.");
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert(t('auth.error'), 'Restaurant phone number not available');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const navigateToRestaurant = () => {
    if (!order.vendor_latitude || !order.vendor_longitude) {
      Alert.alert(t('auth.error'), 'Restaurant location not available');
      return;
    }

    const { vendor_latitude, vendor_longitude, vendor_address } = order;
    const lat = parseFloat(vendor_latitude);
    const lng = parseFloat(vendor_longitude);

    let url;
    if (Platform.OS === 'ios') {
      // iOS Maps
      url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    } else {
      // Android - Google Maps
      url = `google.navigation:q=${lat},${lng}`;
    }

    Linking.openURL(url).catch(() => {
      // Fallback to web-based maps if app is not installed
      const fallbackUrl = Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(fallbackUrl);
    });
  };

  const canClickArrived = () => {
    if (!lastClickTime) return true;
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds
    return (now - lastClickTime) >= threeMinutes;
  };

  const getRemainingTime = () => {
    if (!lastClickTime) return 0;
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000;
    const remaining = Math.ceil((threeMinutes - (now - lastClickTime)) / 1000);
    return Math.max(0, remaining);
  };

  const handleArrivedClick = async () => {
    console.log('🔘 I\'M HERE button clicked!');
    console.log('Order status:', order.status);
    console.log('Order ID:', order.id);
    console.log('Vendor ID:', order.vendor_id);

    if (!canClickArrived()) {
      console.log('⏱️ Cooldown active, cannot click');
      Alert.alert(t('common.loading'), t('orders.cooldown') + `: ${getRemainingTime()} ${t('common.loading')}`);
      return;
    }

    try {
      console.log('📍 Requesting location permission...');
      // Request location permission and get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(t('auth.error'), 'Location permission is required to notify restaurant.');
        return;
      }

      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      console.log('Location received:', location.coords);
      const { latitude, longitude } = location.coords;

      // Play sound
      console.log('🔊 Playing sound...');
      await playSound();

      // Send notification to vendor via socket
      console.log('📡 Sending socket event i_am_here...');
      console.log('Socket connected:', socket.connected);
      
      const socketData = {
        vendorId: order.vendor_id,
        orderId: order.id,
        location: {
          latitude,
          longitude
        },
        timestamp: new Date().toISOString()
      };
      console.log('Socket data to send:', JSON.stringify(socketData, null, 2));
      
      // Ensure socket is connected
      if (!socket.connected) {
        console.log('⚠️ Socket not connected, waiting for connection...');
        socket.connect();
        socket.once('connect', () => {
          console.log('✅ Socket connected, emitting event...');
          socket.emit('i_am_here', socketData);
        });
      } else {
        socket.emit('i_am_here', socketData);
        console.log('✅ Socket event emitted');
      }

      // Update state
      setLastClickTime(Date.now());
      setIsArrivedClicked(true);
      console.log('✅ State updated');

      Alert.alert(
        t('common.done') + " 🎉",
        "They will bring the order to your car immediately.",
        [{ text: t('common.close') }]
      );

      // Reset button state after 3 minutes
      setTimeout(() => {
        setIsArrivedClicked(false);
      }, 3 * 60 * 1000);

    } catch (error) {
      console.error('❌ Error in handleArrivedClick:', error);
      console.error('Error details:', error.message);
      Alert.alert(t('auth.error'), `Could not send notification: ${error.message || 'Please try again.'}`);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['PENDING', 'COOKING', 'READY', 'COMPLETED'];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Order not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 20}}>
          <Text style={{color: colors.primary}}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('orders.orderDetails')}</Text>
        {order.vendor_latitude && order.vendor_longitude ? (
          <TouchableOpacity 
            onPress={navigateToRestaurant}
            style={styles.navigateButton}
          >
            <Ionicons name="navigate" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Rating Section - Only shows if order is COMPLETED */}
        {order.status === 'COMPLETED' && (
          <View style={[styles.ratingCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.ratingTitle, { color: isDark ? '#fff' : colors.text }]}>Rate your experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => handleRate(s)}>
                  <Ionicons 
                    name={s <= userRating ? "star" : "star-outline"} 
                    size={35} 
                    color={s <= userRating ? "#FFD700" : colors.textLight} 
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingHint, { color: colors.textSecondary }]}>
              {userRating > 0 ? "Thanks for your feedback!" : "How was the food and service?"}
            </Text>
          </View>
        )}

        {/* Real-time Timeline */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Progress</Text>
          <View style={styles.timeline}>
            {[
              { label: 'Order Placed', icon: 'clipboard-check', status: 'PENDING' },
              { label: 'Cooking', icon: 'fire', status: 'COOKING' },
              { label: 'Ready for Pickup', icon: 'shuttle-van', status: 'READY' },
              { label: 'Completed', icon: 'check-double', status: 'COMPLETED' },
            ].map((step, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.iconColumn}>
                  <View style={[
                    styles.iconCircle, 
                    index <= currentStep ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}>
                    <FontAwesome5 
                      name={step.icon} 
                      size={14} 
                      color={index <= currentStep ? '#fff' : colors.textLight} 
                    />
                  </View>
                  {index < 3 && <View style={[
                    styles.line, 
                    { backgroundColor: index < currentStep ? colors.primary : colors.border }
                  ]} />}
                </View>
                <View style={styles.textColumn}>
                  <Text style={[
                    styles.statusLabel, 
                    { color: index <= currentStep ? colors.text : colors.textLight }
                  ]}>
                    {step.label}
                  </Text>
                  {index === currentStep && (
                    <Text style={[styles.currentStepBadge, { color: colors.primary }]}>Processing Now</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info & Notes */}
        <View style={styles.infoSection}>
          <View style={styles.detailsRow}>
            <View style={[styles.detailBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="car-sport" size={24} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>My Vehicle</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{order.car_model}</Text>
              <Text style={[styles.detailSubValue, { color: colors.primary }]}>{order.car_plate}</Text>
            </View>
            <View style={[styles.detailBox, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="storefront" size={24} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>From</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{order.vendor_name}</Text>
              {order.vendor_address && (
                <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>{order.vendor_address}</Text>
              )}
              <TouchableOpacity 
                onPress={() => {
                  if (order.vendor_phone) {
                    handleCall(order.vendor_phone);
                  } else {
                    Alert.alert('No Phone Number', 'Restaurant phone number is not available');
                  }
                }}
                style={[
                  styles.callRestaurantLink,
                  { backgroundColor: order.vendor_phone ? '#E3F2FD' : colors.surface },
                  !order.vendor_phone && styles.callRestaurantLinkDisabled
                ]}
                disabled={!order.vendor_phone}
              >
                <Ionicons 
                  name="call-outline" 
                  size={14} 
                  color={order.vendor_phone ? "#2196F3" : colors.textLight} 
                />
                <Text style={[
                  styles.callRestaurantText,
                  { color: order.vendor_phone ? "#2196F3" : colors.textLight }
                ]}>
                  {order.vendor_phone ? t('orders.callRestaurant') : 'Phone Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.noteSection, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.noteTitle, { color: colors.primary }]}>Your Pickup Instructions</Text>
            <View style={styles.noteContent}>
              <MaterialCommunityIcons name="comment-text-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.noteText, { color: colors.text }]}>
                {order.customer_note || "No specific note provided."}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigate to Restaurant Button */}
        {order.status !== 'COMPLETED' && order.vendor_latitude && order.vendor_longitude && (
          <TouchableOpacity 
            style={styles.navigateBtn}
            onPress={navigateToRestaurant}
          >
            <MaterialCommunityIcons name="map-marker" size={24} color="#fff" />
            <View style={styles.navigateBtnTextContainer}>
              <Text style={styles.navigateBtnText}>{t('orders.navigateRestaurant')}</Text>
              <Text style={styles.navigateBtnSubText}>Open Maps for directions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Action Button */}
        {order.status !== 'COMPLETED' && (
          <TouchableOpacity 
            style={[
              styles.arrivedBtn, 
              styles.btnActive,
              isArrivedClicked && styles.btnArrivedClicked,
              !canClickArrived() && styles.btnDisabledClick
            ]}
            onPress={() => {
              console.log('TouchableOpacity onPress triggered');
              console.log('Can click:', canClickArrived());
              handleArrivedClick();
            }}
            disabled={!canClickArrived()}
            activeOpacity={0.7}
          >
            <View style={styles.arrivedBtnContent}>
              <MaterialCommunityIcons 
                name={isArrivedClicked ? "check-circle" : "car-connected"} 
                size={36} 
                color="#fff" 
              />
              <View style={styles.arrivedBtnTextContainer}>
                <Text style={styles.arrivedText}>
                  {isArrivedClicked ? "NOTIFIED ✓" : t('orders.imHere')}
                </Text>
                <Text style={styles.arrivedSubText}>
                  {isArrivedClicked 
                    ? "Restaurant has been notified!" 
                    : "Notify restaurant that you have arrived"}
                </Text>
                {!canClickArrived() && lastClickTime && (
                  <Text style={styles.cooldownText}>
                    Available in {getRemainingTime()}s
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  navigateButton: {
    padding: 4,
  },
  scrollContent: { padding: 20 },
  
  // Rating Style
  ratingCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  ratingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  ratingHint: { fontSize: 12 },

  statusCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  timeline: { paddingLeft: 5 },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  iconColumn: { alignItems: 'center', marginRight: 15 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
  },
  line: { width: 2, flex: 1, marginVertical: -4, zIndex: 1 },
  textColumn: { paddingTop: 2 },
  statusLabel: { fontSize: 15, fontWeight: '600' },
  currentStepBadge: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  infoSection: { marginTop: 5 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailBox: { width: '48%', padding: 12, borderRadius: 12, alignItems: 'center' },
  detailLabel: { fontSize: 11, marginTop: 4 },
  detailValue: { fontWeight: 'bold', fontSize: 13, marginTop: 2 },
  detailSubValue: { fontSize: 10, fontWeight: 'bold' },
  addressText: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  callRestaurantLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  callRestaurantText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  callRestaurantLinkDisabled: {
    opacity: 0.6,
  },
  noteSection: { padding: 12, borderRadius: 12, borderLeftWidth: 4 },
  noteTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  noteContent: { flexDirection: 'row', alignItems: 'center' },
  noteText: { flex: 1, marginLeft: 8, fontSize: 13, lineHeight: 18 },
  arrivedBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: '#FF5722',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  btnActive: { 
    opacity: 1,
    backgroundColor: '#4CAF50',
  },
  btnDisabled: { 
    backgroundColor: '#FFCCBC',
    opacity: 0.7,
  },
  btnDisabledClick: {
    opacity: 0.5,
  },
  btnArrivedClicked: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  arrivedBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBtnTextContainer: {
    marginLeft: 16,
    alignItems: 'center',
    flex: 1,
  },
  arrivedText: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  arrivedSubText: { 
    color: '#fff', 
    fontSize: 13, 
    opacity: 0.95, 
    marginTop: 4,
    textAlign: 'center',
  },
  cooldownText: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '600',
  },
  
  // Navigate Button Styles
  navigateBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2196F3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateBtnTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  navigateBtnSubText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default OrderDetailsScreen;