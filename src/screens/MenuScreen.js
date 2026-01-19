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
  Platform,
  Linking,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';

// This will come from backend ideally, but for now specific categories
const MENU_CATS = ['All', 'Popular', 'Burgers', 'Sides', 'Drinks'];

const MenuScreen = ({ route, navigation }) => {
  const { vendorId, vendorName } = route.params;
  const [menu, setMenu] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null); // New state for full vendor details
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [selectedCat, setSelectedCat] = useState('All');
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
    fetchVendorAndMenu();
  }, []);

  const fetchVendorAndMenu = async () => {
    try {
      // 1. Fetch Menu
      const menuRes = await api.get(`/vendors/${vendorId}/menu`);
      setMenu(menuRes.data);

      // 2. Fetch Vendor Details (Phone, Rating, etc.) - We need to implement this endpoint or pass it via route
      // For now, we simulate pulling extra details if route params are insufficient, 
      // OR we can rely on route.params if we passed everything from HomeScreen.
      // Let's assume we get it from an endpoint like /vendors/:id (We need to build this in backend later)
      // For this step, I will mock the extra info based on your SQL update
      setVendorInfo({
        phone: '+965 1800 123', // Mock for now until we update backend to send this
        rating: 4.5,
        ratingCount: 120,
        openingTime: '06:00',
        closingTime: '02:00',
        isOpen: true
      });

    } catch (error) {
      console.log('Error fetching data:', error);
      Alert.alert('Error', 'Could not load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (vendorInfo?.phone) {
      Linking.openURL(`tel:${vendorInfo.phone}`);
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const updateCart = (item, action) => {
    setCart((prev) => {
      const newCart = { ...prev };
      const currentQty = newCart[item.id]?.quantity || 0;

      if (action === 'add') {
        newCart[item.id] = { ...item, quantity: currentQty + 1 };
      } else if (action === 'remove') {
        if (currentQty > 1) {
          newCart[item.id].quantity -= 1;
        } else {
          delete newCart[item.id];
        }
      }
      return newCart;
    });
  };

  const getCartSummary = () => {
    const items = Object.values(cart);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { count, total };
  };

  const renderMenuItem = ({ item }) => {
    if (selectedCat !== 'All' && item.category !== selectedCat && selectedCat !== 'Popular') return null;

    const qty = cart[item.id]?.quantity || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.itemPrice}>{Number(item.price).toFixed(3)} KD</Text>
        </View>
        
        <View style={styles.cardRight}>
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
          
          {qty === 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={() => updateCart(item, 'add')}>
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.counterContainer}>
              <TouchableOpacity onPress={() => updateCart(item, 'remove')} style={styles.counterBtn}>
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity onPress={() => updateCart(item, 'add')} style={styles.counterBtn}>
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const { count, total } = getCartSummary();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
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
          
          {/* Call Button */}
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Vendor Info Strip */}
      <View style={styles.infoStrip}>
        <View style={styles.infoItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.infoText}>{vendorInfo?.rating || 4.5} ({vendorInfo?.ratingCount || 100}+)</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{vendorInfo?.openingTime || '08:00'} - {vendorInfo?.closingTime || '23:00'}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={[styles.statusText, { color: vendorInfo?.isOpen ? 'green' : 'red' }]}>
            {vendorInfo?.isOpen ? 'Open Now' : 'Closed'}
          </Text>
        </View>
      </View>

      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
          {MENU_CATS.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
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
        <Text style={styles.sectionTitle}>{selectedCat} Menu</Text>
        {menu.map((item) => <View key={item.id}>{renderMenuItem({ item })}</View>)}
      </Animated.ScrollView>

      {count > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Checkout', {
              cart, vendorId, total
            })}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartCount}>{count}</Text>
            </View>
            <Text style={styles.cartText}>View Cart</Text>
            <Text style={styles.cartTotal}>{total.toFixed(3)} KD</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  header: { width: '100%', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#FF5722', overflow: 'hidden' },
  headerImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, elevation: 5 },

  infoStrip: { marginTop: 200, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0f0f0' },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 5, color: '#333', fontWeight: '600', fontSize: 12 },
  infoDivider: { width: 1, height: 20, backgroundColor: '#eee' },
  statusText: { fontWeight: 'bold', fontSize: 12 },

  catContainer: { paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0f0f0' },
  catChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 10 },
  catChipActive: { backgroundColor: '#FF5722' },
  catText: { color: '#666', fontWeight: '600' },
  catTextActive: { color: '#fff' },

  scrollContent: { paddingTop: 10, paddingBottom: 100 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#333' },

  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f9f9f9' },
  cardInfo: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  itemName: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  itemDesc: { fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 18 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#FF5722' },
  
  cardRight: { alignItems: 'center' },
  itemImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#eee', marginBottom: -15 },
  
  addButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  addButtonText: { color: '#FF5722', fontWeight: 'bold', fontSize: 12 },
  
  counterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#eee' },
  counterBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  counterText: { fontSize: 18, fontWeight: 'bold', color: '#FF5722' },
  qtyText: { marginHorizontal: 5, fontWeight: 'bold', fontSize: 14 },

  floatingCartContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  cartButton: { backgroundColor: '#FF5722', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, shadowColor: '#FF5722', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 5}, elevation: 10 },
  cartBadge: { backgroundColor: '#fff', width: 25, height: 25, borderRadius: 12.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cartCount: { color: '#FF5722', fontWeight: 'bold', fontSize: 12 },
  cartText: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  cartTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default MenuScreen;