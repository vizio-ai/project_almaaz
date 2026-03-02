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

function buildMapHtml(initialLat: number, initialLng: number): string {
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
    map.on('click', function(e) {
      if (marker) map.removeLayer(marker);
      marker = L.marker(e.latlng).addTo(map);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });
    window.setMapView = function(lat, lng) {
      map.setView([lat, lng], 14);
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
    };
    window.setMapViewNoMarker = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 8);
      if (marker) { map.removeLayer(marker); marker = null; }
    };
  </script>
</body>
</html>`;
}

export interface LocationMapModalProps {
  visible: boolean;
  initialQuery?: string;
  onSelect: (locationName: string) => void;
  onClose: () => void;
}

export function LocationMapModal({
  visible,
  initialQuery = '',
  onSelect,
  onClose,
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

  const mapHtml = buildMapHtml(DEFAULT_LAT, DEFAULT_LNG);

  const searchNominatim = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setSelectedLat(latNum);
        setSelectedLng(lngNum);
        webViewRef.current?.injectJavaScript(
          `window.setMapView && window.setMapView(${latNum}, ${lngNum}); true;`
        );
      }
    } finally {
      setSearching(false);
    }
  }, []);

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
    let lat = selectedLat;
    let lng = selectedLng;
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
      const name =
        [city, country].filter(Boolean).join(', ') ||
        data?.display_name ||
        `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      onSelect(name);
      onClose();
    } finally {
      setSelecting(false);
    }
  }, [selectedLat, selectedLng, onSelect, onClose]);

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
              Tap on the map to pick a location
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
              disabled={selectedLat == null && selectedLng == null}
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
