import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';

const CheckoutScreen = ({ route, navigation }) => {
  const { cart, vendorId, total } = route.params;
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await api.get('/cars');
      setCars(response.data);
      // انتخاب ماشین پیش‌فرض یا اولین ماشین
      const defaultCar = response.data.find(c => c.is_default) || response.data[0];
      if (defaultCar) setSelectedCar(defaultCar.id);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Could not load your cars');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedCar) {
      Alert.alert('Attention', 'Please select a car for delivery 🚗');
      return;
    }

    setProcessing(true);
    
    // تبدیل آبجکت سبد خرید به آرایه‌ای که سرور میخواد
    const orderItems = Object.values(cart).map(item => ({
      menu_item_id: item.id,
      quantity: item.quantity
    }));

    try {
      const payload = {
        vendor_id: vendorId,
        car_id: selectedCar,
        payment_method: 'CASH',
        items: orderItems,
        pickup_time: new Date().toISOString()
      };

      const response = await api.post('/orders', payload);
      const createdOrder = response.data; // یا response.data.order (بسته به بک‌ند)

      // پاک کردن سبد خرید و رفتن به صفحه پیگیری
      Alert.alert('Order Placed! 🎉', 'Your order has been sent to the restaurant.', [
        { 
          text: 'Track Order', 
          onPress: () => navigation.replace('OrderDetails', { 
            orderId: createdOrder.id || createdOrder.order_id, // هندل کردن هر دو حالت
            vendorId: vendorId,
            carId: selectedCar
          }) 
        }
      ]);

    } catch (error) {
      console.log(error);
      Alert.alert('Order Failed', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF5722" /></View>;

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* بخش 1: خلاصه سفارش (Receipt Style) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.receiptCard}>
            {Object.values(cart).map((item) => (
              <View key={item.id} style={styles.receiptRow}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemQty}>{item.quantity}x</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(3)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{total.toFixed(3)} KD</Text>
            </View>
          </View>
        </View>

        {/* بخش 2: انتخاب ماشین */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliver to Car 🚗</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carsList}>
            {cars.map((car) => (
              <TouchableOpacity 
                key={car.id} 
                style={[styles.carCard, selectedCar === car.id && styles.carCardActive]}
                onPress={() => setSelectedCar(car.id)}
              >
                <View style={styles.carIconBox}>
                  <Ionicons name="car-sport" size={28} color={selectedCar === car.id ? '#fff' : '#FF5722'} />
                </View>
                <Text style={[styles.carModel, selectedCar === car.id && styles.textActive]}>{car.model}</Text>
                <Text style={[styles.carColor, selectedCar === car.id && styles.textActive]}>{car.color}</Text>
                <Text style={[styles.carPlate, selectedCar === car.id && styles.textActive]}>{car.plate_number}</Text>
                
                {selectedCar === car.id && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={12} color="#FF5722" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            {/* دکمه افزودن ماشین جدید */}
            <TouchableOpacity style={styles.addCarBtn} onPress={() => navigation.navigate('AddCar')}>
              <Ionicons name="add" size={30} color="#ccc" />
              <Text style={styles.addCarText}>New Car</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* بخش 3: روش پرداخت */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentOption}>
              <MaterialCommunityIcons name="cash" size={24} color="#2E7D32" />
              <Text style={styles.paymentText}>Cash on Delivery</Text>
              <Ionicons name="radio-button-on" size={24} color="#FF5722" />
            </View>
            {/* اینجا بعدا K-NET اضافه میشه */}
          </View>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.placeOrderBtn} 
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.btnText}>PLACE ORDER</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
            </View>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },

  scrollContent: { padding: 20, paddingBottom: 100 },
  
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15, marginLeft: 5 },

  // Receipt Style
  receiptCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  itemQty: { color: '#FF5722', fontWeight: 'bold', fontSize: 12 },
  itemName: { flex: 1, fontSize: 16, color: '#333' },
  itemPrice: { fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#eee' }, // خط چین
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#FF5722' },

  // Car Selection
  carsList: { paddingRight: 20 },
  carCard: { width: 140, height: 160, backgroundColor: '#fff', borderRadius: 15, padding: 15, marginRight: 15, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  carCardActive: { borderColor: '#FF5722', backgroundColor: '#FF5722' },
  carIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  carModel: { fontWeight: 'bold', fontSize: 14, color: '#333', textAlign: 'center' },
  carColor: { fontSize: 12, color: '#666', marginTop: 2 },
  carPlate: { fontSize: 12, color: '#999', marginTop: 2, fontWeight: 'bold' },
  textActive: { color: '#fff' },
  checkCircle: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  
  addCarBtn: { width: 100, height: 160, borderRadius: 15, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addCarText: { color: '#999', marginTop: 5, fontWeight: 'bold' },

  // Payment
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  paymentText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#f0f0f0' },
  placeOrderBtn: { backgroundColor: '#FF5722', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5722', shadowOpacity: 0.3, elevation: 5 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});

export default CheckoutScreen;