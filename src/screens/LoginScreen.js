import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator, 
  Modal, 
  FlatList,
  TouchableWithoutFeedback, // اضافه شد برای بستن کیبورد
  Keyboard // اضافه شد
} from 'react-native';
import api from '../utils/api';

const COUNTRY_CODES = [
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
];

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSendOtp = async () => {
    const phoneStr = phoneNumber || '';

    if (phoneStr.length < 7) {
      Alert.alert('Oops!', 'Please enter a valid mobile number 📱');
      return;
    }

    setLoading(true);
    const cleanNumber = phoneStr.replace(/^0+/, ''); 
    const fullPhone = selectedCountry.dial + cleanNumber;

    try {
      await api.post('/auth/send-otp', { phone: fullPhone });
      setLoading(false);
      navigation.navigate('Otp', { phone: fullPhone });
    } catch (error) {
      setLoading(false);
      console.error('Login Error:', error);
      if (!error.response) {
        Alert.alert('Connection Error', 'Check your internet connection.');
      } else {
        Alert.alert('Error', error.response.data.error || 'Server error');
      }
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.modalItem} 
      onPress={() => {
        setSelectedCountry(item);
        setModalVisible(false);
      }}
    >
      <Text style={styles.modalFlag}>{item.flag}</Text>
      <Text style={styles.modalName}>{item.name} ({item.dial})</Text>
    </TouchableOpacity>
  );

  return (
    // این رپر باعث میشه هر جای صفحه کلیک کردی کیبورد بسته شه
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          
          {/* لوگو و متن خوش‌آمدگویی */}
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>Otlob</Text>
            <Text style={styles.subText}>Hungry? Order directly to your car.</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.countrySelector} 
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dial}</Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.phoneInput}
                placeholder="1234 5678"
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Let's Eat! 🍔</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our Terms & Privacy Policy.
            </Text>
          </View>
        </KeyboardAvoidingView>

        {/* مودال انتخاب کشور */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <FlatList
                data={COUNTRY_CODES}
                keyExtractor={(item) => item.code}
                renderItem={renderCountryItem}
              />
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // پس‌زمینه سفید تمیز
  content: { flex: 1, justifyContent: 'center', padding: 25 },
  
  headerContainer: { marginBottom: 50, alignItems: 'center' },
  logoText: { fontSize: 50, fontWeight: '900', color: '#FF5722', letterSpacing: -1 }, // نارنجی اشتهاآور
  subText: { fontSize: 16, color: '#666', marginTop: 5 },

  formContainer: { width: '100%' },
  label: { color: '#333', fontSize: 14, marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  inputRow: { flexDirection: 'row', height: 60, marginBottom: 25 },
  
  countrySelector: { 
    backgroundColor: '#F5F5F5', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    borderTopLeftRadius: 15, 
    borderBottomLeftRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    borderRightWidth: 0 
  },
  flag: { fontSize: 24, marginRight: 8 },
  dialCode: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  arrow: { color: '#999', fontSize: 10, marginLeft: 5 },

  phoneInput: { 
    flex: 1, 
    backgroundColor: '#F5F5F5', 
    color: '#000', 
    fontSize: 18, 
    fontWeight: '600',
    paddingHorizontal: 15, 
    borderTopRightRadius: 15, 
    borderBottomRightRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0' 
  },

  button: { 
    backgroundColor: '#FF5722', 
    height: 60, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#FF5722', 
    shadowOpacity: 0.4, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  terms: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 20 },

  // Modal Styles (Light Mode)
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '60%' },
  modalTitle: { color: '#333', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalFlag: { fontSize: 30, marginRight: 15 },
  modalName: { color: '#333', fontSize: 18 },
  closeButton: { marginTop: 15, padding: 15, backgroundColor: '#F5F5F5', borderRadius: 15, alignItems: 'center' },
  closeButtonText: { color: '#333', fontWeight: 'bold' }
});

export default LoginScreen;