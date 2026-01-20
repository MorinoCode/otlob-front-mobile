// c:\Otlob-Now-Kw\frontend\frontend\src\components\FloatingCart.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../src/context/CartContext';

const FloatingCart = () => {
  const { 
    cartItems, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    isCartVisible, 
    showCart, 
    hideCart 
  } = useCart();
  const navigation = useNavigation();

  // Don't show the floating bar if cart is empty, but the modal can still be controlled externally
  const showFloatingBar = totalItems > 0;

  const handleCheckout = () => {
    hideCart();
    navigation.navigate('Checkout');
  };

  return (
    <>
      {/* Floating Bar */}
      {showFloatingBar && (
        <TouchableOpacity style={styles.floatingButton} onPress={showCart}>
          <View style={styles.cartIconContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
          </View>
          <Text style={styles.totalText}>{(totalPrice || 0).toFixed(3)} KD</Text>
        </TouchableOpacity>
      )}

      {/* Cart Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCartVisible}
        onRequestClose={hideCart}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Order</Text>
              <TouchableOpacity onPress={hideCart}>
                <Ionicons name="close-circle" size={30} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={<Text style={styles.emptyCartText}>Your cart is empty.</Text>}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPricePerUnit}>{(item.price || 0).toFixed(3)} KD</Text>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
                      <Ionicons name="remove-circle" size={28} color="#FF5722" />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    
                    <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
                      <Ionicons name="add-circle" size={28} color="#FF5722" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.itemTotalPrice}>{((item.price || 0) * (item.quantity || 0)).toFixed(3)} KD</Text>
                </View>
              )}
            />

            {totalItems > 0 && (
              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{(totalPrice || 0).toFixed(3)} KD</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                  <Text style={styles.checkoutButtonText}>Go to Checkout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80, // Positioned above the Tab Bar
    left: 15,
    right: 15,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  cartIconContainer: { flexDirection: 'row', alignItems: 'center' },
  badge: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  badgeText: { color: '#FF5722', fontWeight: 'bold', fontSize: 12 },
  viewCartText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  totalText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemPricePerUnit: { fontSize: 12, color: '#888', marginTop: 2 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  itemTotalPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  footer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF5722' },
  checkoutButton: { backgroundColor: '#FF5722', paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default FloatingCart;
