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
import { useCart } from '../context/CartContext';

const HistoryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { totalItems, showCart } = useCart();

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [activeTab])
  );

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my');
      const allOrders = response.data;
      
      // Filter based on active tab
      if (activeTab === 'active') {
        // Show orders that are NOT completed
        const activeOrders = allOrders.filter(order => 
          order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
        );
        setOrders(activeOrders);
      } else {
        // Show completed orders
        const completedOrders = allOrders.filter(order => 
          order.status === 'COMPLETED'
        );
        setOrders(completedOrders);
      }
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
      navigation.navigate('Menu', { 
        vendorId: order.vendor_id, 
        vendorName: order.vendor_name
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
      case 'COMPLETED': return { bg: '#F5F5F5', text: '#757575', label: 'Completed' };
      case 'ACCEPTED': return { bg: '#E1F5FE', text: '#0288D1', label: 'Accepted' };
      case 'CANCELLED': return { bg: '#FFEBEE', text: '#D32F2F', label: 'Cancelled' };
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
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.cartButton} onPress={showCart}>
          <Ionicons name="cart-outline" size={28} color="#333" />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active Orders
          </Text>
          {activeTab === 'active' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Order History
          </Text>
          {activeTab === 'history' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'active' ? 'hourglass-outline' : 'receipt-outline'} size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'No active orders' 
                : 'No completed orders yet'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { 
              setRefreshing(true); 
              fetchOrders(); 
            }} 
            colors={['#FF5722']} 
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  cartButton: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#FF5722',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF5722',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  
  list: { padding: 15, paddingBottom: 100 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 15, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  vendorName: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 11, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardBody: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#999', fontSize: 13, marginLeft: 5 },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  actionsRow: { 
    borderTopWidth: 1, 
    borderTopColor: '#f5f5f5', 
    paddingTop: 12 
  },
  reOrderBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#FF5722',
    backgroundColor: '#fff'
  },
  reOrderText: { 
    color: '#FF5722', 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  trackBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FF5722', 
    alignSelf: 'flex-start', 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 8,
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  trackText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginRight: 6, 
    fontSize: 14 
  },
});

export default HistoryScreen;
