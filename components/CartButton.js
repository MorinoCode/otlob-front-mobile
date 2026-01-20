
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Button, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../src/context/CartContext';

const CartButton = () => {
  const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleCheckout = () => {
    setModalVisible(false);
    navigation.navigate('Checkout');
  };
  
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{(item.price || 0).toFixed(3)} KD</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
          <Ionicons name="remove-circle-outline" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity || 0}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
          <Ionicons name="add-circle-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity style={styles.cartButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="cart" size={30} color="white" />
        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          activeOpacity={1} 
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Your Cart</Text>
            {cartItems && cartItems.length > 0 ? (
              <>
                <FlatList
                  data={cartItems}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.list}
                />
                <View style={styles.footer}>
                    <Text style={styles.totalText}>Total: {(totalPrice || 0).toFixed(3)} KD</Text>
                    <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                        <Text style={styles.checkoutButtonText}>Checkout</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear Cart</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyCartText}>Your cart is empty.</Text>
            )}
             <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    cartButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1000,
    },
    badge: {
        position: 'absolute',
        right: -3,
        top: -3,
        backgroundColor: 'red',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalView: {
        width: '100%',
        backgroundColor: 'white',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    list: {
        width: '100%',
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        width: '100%',
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkoutButton: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearButton: {
        marginTop: 10,
    },
    clearButtonText: {
        color: 'red',
        fontSize: 14,
    },
    emptyCartText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
    },
    closeButton: {
        marginTop: 15,
        padding: 10,
    },
    textStyle: {
        color: '#007bff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default CartButton;
