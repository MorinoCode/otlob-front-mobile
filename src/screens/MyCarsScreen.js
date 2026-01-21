import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';

const MyCarsScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCars();
    }, [])
  );

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cars');
      setCars(response.data);
    } catch (err) {
      setError('Failed to fetch cars.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (carId) => {
    if (updatingId) return; // Prevent multiple clicks
    setUpdatingId(carId);
    try {
      await api.patch(`/cars/${carId}/set-default`);
      // Refetch the list to show the change
      await fetchCars();
    } catch (err) {
      Alert.alert(t('auth.error'), 'Failed to update default car.');
      console.log(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderCarItem = ({ item }) => {
    const isUpdating = updatingId === item.id;
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleSetDefault(item.id)}
        disabled={isUpdating || item.is_default}
      >
        <View style={styles.carIcon}>
          <Ionicons name="car-sport-outline" size={24} color="#333" />
        </View>
        <View style={styles.carInfo}>
          <Text style={styles.carModel}>{item.model}</Text>
          <Text style={styles.carDetails}>{item.color} - {item.plate_number || 'No Plate'}</Text>
        </View>
        {isUpdating ? (
          <ActivityIndicator color="#FF5722" />
        ) : (
          item.is_default && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.defaultText}>{t('cars.default')}</Text>
            </View>
          )
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cars.myCars')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !cars.length ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#FF5722" size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={cars}
          renderItem={renderCarItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('cars.noCars')}</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCar')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>{t('cars.addNewVehicle')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
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
  list: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  carIcon: {
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  carInfo: { flex: 1 },
  carModel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  carDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  addButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 18,
    borderRadius: 12,
  },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  errorText: { textAlign: 'center', marginTop: 20, color: 'red' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
});

export default MyCarsScreen;
