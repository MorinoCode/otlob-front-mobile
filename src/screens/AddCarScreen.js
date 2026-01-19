import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../utils/api';

const AddCarScreen = ({ navigation }) => {
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCar = async () => {
    if (!model || !color) {
      Alert.alert('Error', 'Please enter car model and color');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cars', {
        model,
        color,
        plate_number: plate
      });
      
      Alert.alert('Success', 'Car added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to add car');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Car</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Car Model (e.g., Toyota Prado)</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="Enter model"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="Enter color"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Plate Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={plate}
          onChangeText={setPlate}
          placeholder="e.g., 50-12345"
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
          <Text style={styles.saveButtonText}>Save Car</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, marginTop: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333', fontWeight: '500' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, fontSize: 16 },
  saveButton: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddCarScreen;