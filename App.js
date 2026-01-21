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
import { I18nProvider, useI18n } from './src/context/I18nContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import FloatingCart from './components/FloatingCart';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: colors.card, 
            height: 60, 
            paddingBottom: 10,
            borderTopColor: colors.border,
            borderTopWidth: 1
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'square';
            if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
            else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen 
          name="Explore" 
          component={HomeScreen} 
          options={{ tabBarLabel: t('home.explore') }}
        />
        <Tab.Screen 
          name="Orders" 
          component={HistoryScreen} 
          options={{ tabBarLabel: t('orders.orders') }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ tabBarLabel: t('profile.myProfile') }}
        />
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

  return (
    <I18nProvider>
      <ThemeProvider>
        <CartProvider>
          <NavigationContainer>
            <AppContent initialRoute={initialRoute} />
          </NavigationContainer>
        </CartProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

function AppContent({ initialRoute }) {
  const { colors } = useTheme();

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
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
  );
}
