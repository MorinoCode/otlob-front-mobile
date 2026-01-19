import React, { useState, useEffect } from 'react';
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
import api from '../utils/api';
import socket from '../utils/socket';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    fetchOrderDetails();

    // ۱. اتصال به اتاق مخصوص این سفارش در سوکت
    socket.emit('join_order', orderId);

    // ۲. گوش دادن به تغییرات وضعیت از سمت سرور
    socket.on('order_status_updated', (data) => {
      console.log('⚡ Real-time update received:', data);
      if (data.orderId === orderId) {
        setOrder(prevOrder => ({
          ...prevOrder,
          status: data.status
        }));
      }
    });

    // ۳. پولینگ به عنوان پشتیبان (هر ۱۰ ثانیه)
    const interval = setInterval(fetchOrderDetails, 10000);

    return () => {
      socket.off('order_status_updated');
      clearInterval(interval);
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
      // اگر قبلاً امتیاز ثبت شده باشد، آن را نمایش می‌دهیم
      if (response.data.rating) {
        setUserRating(response.data.rating);
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
      Alert.alert("Thank you! ⭐", "Your feedback helps us improve.");
    } catch (error) {
      console.error('Rating Error:', error);
      Alert.alert("Error", "Could not submit rating. Please try again.");
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Restaurant phone number not available');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const getStatusStep = (status) => {
    const steps = ['PENDING', 'COOKING', 'READY', 'COMPLETED'];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 20}}>
          <Text style={{color: '#FF5722'}}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity onPress={() => handleCall(order.vendor_phone)}>
          <Ionicons name="call" size={24} color="#FF5722" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Rating Section - Only shows if order is COMPLETED */}
        {order.status === 'COMPLETED' && (
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate your experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => handleRate(s)}>
                  <Ionicons 
                    name={s <= userRating ? "star" : "star-outline"} 
                    size={35} 
                    color={s <= userRating ? "#FFD700" : "#ccc"} 
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {userRating > 0 ? "Thanks for your feedback!" : "How was the food and service?"}
            </Text>
          </View>
        )}

        {/* Real-time Timeline */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
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
                    index <= currentStep ? styles.activeCircle : styles.inactiveCircle
                  ]}>
                    <FontAwesome5 
                      name={step.icon} 
                      size={14} 
                      color={index <= currentStep ? '#fff' : '#ccc'} 
                    />
                  </View>
                  {index < 3 && <View style={[
                    styles.line, 
                    index < currentStep ? styles.activeLine : styles.inactiveLine
                  ]} />}
                </View>
                <View style={styles.textColumn}>
                  <Text style={[
                    styles.statusLabel, 
                    index <= currentStep ? styles.activeText : styles.inactiveText
                  ]}>
                    {step.label}
                  </Text>
                  {index === currentStep && (
                    <Text style={styles.currentStepBadge}>Processing Now</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info & Notes */}
        <View style={styles.infoSection}>
          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <Ionicons name="car-sport" size={24} color="#FF5722" />
              <Text style={styles.detailLabel}>My Vehicle</Text>
              <Text style={styles.detailValue}>{order.car_model}</Text>
              <Text style={styles.detailSubValue}>{order.car_plate}</Text>
            </View>
            <View style={styles.detailBox}>
              <MaterialCommunityIcons name="storefront" size={24} color="#FF5722" />
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{order.vendor_name}</Text>
              <TouchableOpacity onPress={() => handleCall(order.vendor_phone)}>
                <Text style={styles.callLink}>Call Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Your Pickup Instructions</Text>
            <View style={styles.noteContent}>
              <MaterialCommunityIcons name="comment-text-outline" size={20} color="#666" />
              <Text style={styles.noteText}>
                {order.customer_note || "No specific note provided."}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {order.status !== 'COMPLETED' && (
          <TouchableOpacity 
            style={[
              styles.arrivedBtn, 
              order.status === 'READY' ? styles.btnActive : styles.btnDisabled
            ]}
            onPress={() => {
              if(order.status === 'READY') {
                Alert.alert("Restaurant Notified", "They will bring the order to your car immediately.");
              } else {
                Alert.alert("Hang tight!", "The restaurant is still preparing your food.");
              }
            }}
          >
            <MaterialCommunityIcons name="car-connected" size={32} color="#fff" />
            <Text style={styles.arrivedText}>I'M HERE 🏎️</Text>
            <Text style={styles.arrivedSubText}>Wait for 'Ready' status to notify restaurant</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20 },
  
  // Rating Style
  ratingCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  ratingTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  ratingHint: { fontSize: 12, color: '#777' },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 20 },
  timeline: { paddingLeft: 5 },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  iconColumn: { alignItems: 'center', marginRight: 15 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  activeCircle: { backgroundColor: '#FF5722' },
  inactiveCircle: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#eee' },
  line: { width: 2, flex: 1, marginVertical: -4, zIndex: 1 },
  activeLine: { backgroundColor: '#FF5722' },
  inactiveLine: { backgroundColor: '#eee' },
  textColumn: { paddingTop: 2 },
  statusLabel: { fontSize: 15, fontWeight: '600' },
  activeText: { color: '#333' },
  inactiveText: { color: '#bbb' },
  currentStepBadge: { color: '#FF5722', fontSize: 11, fontWeight: '700', marginTop: 1 },
  infoSection: { marginTop: 5 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailBox: { backgroundColor: '#F9F9F9', width: '48%', padding: 12, borderRadius: 12, alignItems: 'center' },
  detailLabel: { color: '#999', fontSize: 11, marginTop: 4 },
  detailValue: { fontWeight: 'bold', color: '#333', fontSize: 13, marginTop: 2 },
  detailSubValue: { color: '#FF5722', fontSize: 10, fontWeight: 'bold' },
  callLink: { color: '#2196F3', fontSize: 11, marginTop: 4, textDecorationLine: 'underline' },
  noteSection: { backgroundColor: '#FFF8F1', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF5722' },
  noteTitle: { fontSize: 12, fontWeight: 'bold', color: '#FF5722', marginBottom: 4 },
  noteContent: { flexDirection: 'row', alignItems: 'center' },
  noteText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#555', lineHeight: 18 },
  arrivedBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  btnActive: { opacity: 1 },
  btnDisabled: { backgroundColor: '#FFCCBC' },
  arrivedText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  arrivedSubText: { color: '#fff', fontSize: 12, opacity: 0.9, marginTop: 2 }
});

export default OrderDetailsScreen;