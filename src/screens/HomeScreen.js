import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  InteractionManager,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../utils/api";
import { CATEGORIES, getCategoryIcon } from "../utils/categories";

// عکس پیش‌فرض
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

const HomeScreen = ({ navigation, route }) => {
  const [viewMode, setViewMode] = useState("MAP");
  const [mapReady, setMapReady] = useState(false);
  const [location, setLocation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMapReady(true);
      initLocationAndFetch();
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedCategory, searchQuery, vendors]);

  // اگر رستوران‌ها لود شدند و نقشه آماده بود، زوم کن روی رستوران‌ها
  useEffect(() => {
    if (mapReady && vendors.length > 0 && mapRef.current) {
      // یکم صبر کن تا نقشه کامل رندر شه
      setTimeout(() => {
        try {
          // تمام مارکرها را در کادر جا بده
          const coords = vendors.map((v) => ({
            latitude: v.latitude,
            longitude: v.longitude,
          }));
          // مختصات خود کاربر رو هم اضافه کن
          if (location)
            coords.push({
              latitude: location.latitude,
              longitude: location.longitude,
            });

          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        } catch (e) {
          console.log("Zoom error (ignore)", e);
        }
      }, 1000);
    }
  }, [vendors, mapReady]);

  const initLocationAndFetch = async () => {
    let finalLat = 29.3759; // Default Kuwait
    let finalLong = 47.9774;

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        let currentLocation = await Location.getCurrentPositionAsync({});
        finalLat = currentLocation.coords.latitude;
        finalLong = currentLocation.coords.longitude;
      }
    } catch (error) {
      console.log("Location Error:", error);
    }

    setLocation({
      latitude: finalLat,
      longitude: finalLong,
      latitudeDelta: 0.09,
      longitudeDelta: 0.09,
    });

    fetchVendors(finalLat, finalLong);
  };

  const fetchVendors = async (lat, long) => {
    try {
      const response = await api.get(`/vendors/nearby?lat=${lat}&long=${long}`);
      console.log("Raw Data from Server:", response.data.vendors); // برای دیباگ

      const safeVendors = response.data.vendors
        .map((v) => ({
          ...v,
          // تبدیل اجباری به عدد. اگر نامعتبر بود، NaN میشود
          latitude: parseFloat(v.latitude),
          longitude: parseFloat(v.longitude),
          image_url: v.image_url || PLACEHOLDER_IMAGE,
          category: v.category || "Burger",
          rating: v.rating ? String(v.rating) : "4.5",
        }))
        .filter((v) => !isNaN(v.latitude) && !isNaN(v.longitude)); // حذف NaN ها

      setVendors(safeVendors);
      setFilteredVendors(safeVendors);
      console.log(`✅ Loaded ${safeVendors.length} Valid Vendors`);
    } catch (error) {
      console.log("API Error:", error);
    } finally {
      setLoading(false);
    }
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

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() =>
        navigation.navigate("Menu", {
          vendorId: item.id,
          vendorName: item.name,
        })
      }
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.cardImage}
        defaultSource={{ uri: PLACEHOLDER_IMAGE }}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>
          ⭐ {item.rating} • {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
        color={selectedCategory === item.id ? "#fff" : item.color}
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

  const isMapReadyToRender = mapReady && location;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Find restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
        {viewMode === "MAP" ? (
          <>
            {!isMapReadyToRender ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5722" />
                <Text style={{ marginTop: 10, color: "#666" }}>
                  {!location ? "Getting Location..." : "Loading Map..."}
                </Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={location}
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
                      e.stopPropagation(); // این خط جلوگیری می‌کند که کلیک به نقشه برسد
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
            )}

            {selectedVendor && (
              <View style={styles.bottomCard}>
                <Image
                  source={{ uri: selectedVendor.image_url }}
                  style={styles.miniCardImage}
                />
                <View style={styles.miniCardInfo}>
                  <Text style={styles.miniCardTitle}>
                    {selectedVendor.name}
                  </Text>
                  <Text style={styles.miniCardSub}>
                    ⭐ {selectedVendor.rating}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.miniCardBtn}
                  onPress={() =>
                    navigation.navigate("Menu", {
                      vendorId: selectedVendor.id,
                      vendorName: selectedVendor.name,
                    })
                  }
                >
                  <Text style={styles.miniCardBtnText}>Menu</Text>
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
          {viewMode === "MAP" ? "List View" : "Map View"}
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
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
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
  miniCardInfo: { flex: 1, marginLeft: 15 },
  miniCardTitle: { fontWeight: "bold", fontSize: 16 },
  miniCardSub: { color: "#666", fontSize: 12, marginTop: 2 },
  miniCardBtn: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
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
  cardImage: { width: "100%", height: 180, backgroundColor: "#eee" },
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardMeta: { marginTop: 5, color: "#666" },
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
