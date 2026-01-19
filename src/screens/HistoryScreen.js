import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const HistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my');
      setOrders(response.data);
    } catch (error) {
      console.log('Fetch Orders Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReOrder = async (order) => {
    try {
      // ۱. دریافت آیتم‌های سفارش قدیمی از سرور
      const response = await api.get(`/orders/${order.id}/items`);
      const items = response.data;

      // ۲. تبدیل به فرمت سبد خرید (Object)
      const cartToRestore = {};
      items.forEach(item => {
        cartToRestore[item.id] = {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity
        };
      });

      // ۳. هدایت به صفحه رستوران با سبد خرید پر شده
      navigation.navigate('VendorDetails', { 
        vendor: { id: order.vendor_id, name: order.vendor_name },
        initialCart: cartToRestore 
      });

    } catch (error) {
      Alert.alert("Error", "Could not restore the cart.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFF3E0', text: '#FF9800', label: 'Processing' };
      case 'COOKING': return { bg: '#E3F2FD', text: '#2196F3', label: 'Cooking' };
      case 'READY': return { bg: '#E8F5E9', text: '#4CAF50', label: 'Ready' };
      case 'COMPLETED': return { bg: '#F5F5F5', text: '#757575', label: 'Finished' };
      default: return { bg: '#eee', text: '#000', label: status };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <View style={styles.card}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.vendorName}>{item.vendor_name}</Text>
              <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#999" />
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.priceText}>{Number(item.total_price).toFixed(3)} KD</Text>
          </View>
        </TouchableOpacity>

        {/* دکمه‌های عملیاتی */}
        <View style={styles.actionsRow}>
          {item.status === 'COMPLETED' ? (
            <TouchableOpacity 
              style={styles.reOrderBtn} 
              onPress={() => handleReOrder(item)}
            >
              <Ionicons name="refresh" size={16} color="#FF5722" />
              <Text style={styles.reOrderText}>Order Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.trackBtn} 
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            >
              <Text style={styles.trackText}>Track Live</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF5722" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#FF5722']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vendorName: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#999', fontSize: 13, marginLeft: 5 },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  actionsRow: { borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 12 },
  reOrderBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF5722' },
  reOrderText: { color: '#FF5722', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5722', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  trackText: { color: '#fff', fontWeight: 'bold', marginRight: 5, fontSize: 13 },
});

export default HistoryScreen;