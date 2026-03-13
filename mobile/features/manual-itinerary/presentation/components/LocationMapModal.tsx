import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { AppText, PrimaryButton, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import { geocodingService, PlaceSuggestion } from '@shared/services';

// iOS: react-native-maps (Apple Maps, no API key needed)
// Android: WebView + Leaflet (OSM, no Google dependency)
import { WebView } from 'react-native-webview';
let MapView: any = null;
let Marker: any = null;
if (Platform.OS === 'ios') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
}

const DEFAULT_LAT = 20;
const DEFAULT_LNG = 0;
const USER_LOCATION_ZOOM = 8;

// ── Android: Leaflet HTML ──────────────────────────────────

function buildMapHtml(allowPointPick: boolean): string {
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
    var map = L.map('map',{tap:false,touchZoom:true,dragging:true}).setView([${DEFAULT_LAT}, ${DEFAULT_LNG}], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    setTimeout(function(){ map.invalidateSize(); }, 300);
    setTimeout(function(){ map.invalidateSize(); }, 1000);
    var marker = null;
    function sendToRN(lat, lng) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: lat, lng: lng }));
        }
      } catch(e) {}
    }
    window.setMapViewNoMarker = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 8);
      if (marker) { map.removeLayer(marker); marker = null; }
    };
    ${allowPointPick ? `
    function setMarker(lat, lng) {
      if (marker) { map.removeLayer(marker); }
      marker = L.marker([lat, lng]).addTo(map);
      sendToRN(lat, lng);
    }
    map.on('click', function(e) { setMarker(e.latlng.lat, e.latlng.lng); });
    window.setMarkerFromNative = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 14);
      setMarker(lat, lng);
    };
    ` : ''}
    window.fitBoundsByBBox = function(s, n, w, e) {
      map.fitBounds(L.latLngBounds([s, w], [n, e]));
      if (marker) { map.removeLayer(marker); marker = null; }
    };
  </script>
</body>
</html>`;
}

// ── Props ──────────────────────────────────────────────────

export interface LocationMapModalProps {
  visible: boolean;
  initialQuery?: string;
  onSelect: (locationName: string, latitude?: number | null, longitude?: number | null) => void;
  onClose: () => void;
  /** When true, user can pick an exact point on the map (used for activities). */
  allowPointPick?: boolean;
}

// ── Component ──────────────────────────────────────────────

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
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  // Current map center used to bias autocomplete results toward the viewed area
  const biasRef = useRef<{ lat: number; lng: number } | null>(null);

  // iOS (Apple Maps)
  const [iosRegion, setIosRegion] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const mapViewRef = useRef<any>(null);

  // Android (WebView + Leaflet)
  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const pendingMoveRef = useRef<(() => void) | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapHtml = buildMapHtml(allowPointPick);

  // ── WebView map helpers (Android only) ──────────────────

  const webMoveMap = useCallback((lat: number, lng: number, zoom = 14) => {
    const fn = allowPointPick ? 'setMarkerFromNative' : 'setMapViewNoMarker';
    const js = `window.${fn} && window.${fn}(${lat}, ${lng}, ${zoom}); true;`;
    if (mapReadyRef.current) {
      webViewRef.current?.injectJavaScript(js);
    } else {
      pendingMoveRef.current = () => webViewRef.current?.injectJavaScript(js);
    }
  }, [allowPointPick]);

  const onMapLoadEnd = useCallback(() => {
    mapReadyRef.current = true;
    if (pendingMoveRef.current) {
      pendingMoveRef.current();
      pendingMoveRef.current = null;
      return;
    }
    if (!initialQuery.trim()) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;
          biasRef.current = { lat: latitude, lng: longitude };
          webViewRef.current?.injectJavaScript(
            `window.setMapViewNoMarker && window.setMapViewNoMarker(${latitude}, ${longitude}, ${USER_LOCATION_ZOOM}); true;`
          );
        } catch {}
      })();
    } else {
      geocodingService.geocode(initialQuery).then((coords) => {
        if (!coords) return;
        biasRef.current = { lat: coords.lat, lng: coords.lng };
        setSelectedLat(coords.lat);
        setSelectedLng(coords.lng);
        webMoveMap(coords.lat, coords.lng, 14);
      });
    }
  }, [initialQuery, webMoveMap]);

  const onWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'location') {
        biasRef.current = { lat: payload.lat, lng: payload.lng };
        setSelectedLat(payload.lat);
        setSelectedLng(payload.lng);
        geocodingService.reverseGeocode(payload.lat, payload.lng).then((name) => {
          if (name) setSearchQuery(name);
        });
      }
    } catch {}
  }, []);

  // ── iOS Apple Maps helpers ───────────────────────────────

  const iosMoveMap = useCallback((lat: number, lng: number) => {
    const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    biasRef.current = { lat, lng };
    setIosRegion(newRegion);
    mapViewRef.current?.animateToRegion(newRegion, 500);
    if (allowPointPick) {
      setSelectedLat(lat);
      setSelectedLng(lng);
    }
  }, [allowPointPick]);

  const onIosMapPress = useCallback(async (e: any) => {
    if (!allowPointPick) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    biasRef.current = { lat: latitude, lng: longitude };
    setSelectedLat(latitude);
    setSelectedLng(longitude);
    const name = await geocodingService.reverseGeocode(latitude, longitude);
    if (name) setSearchQuery(name);
  }, [allowPointPick]);

  // ── Shared: reset on open ────────────────────────────────

  useEffect(() => {
    if (!visible) {
      mapReadyRef.current = false;
      pendingMoveRef.current = null;
      return;
    }
    setSearchQuery(initialQuery);
    setSuggestions([]);
    setShowSuggestions(false);

    if (!initialQuery.trim()) {
      setSelectedLat(null);
      setSelectedLng(null);
      if (Platform.OS === 'ios') {
        (async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const newRegion = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 8,
              longitudeDelta: 8,
            };
            biasRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setIosRegion(newRegion);
          } catch {}
        })();
      }
    } else if (Platform.OS === 'ios') {
      geocodingService.geocode(initialQuery).then((coords) => {
        if (coords) iosMoveMap(coords.lat, coords.lng);
      });
    }
  }, [visible, initialQuery]);

  // ── Shared: autocomplete ─────────────────────────────────

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    try {
      const bias = biasRef.current;
      const items = await geocodingService.autocomplete(
        text,
        bias?.lat ?? undefined,
        bias?.lng ?? undefined,
      );
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  }, [fetchSuggestions]);

  const handleSelectSuggestion = useCallback((s: PlaceSuggestion) => {
    setSearchQuery(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setSelectedLat(s.lat);
    setSelectedLng(s.lng);
    if (Platform.OS === 'ios') {
      iosMoveMap(s.lat, s.lng);
    } else {
      webMoveMap(s.lat, s.lng, 14);
    }
  }, [iosMoveMap, webMoveMap]);

  // ── Shared: confirm ──────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    const typed = searchQuery.trim();
    if (!allowPointPick) {
      if (typed) onSelect(typed, null, null);
      onClose();
      return;
    }
    if ((selectedLat == null || selectedLng == null) && typed) {
      onSelect(typed, null, null);
      onClose();
      return;
    }
    if (selectedLat == null || selectedLng == null) {
      onClose();
      return;
    }
    setSelecting(true);
    try {
      const label = typed
        || (await geocodingService.reverseGeocode(selectedLat, selectedLng))
        || `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;
      onSelect(label, selectedLat, selectedLng);
      onClose();
    } finally {
      setSelecting(false);
    }
  }, [searchQuery, selectedLat, selectedLng, allowPointPick, onSelect, onClose]);

  // ── Render ───────────────────────────────────────────────

  const Backdrop = Platform.OS === 'android' ? View : BlurView;
  const backdropProps = Platform.OS === 'android'
    ? { style: [styles.scrim, styles.androidScrim] }
    : { intensity: 40, tint: 'dark' as const, style: styles.scrim };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Backdrop {...backdropProps}>
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
              onChangeText={handleTextChange}
              onSubmitEditing={() => {
                setShowSuggestions(false);
                if (suggestions.length > 0) handleSelectSuggestion(suggestions[0]);
              }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity
                onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={secondary} />
              </TouchableOpacity>
            )}
            {searching && <ActivityIndicator size="small" color={accent} />}
          </View>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <ScrollView
              style={[styles.suggestions, { backgroundColor: surface, borderColor: border }]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={s.placeId ?? i}
                  style={[
                    styles.suggestionItem,
                    i < suggestions.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: border,
                    },
                  ]}
                  onPress={() => handleSelectSuggestion(s)}
                >
                  <Ionicons name="location-outline" size={16} color={secondary} />
                  <AppText style={[styles.suggestionText, { color: textColor }]} numberOfLines={2}>
                    {s.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Map: iOS → Apple Maps (react-native-maps), Android → Leaflet (WebView) */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'ios' && MapView ? (
              <MapView
                ref={mapViewRef}
                style={styles.map}
                region={iosRegion}
                onPress={onIosMapPress}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {selectedLat != null && selectedLng != null && (
                  <Marker coordinate={{ latitude: selectedLat, longitude: selectedLng }} />
                )}
              </MapView>
            ) : (
              <WebView
                key={visible ? 'map-visible' : 'map-hidden'}
                ref={webViewRef}
                source={{ html: mapHtml }}
                style={styles.webView}
                scrollEnabled={false}
                onLoadEnd={onMapLoadEnd}
                onMessage={onWebViewMessage}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                androidLayerType="hardware"
                mixedContentMode="always"
                nestedScrollEnabled
                overScrollMode="never"
                allowFileAccess
                cacheEnabled
              />
            )}
          </View>

          <View style={styles.hintRow}>
            <AppText style={[styles.hint, { color: secondary }]}>
              {allowPointPick
                ? 'Search or tap on the map to pick a location'
                : 'Search for a city, region or country'}
            </AppText>
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
              onPress={handleConfirm}
              isLoading={selecting}
              disabled={
                allowPointPick
                  ? selectedLat == null && selectedLng == null && !searchQuery.trim()
                  : !searchQuery.trim()
              }
              style={styles.actionBtn}
            />
          </View>
        </View>
      </Backdrop>
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
  androidScrim: {
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  suggestions: {
    maxHeight: 200,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionText: {
    ...typography.sm,
    flex: 1,
  },
  mapContainer: {
    height: 260,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#e4e4e4',
  },
  hintRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
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
