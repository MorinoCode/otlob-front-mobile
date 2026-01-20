
import React, { createContext, useState, useContext, useMemo } from 'react';
import { Alert } from 'react-native';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartVendor, setCartVendor] = useState(null);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const showCart = () => setIsCartVisible(true);
  const hideCart = () => setIsCartVisible(false);

  const addToCart = (item, vendor) => {
    // Calculate final price with discount
    const originalPrice = parseFloat(item.price) || 0;
    const discount = item.discount_percentage || 0;
    const finalPrice = discount > 0 
      ? originalPrice - (originalPrice * discount / 100) 
      : originalPrice;
    
    const itemWithFinalPrice = { 
      ...item, 
      price: finalPrice,
      originalPrice: originalPrice, // Keep original price for display
      discount_percentage: discount
    };

    // If cart is empty, or if item is from the same vendor
    if (!cartVendor || cartVendor.id === vendor.id) {
      setCartVendor(vendor);
      setCartItems((prevCart) => {
        const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
        if (existingItem) {
          return prevCart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        }
        return [...prevCart, { ...itemWithFinalPrice, quantity: 1 }];
      });
    } else {
      // User is trying to add an item from a different vendor
      Alert.alert(
        'Start New Cart?',
        `Your cart contains items from ${cartVendor.name}. Do you want to clear the cart and add this item from ${vendor.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear Cart',
            onPress: () => {
              setCartItems([{ ...itemWithFinalPrice, quantity: 1 }]);
              setCartVendor(vendor);
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== itemId);
      if (newCart.length === 0) {
        setCartVendor(null);
      }
      return newCart;
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCartItems((prevCart) => {
      const newCart = prevCart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean);

      if (newCart.length === 0) {
        setCartVendor(null);
      }
      return newCart;
    });
  };
  
  const clearCart = () => {
    setCartItems([]);
    setCartVendor(null);
  };

  const { totalItems, totalPrice } = useMemo(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);
    return { totalItems, totalPrice: totalPrice || 0 };
  }, [cartItems]);

  const value = {
    cartItems,
    cartVendor,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartVisible,
    showCart,
    hideCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
