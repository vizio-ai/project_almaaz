import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { AppText, PrimaryButton, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const DEFAULT_LAT = 20;
const DEFAULT_LNG = 0;
const USER_LOCATION_ZOOM = 8;

function buildMapHtml(initialLat: number, initialLng: number, allowPointPick: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body{margin:0;padding:0;height:100%;width:100%;}#map{width:100%;height:100%;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${initialLat}, ${initialLng}], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    var marker = null;
    window.setMapViewNoMarker = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 8);
      if (marker) { map.removeLayer(marker); marker = null; }
    };
    ${allowPointPick ? `
    function setMarker(lat, lng) {
      if (marker) { map.removeLayer(marker); }
      marker = L.marker([lat, lng]).addTo(map);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: lat, lng: lng }));
      }
    }
    map.on('click', function(e) {
      setMarker(e.latlng.lat, e.latlng.lng);
    });
    window.setMarkerFromNative = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 8);
      setMarker(lat, lng);
    };
    ` : ''}
    window.fitBoundsByBBox = function(south, north, west, east) {
      var bounds = L.latLngBounds([south, west], [north, east]);
      map.fitBounds(bounds);
      if (marker) { map.removeLayer(marker); marker = null; }
    };
  </script>
</body>
</html>`;
}

export interface LocationMapModalProps {
  visible: boolean;
  initialQuery?: string;
  /**
   * Called when the user confirms a location.
   * `latitude` and `longitude` are provided when the user searched or picked
   * a point (allowPointPick=true). For trip-level free-text only mode they are null.
   */
  onSelect: (locationName: string, latitude?: number | null, longitude?: number | null) => void;
  onClose: () => void;
  /** When true, user can pick an exact point on the map (used for activities). */
  allowPointPick?: boolean;
}

export function LocationMapModal({
  visible,
  initialQuery = '',
  onSelect,
  onClose,
  allowPointPick = true,
}: LocationMapModalProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const webViewRef = useRef<WebView>(null);
  const pendingOpenRef = useRef<{ query: string } | null>(null);

  const mapHtml = buildMapHtml(DEFAULT_LAT, DEFAULT_LNG, allowPointPick);

  const searchNominatim = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(
          q,
        )}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon, boundingbox } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setSelectedLat(latNum);
        setSelectedLng(lngNum);

        if (Array.isArray(boundingbox) && boundingbox.length === 4) {
          const [southStr, northStr, westStr, eastStr] = boundingbox;
          const south = parseFloat(southStr);
          const north = parseFloat(northStr);
          const west = parseFloat(westStr);
          const east = parseFloat(eastStr);
          const latSpan = Math.abs(north - south);
          const lonSpan = Math.abs(east - west);
          const centerLat = (south + north) / 2;
          const centerLng = (west + east) / 2;

          // Heuristic zoom: country / region / city boyutuna göre otomatik yakınlaştır
          let zoom = 8;
          if (latSpan > 40 || lonSpan > 60) {
            zoom = 3; // kıta / çok büyük bölge
          } else if (latSpan > 15 || lonSpan > 30) {
            zoom = 5; // büyük ülke
          } else if (latSpan > 5 || lonSpan > 15) {
            zoom = 7; // ülke / büyük bölge
          } else if (latSpan > 1 || lonSpan > 5) {
            zoom = 9; // şehir / çevresi
          } else {
            zoom = 11; // ilçe / küçük alan
          }

          const fn = allowPointPick ? 'setMarkerFromNative' : 'setMapViewNoMarker';
          webViewRef.current?.injectJavaScript(
            `window.${fn} && window.${fn}(${centerLat}, ${centerLng}, ${zoom}); true;`,
          );
        } else {
          const fn = allowPointPick ? 'setMarkerFromNative' : 'setMapViewNoMarker';
          webViewRef.current?.injectJavaScript(
            `window.${fn} && window.${fn}(${latNum}, ${lngNum}, 8); true;`,
          );
        }
      }
    } finally {
      setSearching(false);
    }
  }, [allowPointPick]);

  // Modal açıldığında: search alanını güncelle. Seçili lokasyon varsa (initialQuery dolu) pin'i kapatma.
  useEffect(() => {
    if (!visible) {
      pendingOpenRef.current = null;
      return;
    }
    setSearchQuery(initialQuery);
    if (!initialQuery.trim()) {
      setSelectedLat(null);
      setSelectedLng(null);
    }
    pendingOpenRef.current = { query: initialQuery };
  }, [visible, initialQuery]);

  const onMapLoadEnd = useCallback(() => {
    const pending = pendingOpenRef.current;
    if (!pending) return;
    pendingOpenRef.current = null;

    const trimmed = pending.query.trim();
    if (trimmed) {
      searchNominatim(trimmed);
      return;
    }
    // Lokasyon seçilmemiş: kullanıcının mevcut konumunu geniş zoom'da göster, pin yok.
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        webViewRef.current?.injectJavaScript(
          `window.setMapViewNoMarker && window.setMapViewNoMarker(${latitude}, ${longitude}, ${USER_LOCATION_ZOOM}); true;`
        );
      } catch {
        // ignore
      }
    })();
  }, [searchNominatim]);

  const handleSelectLocation = useCallback(async () => {
    const lat = selectedLat;
    const lng = selectedLng;
    const typed = searchQuery.trim();

    // Trip-level usage: only allow free-text / search-based label, no map picking.
    if (!allowPointPick) {
      if (typed) {
        onSelect(typed, null, null);
      }
      onClose();
      return;
    }

    // If user never selected a point but typed a query, just use the typed text.
    if ((lat == null || lng == null) && typed) {
      onSelect(typed, null, null);
      onClose();
      return;
    }

    if (lat == null || lng == null) {
      onClose();
      return;
    }

    setSelecting(true);
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data?.address;
      const city =
        addr?.city ?? addr?.town ?? addr?.village ?? addr?.municipality ?? addr?.state ?? '';
      const country = addr?.country ?? '';
      // Prefer the full place name (e.g. museum / restaurant), fall back to city,country
      const name =
        data?.display_name ||
        [city, country].filter(Boolean).join(', ') ||
        `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      onSelect(name, lat, lng);
      onClose();
    } finally {
      setSelecting(false);
    }
  }, [selectedLat, selectedLng, searchQuery, onSelect, onClose]);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'location') {
        setSelectedLat(payload.lat);
        setSelectedLng(payload.lng);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleShowOnMap = useCallback(async () => {
    const lat = selectedLat ?? DEFAULT_LAT;
    const lng = selectedLng ?? DEFAULT_LNG;
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14`;
    try {
      if (Platform.OS === 'ios') {
        const url = `https://maps.apple.com/?ll=${lat},${lng}&z=14`;
        const can = await Linking.canOpenURL(url);
        if (can) await Linking.openURL(url);
        else await WebBrowser.openBrowserAsync(osmUrl);
      } else {
        const geoUrl = `geo:${lat},${lng}?z=14`;
        const can = await Linking.canOpenURL(geoUrl);
        if (can) await Linking.openURL(geoUrl);
        else await WebBrowser.openBrowserAsync(osmUrl);
      }
    } catch {
      await WebBrowser.openBrowserAsync(osmUrl);
    }
  }, [selectedLat, selectedLng]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={styles.scrim}>
        <TouchableOpacity style={styles.scrimTouchable} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          {/* Search bar */}
          <View style={[styles.searchRow, { borderColor: border }]}>
            <Ionicons name="search-outline" size={20} color={secondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search location..."
              placeholderTextColor={secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => searchNominatim(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={20} color={secondary} />
              </TouchableOpacity>
            )}
            {searching && <ActivityIndicator size="small" color={accent} />}
            <TouchableOpacity
              onPress={() => searchNominatim(searchQuery)}
              hitSlop={8}
              disabled={searching}
            >
              <AppText style={[styles.searchBtn, { color: accent }]}>Search</AppText>
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <WebView
              key={visible ? 'map-visible' : 'map-hidden'}
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={styles.webView}
              scrollEnabled={false}
              onLoadEnd={onMapLoadEnd}
              onMessage={onMessage}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>

          <View style={styles.hintRow}>
            <AppText style={[styles.hint, { color: secondary }]}>
              Search for a city, region or country, then adjust on the map
            </AppText>
            <TouchableOpacity onPress={handleShowOnMap} hitSlop={8}>
              <AppText style={[styles.showOnMapLink, { color: accent }]}>
                Show on map
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <PrimaryButton
              variant="outline"
              label="Cancel"
              onPress={onClose}
              style={[styles.actionBtn, { backgroundColor: surface }]}
            />
            <PrimaryButton
              variant="filled"
              label="Use this location"
              onPress={handleSelectLocation}
              isLoading={selecting}
              // Trip-level: require at least search text; activity-level: require either text or picked point
              disabled={
                allowPointPick
                  ? selectedLat == null && selectedLng == null && !searchQuery.trim()
                  : !searchQuery.trim()
              }
              style={styles.actionBtn}
            />
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  scrimTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    ...typography.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    paddingHorizontal: 0,
  },
  searchBtn: {
    ...typography.sm,
    fontWeight: typography.weights.semibold,
  },
  mapContainer: {
    height: 280,
    width: '100%',
    padding: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#e4e4e4',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 24,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    flex: 1,
  },
  showOnMapLink: {
    ...typography.caption,
    textDecorationLine: 'underline',
    fontWeight: typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
