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
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

const HistoryScreen = ({ navigation }) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
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
      Alert.alert(t('auth.error'), "Could not restore the cart.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFF3E0', text: '#FF9800', label: t('orders.pending') };
      case 'COOKING': return { bg: '#E3F2FD', text: '#2196F3', label: t('orders.cooking') };
      case 'READY': return { bg: '#E8F5E9', text: '#4CAF50', label: t('orders.ready') };
      case 'COMPLETED': return { bg: '#F5F5F5', text: '#757575', label: t('orders.completed') };
      case 'ACCEPTED': return { bg: '#E1F5FE', text: '#0288D1', label: t('orders.accepted') };
      case 'CANCELLED': return { bg: '#FFEBEE', text: '#D32F2F', label: t('orders.cancelled') };
      default: return { bg: '#eee', text: '#000', label: status };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.vendorName, { color: colors.text }]}>{item.vendor_name}</Text>
              <Text style={[styles.orderId, { color: colors.textLight }]}>Order #{item.id.toString().slice(-4)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
              <Text style={[styles.dateText, { color: colors.textLight }]}>
                {new Date(item.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <Text style={[styles.priceText, { color: colors.text }]}>{Number(item.total_price).toFixed(3)} KD</Text>
          </View>
        </TouchableOpacity>

        {/* دکمه‌های عملیاتی */}
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          {item.status === 'COMPLETED' ? (
            <TouchableOpacity 
              style={[styles.reOrderBtn, { borderColor: colors.primary }]} 
              onPress={() => handleReOrder(item)}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.reOrderText, { color: colors.primary }]}>{t('orders.reOrder')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.trackBtn, { backgroundColor: colors.primary }]} 
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            >
              <Text style={styles.trackText}>{t('orders.trackOrder')}</Text>
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('orders.orders')}</Text>
        <TouchableOpacity style={styles.cartButton} onPress={showCart}>
          <Ionicons name="cart-outline" size={28} color={colors.text} />
          {totalItems > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: colors.textLight }, activeTab === 'active' && { color: colors.primary }]}>
            {t('orders.activeOrders')}
          </Text>
          {activeTab === 'active' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: colors.textLight }, activeTab === 'history' && { color: colors.primary }]}>
            {t('orders.orderHistory')}
          </Text>
          {activeTab === 'history' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'active' ? 'hourglass-outline' : 'receipt-outline'} size={64} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              {activeTab === 'active' 
                ? t('orders.noActiveOrders') 
                : t('orders.noOrderHistory')}
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
            colors={[colors.primary]} 
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  cartButton: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
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
    borderBottomWidth: 1,
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
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
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
    fontWeight: '500',
  },
  
  card: { 
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
  vendorName: { fontSize: 17, fontWeight: 'bold' },
  orderId: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardBody: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 13, marginLeft: 5 },
  priceText: { fontSize: 18, fontWeight: 'bold' },
  
  actionsRow: { 
    borderTopWidth: 1, 
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
    backgroundColor: 'transparent'
  },
  reOrderText: { 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  trackBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 8,
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
