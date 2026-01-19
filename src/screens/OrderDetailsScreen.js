import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Animated
} from 'react-native';
import io from 'socket.io-client';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api, { API_URL } from '../utils/api';

// اتصال به سوکت (حذف /api از انتهای آدرس)
const SOCKET_URL = API_URL.replace('/api', '');

const STEPS = [
  { id: 'PENDING', label: 'Order Placed', icon: 'clipboard-check-outline' },
  { id: 'COOKING', label: 'Cooking', icon: 'stove' },
  { id: 'READY', label: 'Ready for Pickup', icon: 'food' },
  { id: 'COMPLETED', label: 'Completed', icon: 'check-circle-outline' },
];

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId, vendorId, carId } = route.params;
  const [status, setStatus] = useState('PENDING'); 
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // انیمیشن برای دکمه "I'm Here"
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // شروع انیمیشن تپش
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();

    // اتصال سوکت
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Socket Connected');
      newSocket.emit('join_order', orderId); 
    });

    newSocket.on('order_status_updated', (data) => {
      setStatus(data.status);
      if (data.status === 'READY') {
        Alert.alert('Food is Ready! 🍔', 'Please drive to the pickup zone and press "I\'m Here".');
      }
    });

    return () => newSocket.disconnect();
  }, []);

  const handleIAmHere = () => {
    if (!socket) return;
    
    // ارسال سیگنال به رستوران
    socket.emit('i_am_here', {
      vendorId: vendorId,
      orderId: orderId,
    });

    Alert.alert('Signal Sent! 📡', 'The restaurant staff has been notified that you are waiting outside.');
  };

  const getStepColor = (stepId) => {
    const statusOrder = ['PENDING', 'COOKING', 'READY', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return '#4CAF50'; // گذشته (سبز)
    if (stepIndex === currentIndex) return '#FF5722'; // حال (نارنجی)
    return '#E0E0E0'; // آینده (خاکستری)
  };

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderId.toString().slice(-4)}</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Status Tracker */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Status Timeline</Text>
          <View style={styles.timeline}>
            {STEPS.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={step.icon} 
                    size={24} 
                    color={getStepColor(step.id) === '#E0E0E0' ? '#999' : '#fff'} 
                  />
                  <View style={[styles.circle, { backgroundColor: getStepColor(step.id) }]} />
                  {index !== STEPS.length - 1 && <View style={styles.line} />}
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.stepLabel, { 
                    color: getStepColor(step.id) === '#E0E0E0' ? '#999' : '#333',
                    fontWeight: status === step.id ? 'bold' : 'normal'
                  }]}>
                    {step.label}
                  </Text>
                  {status === step.id && <Text style={styles.activeBadge}>Current Step</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Area */}
        <View style={styles.actionArea}>
          <Text style={styles.instructionText}>
            Please park your car in the designated area.
          </Text>
          
          <Animated.View style={{ transform: [{ scale: status === 'READY' ? pulseAnim : 1 }] }}>
            <TouchableOpacity 
              style={[
                styles.bigButton, 
                status !== 'READY' && status !== 'COOKING' && status !== 'PENDING' && styles.disabledButton 
              ]}
              onPress={handleIAmHere}
              disabled={status === 'COMPLETED'}
            >
              <MaterialCommunityIcons name="car-connected" size={40} color="#fff" />
              <Text style={styles.bigButtonText}>I'VE ARRIVED 🚗</Text>
              <Text style={styles.bigButtonSub}>Tap when you are at the restaurant</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },

  content: { padding: 20 },

  statusCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 20 },
  
  timeline: { paddingLeft: 10 },
  stepRow: { flexDirection: 'row', marginBottom: 25 },
  iconContainer: { alignItems: 'center', marginRight: 15, width: 30 },
  circle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 15, opacity: 0.2, zIndex: -1 },
  line: { width: 2, height: 30, backgroundColor: '#eee', position: 'absolute', top: 30, left: 14 },
  
  textContainer: { justifyContent: 'center' },
  stepLabel: { fontSize: 16 },
  activeBadge: { color: '#FF5722', fontSize: 12, fontWeight: 'bold', marginTop: 2 },

  actionArea: { alignItems: 'center', marginTop: 20 },
  instructionText: { color: '#666', marginBottom: 20, fontStyle: 'italic' },
  
  bigButton: { backgroundColor: '#FF5722', width: '100%', paddingVertical: 25, borderRadius: 20, alignItems: 'center', shadowColor: '#FF5722', shadowOpacity: 0.4, shadowOffset: {width:0, height:5}, elevation: 10 },
  disabledButton: { backgroundColor: '#ccc', shadowOpacity: 0 },
  bigButtonText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  bigButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 }
});

export default OrderDetailsScreen;