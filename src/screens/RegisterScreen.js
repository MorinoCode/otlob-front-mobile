import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ScrollView 
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

// لیست رنگ‌های رایج ماشین
const CAR_COLORS = [
  { name: 'White', code: '#FFFFFF', border: true },
  { name: 'Black', code: '#000000' },
  { name: 'Silver', code: '#C0C0C0' },
  { name: 'Gray', code: '#808080' },
  { name: 'Red', code: '#FF0000' },
  { name: 'Blue', code: '#0000FF' },
  { name: 'Navy', code: '#000080' },
  { name: 'Brown', code: '#A52A2A' },
  { name: 'Beige', code: '#F5F5DC', border: true },
  { name: 'Green', code: '#008000' },
  { name: 'Yellow', code: '#FFD700' },
  { name: 'Orange', code: '#FFA500' },
];

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState(''); // Stores color NAME
  const [carPlate, setCarPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // چک کردن لحظه‌ای برای فعال/غیرفعال کردن دکمه
  useEffect(() => {
    const isValid = 
      fullName.trim().length > 2 && 
      carModel.trim().length > 1 && 
      carColor.length > 0 && 
      carPlate.trim().length > 1; // پلاک حالا اجباری است
    
    setIsFormValid(isValid);
  }, [fullName, carModel, carColor, carPlate]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await api.post('/auth/complete-profile', {
        fullName,
        carModel,
        carColor,
        carPlate
      });

      const currentUser = await SecureStore.getItemAsync('user');
      const parsedUser = JSON.parse(currentUser);
      const updatedUser = { ...parsedUser, full_name: fullName };
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));

      navigation.replace('Map');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Finish Setup</Text>
            <Text style={styles.subHeader}>Help us recognize your car instantly! 🚗</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Ali Ahmed" 
              placeholderTextColor="#999" 
              value={fullName} 
              onChangeText={setFullName} 
            />
          </View>

          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Car Model</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Toyota Prado, Camry..." 
              placeholderTextColor="#999" 
              value={carModel} 
              onChangeText={setCarModel} 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Car Color: <Text style={{color:'#FF5722', fontWeight:'bold'}}>{carColor}</Text></Text>
            <View style={styles.colorsGrid}>
              {CAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.code },
                    color.border && styles.colorBorder, // بوردر برای رنگ‌های روشن
                    carColor === color.name && styles.selectedColor // استایل انتخاب شده
                  ]}
                  onPress={() => {
                    setCarColor(color.name);
                    Keyboard.dismiss(); // وقتی رنگ انتخاب کرد کیبورد بسته شه
                  }}
                >
                  {carColor === color.name && (
                    <Text style={styles.checkMark}>{color.name === 'White' || color.name === 'Beige' || color.name === 'Yellow' ? '✔️' : '✔'}</Text> // تیک سیاه برای رنگ روشن
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>License Plate (Required)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 50-12345" 
              placeholderTextColor="#999" 
              value={carPlate} 
              onChangeText={setCarPlate} 
            />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, !isFormValid && styles.disabledButton]} 
            onPress={handleSubmit} 
            disabled={!isFormValid || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Started 🚀</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 25, paddingBottom: 100 },
  
  headerContainer: { marginTop: 40, marginBottom: 30 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  subHeader: { fontSize: 16, color: '#666' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF5722', marginTop: 10, marginBottom: 15 },
  
  formGroup: { marginBottom: 20 },
  label: { color: '#333', marginBottom: 8, fontWeight: '600', fontSize: 14 },
  
  input: { 
    backgroundColor: '#F5F5F5', 
    color: '#000', 
    padding: 18, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    fontSize: 16 
  },

  // Color Picker Styles
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width:0, height:2},
    elevation: 2
  },
  colorBorder: { borderWidth: 1, borderColor: '#ddd' },
  selectedColor: { borderWidth: 3, borderColor: '#FF5722', transform: [{scale: 1.1}] },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 },

  // Footer Button
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderColor: '#f0f0f0', 
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0, 
    right: 0 
  },
  button: { 
    backgroundColor: '#FF5722', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    shadowColor: '#FF5722', 
    shadowOpacity: 0.3, 
    elevation: 5 
  },
  disabledButton: { backgroundColor: '#ccc', shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default RegisterScreen;