// c:\Users\MR0EAB~1.MOR\AppData\Local\Temp\App.js
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import OtpScreen from "./src/screens/OtpScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MenuScreen from "./src/screens/MenuScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import AddCarScreen from "./src/screens/AddCarScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import MyCarsScreen from "./src/screens/MyCarsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

// Context & Components
import { CartProvider } from './src/context/CartContext';
import FloatingCart from './components/FloatingCart';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#fff', height: 60, paddingBottom: 10 },
          tabBarActiveTintColor: '#FF5722',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'square';
            if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
            else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Explore" component={HomeScreen} />
        <Tab.Screen name="Orders" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      
      {/* Floating Cart will appear on top of these tabs */}
      <FloatingCart />
    </View>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const user = await SecureStore.getItemAsync("user");

        if (token && user) {
          setInitialRoute("Main");
        } else {
          setInitialRoute("Login");
        }
      } catch (error) {
        setInitialRoute("Login");
      }
    };
    checkLogin();
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRoute}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          <Stack.Screen name="AddCar" component={AddCarScreen} />
          <Stack.Screen name="MyCars" component={MyCarsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
