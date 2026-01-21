import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';

const OtpScreen = ({ route, navigation }) => {
  const { t } = useI18n();
  const { phone } = route.params || { phone: '' }; 
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) inputs.current[index + 1].focus();
    if (!text && index > 0) inputs.current[index - 1].focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert(t('auth.error'), t('auth.enter4Digit'));
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp: code
      });

      const { token, user, isNewUser } = response.data;

      await SecureStore.setItemAsync('token', String(token));
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      if (isNewUser) {
        navigation.replace('Register');
      } else {
        navigation.replace('Main');
      }

    } catch (error) {
      console.log('Login Error:', error);
      Alert.alert(t('auth.loginFailed'), error.response?.data?.error || t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.verifyOtp')}</Text>
      <Text style={styles.subtitle}>{t('auth.enterOtp')}: {phone}</Text>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => inputs.current[index] = ref}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.verifyCode')}</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 30 },
  otpInput: { width: 50, height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, textAlign: 'center', fontSize: 24 },
  button: { backgroundColor: '#FF5722', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OtpScreen;