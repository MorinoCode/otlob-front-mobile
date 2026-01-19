import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

const HistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // هر بار که کاربر وارد تب میشه، لیست آپدیت شه
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFF3E0', text: '#FF9800' };
      case 'COOKING': return { bg: '#E3F2FD', text: '#2196F3' };
      case 'READY': return { bg: '#E8F5E9', text: '#4CAF50' };
      case 'COMPLETED': return { bg: '#EEEEEE', text: '#616161' };
      default: return { bg: '#eee', text: '#000' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', {
          orderId: item.id,
          vendorId: item.vendor_id,
          carId: item.car_id
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.vendorName}>{item.vendor_name || 'Restaurant'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View>
             <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
             <Text style={styles.itemsText}>Order #{item.id.toString().slice(-4)}</Text>
          </View>
          <Text style={styles.priceText}>{Number(item.total_price).toFixed(3)} KD</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF5722" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders 🧾</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders yet.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.linkText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#FF5722']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },

  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  dateText: { color: '#999', fontSize: 12, marginBottom: 2 },
  itemsText: { color: '#666', fontSize: 14 },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#FF5722' },

  emptyText: { fontSize: 16, color: '#999', marginBottom: 10 },
  linkText: { fontSize: 16, color: '#FF5722', fontWeight: 'bold' }
});

export default HistoryScreen;