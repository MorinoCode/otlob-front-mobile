import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useI18n } from "../context/I18nContext";
import api from "../utils/api";
import { CATEGORIES, getCategoryIcon } from "../utils/categories";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

const HomeScreen = ({ navigation }) => {
  const { totalItems, showCart } = useCart();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState("MAP");
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 29.3759, // Default Kuwait
    longitude: 47.9774,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const mapRef = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      await fetchVendors();
      await startLiveTracking();
      setLoading(false);
    };
    initialize();

    // Cleanup subscription on component unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedCategory, searchQuery, vendors]);

  const startLiveTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setUserLocation(location.coords);
          console.log('📍 Live location updated:', location.coords.latitude, location.coords.longitude);
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.log("Error starting live tracking:", error);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02, // Zoom in closer
        longitudeDelta: 0.02,
      });
    } else {
      Alert.alert("Location Not Found", "Could not find your location. Please ensure location services are enabled and permissions are granted.");
    }
  };


  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors/all');
      console.log("Raw Data from Server:", response.data.vendors);

      const safeVendors = response.data.vendors
        .map((v) => ({
          ...v,
          latitude: parseFloat(v.latitude),
          longitude: parseFloat(v.longitude),
          image_url: v.image_url || PLACEHOLDER_IMAGE,
          category: v.category || "Burger",
          rating: v.rating ? Number(v.rating) : 0,
          rating_count: v.rating_count || 0,
          is_open: v.is_open !== undefined ? v.is_open : true,
        }))
        .filter((v) => v && v.id && !isNaN(v.latitude) && !isNaN(v.longitude));

      setVendors(safeVendors);
      setFilteredVendors(safeVendors);
      console.log(`✅ Loaded ${safeVendors.length} Valid Vendors`);

      if (safeVendors.length > 0 && mapRef.current) {
        setTimeout(() => {
          const coords = safeVendors.map(v => ({ latitude: v.latitude, longitude: v.longitude }));
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }, 1000);
      }

    } catch (error) {
      console.log("API Error:", error);
    }
    // No longer setting loading to false here, it's done in initialize()
  };

  const filterData = () => {
    let result = vendors;
    if (selectedCategory !== "All")
      result = result.filter((v) => v.category === selectedCategory);
    if (searchQuery)
      result = result.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    setFilteredVendors(result);
  };

  const renderVendorCard = ({ item }) => {
    const isClosed = !item.is_open;
    const openingHours = "06:00 - 02:00"; // Default - can be fetched from API later

    return (
      <TouchableOpacity
        style={[styles.listCard, isClosed && styles.listCardClosed]}
        onPress={() => {
          if (!isClosed) {
            navigation.navigate("Menu", {
              vendorId: item.id,
              vendorName: item.name,
            });
          }
        }}
        disabled={isClosed}
        activeOpacity={isClosed ? 1 : 0.7}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={[styles.cardImage, isClosed && styles.cardImageClosed]}
            defaultSource={{ uri: PLACEHOLDER_IMAGE }}
          />
          {isClosed && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedText}>{t('home.closed')}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isClosed && styles.cardTitleClosed]}>
              {item.name}
            </Text>
            {isClosed && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>{t('home.closedBadge')}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardMetaRow}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.cardMetaText}>
                {item.rating > 0 ? item.rating.toFixed(1) : '0.0'}
              </Text>
              {item.rating_count > 0 && (
                <Text style={styles.ratingCountText}>({item.rating_count})</Text>
              )}
            </View>
            
            <View style={styles.cardMetaDivider} />
            
            <View style={styles.cardMetaItem}>
              <MaterialCommunityIcons 
                name={getCategoryIcon(item.category).icon} 
                size={14} 
                color={getCategoryIcon(item.category).color} 
              />
              <Text style={styles.cardMetaText}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.cardHoursRow}>
            <Ionicons name="time-outline" size={12} color="#999" />
            <Text style={styles.cardHoursText}>{t('home.openingHours')}: {openingHours}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.catChip,
        selectedCategory === item.id && styles.catChipActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={selectedCategory === item.id ? '#fff' : item.color}
      />
      <Text
        style={[
          styles.catText,
          selectedCategory === item.id && styles.catTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topContainer}>
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.cartButton} onPress={showCart}>
            <Ionicons name="cart-outline" size={28} color="#333" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.catList}
        />
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={{ marginTop: 10, color: "#666" }}>
              Loading Restaurants...
            </Text>
          </View>
        ) : viewMode === "MAP" ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={true}
              onPress={() => setSelectedVendor(null)}
            >
              {filteredVendors.map((vendor) => (
                <Marker
                  key={vendor.id}
                  coordinate={{
                    latitude: vendor.latitude,
                    longitude: vendor.longitude,
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedVendor(vendor);
                  }}
                >
                  <View
                    style={[
                      styles.customMarker,
                      {
                        backgroundColor: getCategoryIcon(vendor.category)
                          .color,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getCategoryIcon(vendor.category).icon}
                      size={20}
                      color="#fff"
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
            
            <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#333" />
            </TouchableOpacity>

            {selectedVendor && (
              <View style={styles.bottomCard}>
                <Image
                  source={{ uri: selectedVendor.image_url }}
                  style={[
                    styles.miniCardImage,
                    !selectedVendor.is_open && styles.miniCardImageClosed
                  ]}
                />
                <View style={styles.miniCardInfo}>
                  <Text style={styles.miniCardTitle}>
                    {selectedVendor.name}
                  </Text>
                  <View style={styles.miniCardMeta}>
                    <View style={styles.miniCardRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.miniCardSub}>
                        {selectedVendor.rating > 0 ? selectedVendor.rating.toFixed(1) : '0.0'}
                      </Text>
                      {selectedVendor.rating_count > 0 && (
                        <Text style={styles.miniCardRatingCount}>
                          ({selectedVendor.rating_count})
                        </Text>
                      )}
                    </View>
                    <View style={styles.miniCardCategory}>
                      <MaterialCommunityIcons 
                        name={getCategoryIcon(selectedVendor.category).icon} 
                        size={12} 
                        color={getCategoryIcon(selectedVendor.category).color} 
                      />
                      <Text style={styles.miniCardSub}>{selectedVendor.category}</Text>
                    </View>
                  </View>
                  {!selectedVendor.is_open && (
                    <Text style={styles.miniCardHours}>06:00 - 02:00</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.miniCardBtn,
                    !selectedVendor.is_open && styles.miniCardBtnClosed
                  ]}
                  onPress={() => {
                    if (selectedVendor.is_open) {
                      navigation.navigate("Menu", {
                        vendorId: selectedVendor.id,
                        vendorName: selectedVendor.name,
                      });
                    }
                  }}
                  disabled={!selectedVendor.is_open}
                >
                  <Text style={styles.miniCardBtnText}>
                    {selectedVendor.is_open ? t('home.menu') : t('home.closedBadge')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <FlatList
            data={filteredVendors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVendorCard}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setViewMode(viewMode === "MAP" ? "LIST" : "MAP")}
      >
        <Ionicons
          name={viewMode === "MAP" ? "list" : "map"}
          size={24}
          color="#fff"
        />
        <Text style={styles.toggleText}>
          {viewMode === "MAP" ? t('home.listView') : t('home.mapView')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topContainer: {
    paddingBottom: 10,
    backgroundColor: "#fff",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#e7e4e4",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  cartButton: {
    marginLeft: 15,
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  catList: { paddingHorizontal: 20, marginTop: 15 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 10,
  },
  catChipActive: { backgroundColor: "#FF5722", borderColor: "#FF5722" },
  catText: { marginLeft: 5, fontWeight: "600", color: "#333" },
  catTextActive: { color: "#fff" },
  contentContainer: { flex: 1 },
  map: { width: "100%", height: "100%" },
  locateBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    elevation: 6,
  },
  customMarker: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 5,
  },
  bottomCard: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    elevation: 10,
  },
  miniCardImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  miniCardImageClosed: {
    opacity: 0.5,
  },
  miniCardInfo: { flex: 1, marginLeft: 15 },
  miniCardTitle: { fontWeight: "bold", fontSize: 16 },
  miniCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  miniCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniCardSub: { color: "#666", fontSize: 12 },
  miniCardRatingCount: {
    color: "#999",
    fontSize: 11,
  },
  miniCardCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniCardHours: {
    color: "#999",
    fontSize: 11,
    marginTop: 2,
  },
  miniCardBtn: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  miniCardBtnClosed: {
    backgroundColor: "#999",
    opacity: 0.7,
  },
  miniCardBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  listContainer: { padding: 20, paddingBottom: 100 },
  listCard: {
    backgroundColor: "#fff",
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  listCardClosed: {
    opacity: 0.6,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: { width: "100%", height: 180, backgroundColor: "#eee" },
  cardImageClosed: {
    opacity: 0.4,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardContent: { padding: 15 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  cardTitleClosed: {
    color: '#999',
  },
  closedBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    color: "#666",
    fontSize: 13,
    fontWeight: '500',
  },
  ratingCountText: {
    color: "#999",
    fontSize: 12,
  },
  cardMetaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  cardHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardHoursText: {
    color: "#999",
    fontSize: 12,
    fontWeight: '500',
  },
  toggleBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 6,
  },
  toggleText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
});

export default HomeScreen;
