import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import FloatingCart from '../../components/FloatingCart';

const MENU_CATS = [
  { name: 'All', icon: 'apps' },
  { name: 'Popular', icon: 'fire' },
  { name: 'Burgers', icon: 'hamburger' },
  { name: 'Sides', icon: 'food-fork-drink' },
  { name: 'Drinks', icon: 'cup' },
];

const MenuScreen = ({ route, navigation }) => {
  const vendorId = route?.params?.vendorId;
  const vendorName = route?.params?.vendorName || 'Restaurant';
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { t } = useI18n();
  const { colors } = useTheme();
  
  const [menu, setMenu] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  
  const getCategoryIcon = (catName) => {
    const cat = MENU_CATS.find(c => c.name === catName);
    return cat ? cat.icon : 'apps';
  };
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [200, 60],
    extrapolate: 'clamp'
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    if (!vendorId) {
      console.error('Vendor ID is missing');
      setLoading(false);
      return;
    }
    fetchVendorAndMenu();
  }, [vendorId]);

  const fetchVendorAndMenu = async () => {
    if (!vendorId) {
      console.error('Cannot fetch data: vendorId is missing');
      setLoading(false);
      return;
    }
    
    try {
      const [menuRes, vendorRes] = await Promise.all([
        api.get(`/vendors/${vendorId}/menu`),
        api.get(`/vendors/${vendorId}`)
      ]);
      
      setMenu(menuRes.data);
      
      // Set vendor info from API response
      if (vendorRes.data) {
        setVendorInfo({
          rating: vendorRes.data.rating || 0,
          ratingCount: vendorRes.data.rating_count || 0,
          isOpen: vendorRes.data.is_open || false,
          openingTime: '06:00', // Default - can be added to database later
          closingTime: '02:00'  // Default - can be added to database later
        });
      }

    } catch (error) {
      console.log('Error fetching data:', error);
      // Set default values on error
      setVendorInfo({
        rating: 0,
        ratingCount: 0,
        isOpen: false,
        openingTime: '06:00',
        closingTime: '02:00'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (item) => {
    const original = parseFloat(item.price);
    const discount = item.discount_percentage || 0;
    return discount > 0 ? original - (original * discount / 100) : original;
  };
  
  const getItemQuantity = (itemId) => {
    return cartItems.find(i => i.id === itemId)?.quantity || 0;
  };

  const renderMenuItem = ({ item }) => {
    if (selectedCat !== 'All' && item.category !== selectedCat && selectedCat !== 'Popular') return null;

    const qty = getItemQuantity(item.id);
    const hasDiscount = item.discount_percentage > 0;
    const finalPrice = getPrice(item);
    const vendor = { id: vendorId, name: vendorName };

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={[styles.oldPrice, { color: colors.textLight }]}>
                {Number(item.price).toFixed(3)} KD
              </Text>
            )}
            <Text style={[hasDiscount ? styles.discountPrice : styles.itemPrice, { color: colors.primary }]}>
              {finalPrice.toFixed(3)} KD
            </Text>
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardRight}>
          <Image 
             source={{ uri: item.image_url }} 
             style={[styles.itemImage, { backgroundColor: colors.surface }]} 
             defaultSource={{ uri: 'https://via.placeholder.com/100' }}
          />
          
          {qty === 0 ? (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => addToCart(item, vendor)}
            >
              <Text style={[styles.addButtonText, { color: colors.primary }]}>{t('menu.addToCart')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.counterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.counterBtn}>
                <Text style={[styles.counterText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>{qty}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.counterBtn}>
                <Text style={[styles.counterText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight, backgroundColor: colors.primary }]}>
        <Animated.Image 
          source={{ uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000' }} 
          style={[styles.headerImage, { opacity: imageOpacity }]} 
        />
        <View style={styles.headerOverlay} />
        
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{vendorName}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Checkout')} style={styles.cartBtn}>
            <Ionicons name="cart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={[styles.infoStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {vendorInfo?.rating ? Number(vendorInfo.rating).toFixed(1) : '0.0'}
          </Text>
          {vendorInfo?.ratingCount > 0 && (
            <Text style={[styles.ratingCount, { color: colors.textLight }]}>({vendorInfo.ratingCount})</Text>
          )}
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Ionicons 
            name={vendorInfo?.isOpen ? "time" : "time-outline"} 
            size={14} 
            color={vendorInfo?.isOpen ? "#4CAF50" : colors.textLight} 
          />
          <Text style={[styles.openingHours, { color: colors.textSecondary }]}>
            {vendorInfo?.openingTime || '06:00'} - {vendorInfo?.closingTime || '02:00'}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: vendorInfo?.isOpen ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: vendorInfo?.isOpen ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={[
              styles.statusText, 
              { color: vendorInfo?.isOpen ? '#2E7D32' : '#C62828' }
            ]}>
              {vendorInfo?.isOpen ? t('menu.open') : t('menu.closed')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
          {MENU_CATS.map((cat) => (
            <TouchableOpacity 
              key={cat.name} 
              style={[
                styles.catChip, 
                { backgroundColor: colors.surface },
                selectedCat === cat.name && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSelectedCat(cat.name)}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={18}
                color={selectedCat === cat.name ? '#fff' : colors.text}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                styles.catText, 
                { color: selectedCat === cat.name ? '#fff' : colors.text },
                selectedCat === cat.name && styles.catTextActive
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedCat} {t('menu.menu')}</Text>
        {menu.map((item) => <View key={item.id}>{renderMenuItem({ item })}</View>)}
      </Animated.ScrollView>
      <FloatingCart />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { width: '100%', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, overflow: 'hidden' },
  headerImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cartBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  infoStrip: { 
    marginTop: 200, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 10,
    borderBottomWidth: 1
  },
  infoItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  infoText: { 
    marginLeft: 5, 
    fontWeight: '700', 
    fontSize: 13 
  },
  ratingCount: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '500'
  },
  openingHours: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600'
  },
  infoDivider: { 
    width: 1, 
    height: 20
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: { 
    fontWeight: '700', 
    fontSize: 12 
  },

  catContainer: { paddingVertical: 15, borderBottomWidth: 1 },
  catChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 10 
  },
  catText: { fontWeight: '600', fontSize: 14 },
  catTextActive: { color: '#fff' },

  scrollContent: { paddingTop: 10, paddingBottom: 100, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },

  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginHorizontal: 20, marginBottom: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardInfo: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  itemName: { fontSize: 17, fontWeight: 'bold', marginBottom: 5 },
  itemDesc: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
  
  priceContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  itemPrice: { fontSize: 15, fontWeight: 'bold' },
  discountPrice: { fontSize: 15, fontWeight: 'bold' },
  oldPrice: { fontSize: 13, textDecorationLine: 'line-through', marginRight: 8 },
  discountBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  discountText: { color: '#E53935', fontSize: 10, fontWeight: 'bold' },

  cardRight: { alignItems: 'center' },
  itemImage: { width: 100, height: 100, borderRadius: 12, marginBottom: -15 },
  
  addButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2, borderWidth: 1 },
  addButtonText: { fontWeight: 'bold', fontSize: 12 },
  
  counterContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1 },
  counterBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  counterText: { fontSize: 18, fontWeight: 'bold' },
  qtyText: { marginHorizontal: 5, fontWeight: 'bold', fontSize: 14 },

  floatingCartContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  cartButton: { backgroundColor: '#FF5722', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, shadowColor: '#FF5722', shadowOpacity: 0.4, elevation: 10 },
  cartBadge: { backgroundColor: '#fff', width: 25, height: 25, borderRadius: 12.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cartCount: { color: '#FF5722', fontWeight: 'bold', fontSize: 12 },
  cartText: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  cartTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default MenuScreen;