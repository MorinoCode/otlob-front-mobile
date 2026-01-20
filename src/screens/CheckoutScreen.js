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

const CheckoutScreen = ({ route, navigation }) => {
  // Use cart from context instead of route params
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
      Alert.alert("Empty Cart", "Your cart is empty", [
        { text: "OK", onPress: () => navigation.goBack() }
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
      Alert.alert("Attention", "Please select a car for delivery 🚗");
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
            text: "Track Order",
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
        "Order Failed",
        error.response?.data?.error || "Something went wrong.",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF5722" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.receiptCard}>
              {Object.values(cart).map((item) => {
                const finalPrice = getFinalPrice(item);
                return (
                  <View key={item.id} style={styles.receiptRow}>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemQty}>{item.quantity}x</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.discount_percentage > 0 && (
                        <Text style={{ fontSize: 10, color: "#E53935" }}>
                          Discount applied: {item.discount_percentage}%
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemPrice}>
                      {(finalPrice * item.quantity).toFixed(3)}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{total.toFixed(3)} KD</Text>
              </View>
            </View>
          </View>

          {/* Delivery Note (NEW) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Where are you parked? (Optional)
            </Text>
            <View style={styles.noteContainer}>
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={20}
                color="#FF5722"
                style={styles.noteIcon}
              />
              <TextInput
                style={styles.noteInput}
                placeholder="e.g. Near the main entrance, Black Land Cruiser..."
                placeholderTextColor="#999"
                value={customerNote}
                onChangeText={setCustomerNote}
                multiline
              />
            </View>
          </View>

          {/* Car Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliver to Car 🚗</Text>
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
                    selectedCar === car.id && styles.carCardActive,
                  ]}
                  onPress={() => setSelectedCar(car.id)}
                >
                  <Ionicons
                    name="car-sport"
                    size={28}
                    color={selectedCar === car.id ? "#fff" : "#FF5722"}
                  />
                  <Text
                    style={[
                      styles.carModel,
                      selectedCar === car.id && styles.textActive,
                    ]}
                  >
                    {car.model}
                  </Text>
                  <Text
                    style={[
                      styles.carPlate,
                      selectedCar === car.id && styles.textActive,
                    ]}
                  >
                    {car.plate_number}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addCarBtn}
                onPress={() => navigation.navigate("AddCar")}
              >
                <Ionicons name="add" size={30} color="#ccc" />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentOption}>
              <MaterialCommunityIcons name="cash" size={24} color="#2E7D32" />
              <Text style={styles.paymentText}>Pay on Delivery</Text>
              <Ionicons name="radio-button-on" size={24} color="#FF5722" />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>PLACE ORDER</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
    marginLeft: 5,
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  receiptRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  itemBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 10,
  },
  itemQty: { color: "#FF5722", fontWeight: "bold", fontSize: 12 },
  itemName: { flex: 1, fontSize: 15, color: "#333" },
  itemPrice: { fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "bold" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#FF5722" },

  // Note Styles
  noteContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    minHeight: 60,
  },
  noteIcon: { marginTop: 2 },
  noteInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
    textAlignVertical: "top",
  },

  carsList: { paddingRight: 20 },
  carCard: {
    width: 120,
    height: 130,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  carCardActive: { borderColor: "#FF5722", backgroundColor: "#FF5722" },
  carModel: { fontWeight: "bold", marginTop: 8, fontSize: 13 },
  carPlate: { fontSize: 11, color: "#888", marginTop: 2 },
  textActive: { color: "#fff" },
  addCarBtn: {
    width: 80,
    height: 130,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  placeOrderBtn: {
    backgroundColor: "#FF5722",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default CheckoutScreen;
