import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      const response = await api.get('/cars');
      setCars(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const renderCarItem = ({ item }) => (
    <View style={styles.carCard}>
      <View style={{flexDirection:'row', alignItems:'center'}}>
        <Ionicons name="car-sport" size={24} color="#FF5722" style={{marginRight:10}} />
        <View>
          <Text style={styles.carModel}>{item.model}</Text>
          <Text style={styles.carColor}>{item.color} • {item.plate_number}</Text>
        </View>
      </View>
      {item.is_default && <Text style={styles.defaultBadge}>Default</Text>}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF5722" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        <Text style={styles.phone}>{user?.phone_number}</Text>
      </View>

      <TouchableOpacity style={styles.locationBtn} onPress={() => Alert.alert('Coming Soon', 'Manual Location Selection')}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Ionicons name="globe-outline" size={20} color="#333" />
          <Text style={styles.locationText}>Change Country / Location</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Garage</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddCar')}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {cars.length === 0 ? (
          <Text style={styles.emptyText}>No cars added yet.</Text>
        ) : (
          <FlatList
            data={cars}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCarItem}
            scrollEnabled={false}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FF5722' },
  name: { fontSize: 24, fontWeight: 'bold' },
  phone: { fontSize: 16, color: '#666', marginTop: 5 },
  
  locationBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginTop: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  locationText: { fontSize: 16, marginLeft: 10, fontWeight: '500' },

  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addButton: { color: '#FF5722', fontSize: 16, fontWeight: 'bold' },
  
  carCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  carModel: { fontSize: 16, fontWeight: 'bold' },
  carColor: { color: '#666', marginTop: 2, fontSize: 12 },
  defaultBadge: { backgroundColor: '#E0F2F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, color: '#00695C' },
  
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 10 },
  logoutButton: { margin: 20, backgroundColor: '#FFEBEE', padding: 15, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;