import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  SafeAreaView,
  Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const { totalItems, showCart } = useCart();
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      const response = await api.get('/cars');
      setCars(response.data || []);
    } catch (error) {
      console.log('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const renderCarItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.carCard}
      onPress={() => navigation.navigate('MyCars')}
    >
      <View style={styles.carCardLeft}>
        <View style={[styles.carIconContainer, { backgroundColor: '#FFF3E0' }]}>
          <MaterialCommunityIcons name="car-sport" size={28} color="#FF5722" />
        </View>
        <View style={styles.carInfo}>
          <Text style={styles.carModel}>{item.model || 'Unknown Model'}</Text>
          <View style={styles.carDetailsRow}>
            <Text style={styles.carColor}>{item.color || 'N/A'}</Text>
            <Text style={styles.carDivider}>•</Text>
            <Text style={styles.carPlate}>{item.plate_number || 'N/A'}</Text>
          </View>
        </View>
      </View>
      {item.is_default && (
        <View style={styles.defaultBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const defaultCar = cars.find(c => c.is_default) || cars[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            </View>
            <Text style={styles.name}>{user?.full_name || 'User'}</Text>
            <Text style={styles.phone}>
              <Ionicons name="call-outline" size={14} color="#999" /> {user?.phone_number || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={showCart}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="cart" size={24} color="#FF5722" />
              {totalItems > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{totalItems}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel}>Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="receipt" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionLabel}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyCars')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="car-multiple" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionLabel}>Cars</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'Settings feature coming soon')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="settings-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Default Car Section */}
        {defaultCar ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="car" size={20} color="#FF5722" />
                <Text style={styles.sectionTitle}>Default Vehicle</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MyCars')}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
                <Ionicons name="chevron-forward" size={16} color="#FF5722" />
              </TouchableOpacity>
            </View>
            <View style={styles.defaultCarCard}>
              <View style={styles.defaultCarLeft}>
                <View style={styles.defaultCarIcon}>
                  <MaterialCommunityIcons name="car-sport" size={32} color="#FF5722" />
                </View>
                <View style={styles.defaultCarInfo}>
                  <Text style={styles.defaultCarModel}>{defaultCar.model}</Text>
                  <Text style={styles.defaultCarDetails}>
                    {defaultCar.color} • {defaultCar.plate_number}
                  </Text>
                </View>
              </View>
              <View style={styles.defaultBadgeLarge}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.defaultBadgeTextLarge}>Active</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="car" size={20} color="#FF5722" />
                <Text style={styles.sectionTitle}>My Garage</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MyCars')}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Add Car</Text>
                <Ionicons name="chevron-forward" size={16} color="#FF5722" />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyCarCard}>
              <MaterialCommunityIcons name="car-off" size={48} color="#ccc" />
              <Text style={styles.emptyCarText}>No vehicles added yet</Text>
              <Text style={styles.emptyCarSubText}>Add a vehicle for faster checkout</Text>
              <TouchableOpacity 
                style={styles.addCarButton}
                onPress={() => navigation.navigate('MyCars')}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addCarButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Cars Preview */}
        {cars.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="garage" size={20} color="#FF5722" />
                <Text style={styles.sectionTitle}>All Vehicles ({cars.length})</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MyCars')}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#FF5722" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cars.slice(0, 2)}
              renderItem={renderCarItem}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              scrollEnabled={false}
              ListFooterComponent={
                cars.length > 2 && (
                  <TouchableOpacity 
                    style={styles.viewMoreButton}
                    onPress={() => navigation.navigate('MyCars')}
                  >
                    <Text style={styles.viewMoreText}>
                      View {cars.length - 2} more vehicle{cars.length - 2 > 1 ? 's' : ''}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#FF5722" />
                  </TouchableOpacity>
                )
              }
            />
          </View>
        )}

        {/* Location Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.locationCard}
            onPress={() => Alert.alert('Coming Soon', 'Location selection feature coming soon')}
          >
            <View style={styles.locationIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF5722" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Delivery Location</Text>
              <Text style={styles.locationSubtitle}>Kuwait</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Help & Support', 'Contact support: support@otlob.com')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#666" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('About', 'Otlob App v1.0.0\nFast food delivery service')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#666" />
              <Text style={styles.menuItemText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTop: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  phone: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCard: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },

  // Section
  section: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.3,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageButtonText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '600',
  },

  // Default Car Card
  defaultCarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  defaultCarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  defaultCarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  defaultCarInfo: {
    flex: 1,
  },
  defaultCarModel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  defaultCarDetails: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  defaultBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  defaultBadgeTextLarge: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty Car Card
  emptyCarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyCarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyCarSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    marginBottom: 20,
  },
  addCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addCarButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Car Card
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  carCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  carInfo: {
    flex: 1,
  },
  carModel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  carDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carColor: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  carDivider: {
    fontSize: 13,
    color: '#ccc',
  },
  carPlate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  defaultBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },

  // View More Button
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  viewMoreText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '600',
  },

  // Location Card
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 13,
    color: '#666',
  },

  // Menu Items
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFEBEE',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
