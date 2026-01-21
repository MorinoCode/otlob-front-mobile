import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../utils/api";
import { useCart } from "../context/CartContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";

const CheckoutScreen = ({ route, navigation }) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { cartItems, cartVendor, totalPrice, clearCart } = useCart();
  
  // Convert cartItems array to object format for compatibility
  const cart = (cartItems || []).reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
  
  const vendorId = cartVendor?.id || route.params?.vendorId;
  const total = totalPrice || route.params?.total || 0;
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [customerNote, setCustomerNote] = useState(""); // وضعیت جدید برای یادداشت
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Check if cart is empty and redirect
  useEffect(() => {
    if (cartItems && cartItems.length === 0 && !route.params?.cart) {
      Alert.alert(t('cart.cart'), t('cart.empty'), [
        { text: t('common.close'), onPress: () => navigation.goBack() }
      ]);
    }
  }, [cartItems]);

  // Helper function to calculate final price for each item row
  const getFinalPrice = (item) => {
    // If item already has final price (from discount), use it
    if (item.price && !item.originalPrice) {
      return parseFloat(item.price) || 0;
    }
    // Otherwise calculate from original price
    const original = parseFloat(item.originalPrice || item.price || 0);
    const discount = item.discount_percentage || 0;
    return discount > 0 ? original - (original * discount) / 100 : original;
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCars();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchCars = async () => {
    try {
      const response = await api.get("/cars");
      setCars(response.data);
      const defaultCar =
        response.data.find((c) => c.is_default) || response.data[0];
      if (defaultCar) setSelectedCar(defaultCar.id);
    } catch (error) {
      console.log("Fetch Cars Error:", error);
      Alert.alert("Error", "Could not load your cars");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedCar) {
      Alert.alert(t('common.confirm'), t('checkout.selectCar'));
      return;
    }

    setProcessing(true);

    const orderItems = Object.values(cart).map((item) => ({
      menu_item_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const payload = {
        vendor_id: vendorId,
        car_id: selectedCar,
        payment_method: "CASH",
        items: orderItems,
        customer_note: customerNote, // ارسال یادداشت به سرور
        pickup_time: new Date().toISOString(),
      };

      const response = await api.post("/orders", payload);
      const createdOrder = response.data;

      // Clear cart after successful order
      clearCart();

      Alert.alert(
        "Order Placed! 🎉",
        "Your order has been sent to the restaurant.",
        [
          {
            text: t('orders.trackOrder'),
            onPress: () =>
              navigation.replace("OrderDetails", {
                orderId: createdOrder.id,
                vendorId: vendorId,
                carId: selectedCar,
              }),
          },
        ],
      );
    } catch (error) {
      console.log("Place Order Error:", error.response?.data || error.message);
      Alert.alert(
        t('orders.orders'),
        error.response?.data?.error || t('auth.somethingWentWrong'),
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('checkout.checkout')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.orderSummary')}</Text>
            <View style={[styles.receiptCard, { backgroundColor: colors.card }]}>
              {Object.values(cart).map((item) => {
                const finalPrice = getFinalPrice(item);
                return (
                  <View key={item.id} style={styles.receiptRow}>
                    <View style={[styles.itemBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.itemQty, { color: colors.primary }]}>{item.quantity}x</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                      {item.discount_percentage > 0 && (
                        <Text style={{ fontSize: 10, color: "#E53935" }}>
                          Discount applied: {item.discount_percentage}%
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.text }]}>
                      {(finalPrice * item.quantity).toFixed(3)}
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('checkout.total')}</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>{total.toFixed(3)} KD</Text>
              </View>
            </View>
          </View>

          {/* Delivery Note (NEW) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('checkout.notes')}
            </Text>
            <View style={[styles.noteContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={20}
                color={colors.primary}
                style={styles.noteIcon}
              />
              <TextInput
                style={[styles.noteInput, { color: colors.text }]}
                placeholder="e.g. Near the main entrance, Black Land Cruiser..."
                placeholderTextColor={colors.textLight}
                value={customerNote}
                onChangeText={setCustomerNote}
                multiline
              />
            </View>
          </View>

          {/* Car Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.selectCar')} 🚗</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carsList}
            >
              {cars.map((car) => (
                <TouchableOpacity
                  key={car.id}
                  style={[
                    styles.carCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedCar === car.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCar(car.id)}
                >
                  <Ionicons
                    name="car-sport"
                    size={28}
                    color={selectedCar === car.id ? "#fff" : colors.primary}
                  />
                  <Text
                    style={[
                      styles.carModel,
                      { color: colors.text },
                      selectedCar === car.id && styles.textActive,
                    ]}
                  >
                    {car.model}
                  </Text>
                  <Text
                    style={[
                      styles.carPlate,
                      { color: colors.textSecondary },
                      selectedCar === car.id && styles.textActive,
                    ]}
                  >
                    {car.plate_number}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.addCarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate("AddCar")}
              >
                <Ionicons name="add" size={30} color={colors.textLight} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.paymentMethod')}</Text>
            <View style={[styles.paymentOption, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="cash" size={24} color="#2E7D32" />
              <Text style={[styles.paymentText, { color: colors.text }]}>{t('checkout.cash')}</Text>
              <Ionicons name="radio-button-on" size={24} color={colors.primary} />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
            onPress={handlePlaceOrder}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('checkout.placeOrder')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  receiptCard: {
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  receiptRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 10,
  },
  itemQty: { fontWeight: "bold", fontSize: 12 },
  itemName: { flex: 1, fontSize: 15 },
  itemPrice: { fontWeight: "bold" },
  divider: { height: 1, marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "bold" },
  totalValue: { fontSize: 20, fontWeight: "bold" },

  // Note Styles
  noteContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    minHeight: 60,
    borderWidth: 1,
  },
  noteIcon: { marginTop: 2 },
  noteInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },

  carsList: { paddingRight: 20 },
  carCard: {
    width: 120,
    height: 130,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  carCardActive: {},
  carModel: { fontWeight: "bold", marginTop: 8, fontSize: 13 },
  carPlate: { fontSize: 11, marginTop: 2 },
  textActive: { color: "#fff" },
  addCarBtn: {
    width: 80,
    height: 130,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  paymentText: { flex: 1, marginLeft: 10, fontWeight: "500" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  placeOrderBtn: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default CheckoutScreen;
