import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';

const AddCarScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCar = async () => {
    if (!model || !color) {
      Alert.alert(t('auth.error'), 'Please enter car model and color');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cars', {
        model,
        color,
        plate_number: plate
      });
      
      Alert.alert(t('common.done'), t('cars.vehicleAdded'), [
        { text: t('common.close'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log(error);
      Alert.alert(t('auth.error'), 'Failed to add car');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cars.addNewVehicle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('cars.carModel')}</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder={t('cars.enterModel')}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('cars.carColor')}</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder={t('cars.selectColor')}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('cars.plateNumber')}</Text>
          <TextInput
            style={styles.input}
            value={plate}
            onChangeText={setPlate}
            placeholder={t('cars.enterPlate')}
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleAddCar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('cars.saveVehicle')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 5 },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333', fontWeight: '500' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, fontSize: 16 },
  saveButton: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddCarScreen;