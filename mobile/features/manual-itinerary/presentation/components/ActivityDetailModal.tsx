import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Clock2, MapPin } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import {
  AppText,
  AppInput,
  PrimaryButton,
  FilterChipGroup,
  spacing,
  radii,
  typography,
  useThemeColor,
  type FilterChipOption,
} from '@shared/ui-kit';
import type { Activity, ActivityType } from '../../domain/entities/Activity';

let MapView: any = null;
let Marker: any = null;
if (Platform.OS === 'ios') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
}

const ACTIVITY_TYPE_OPTIONS: FilterChipOption<ActivityType>[] = [
  { value: 'park', label: 'Park' },
  { value: 'museum', label: 'Museum' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'historic', label: 'Historic place' },
  { value: 'beach', label: 'Beach' },
];

const DEFAULT_LAT = 41.0082;
const DEFAULT_LNG = 28.9784;

function buildStaticMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body{margin:0;padding:0;height:100%;width:100%;}#map{width:100%;height:100%;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat}, ${lng}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([${lat}, ${lng}]).addTo(map);
  setTimeout(function(){ map.invalidateSize(); }, 300);
</script>
</body></html>`;
}

export interface ActivityDetailModalProps {
  visible: boolean;
  activity: Activity | null;
  onSave: (params: {
    name: string;
    activityType: ActivityType;
    startTime: string | null;
    locationText: string | null;
  }) => void;
  onDelete: () => void;
  onClose: () => void;
  onPressLocation?: () => void;
  onPressTime?: () => void;
}

export function ActivityDetailModal({
  visible,
  activity,
  onSave,
  onDelete,
  onClose,
  onPressLocation,
  onPressTime,
}: ActivityDetailModalProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const [name, setName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('park');
  const [timeValue, setTimeValue] = useState('');
  const [locationText, setLocationText] = useState('');

  useEffect(() => {
    if (visible && activity) {
      setName(activity.name);
      setActivityType(activity.activityType ?? 'park');
      setTimeValue(activity.startTime ?? '');
      setLocationText(activity.locationText ?? '');
    }
  }, [visible, activity]);

  const handleSave = useCallback(() => {
    onSave({
      name: name.trim() || 'Activity',
      activityType,
      startTime: timeValue || null,
      locationText: locationText || null,
    });
  }, [name, activityType, timeValue, locationText, onSave]);

  const lat = activity?.latitude ?? DEFAULT_LAT;
  const lng = activity?.longitude ?? DEFAULT_LNG;
  const hasCoords = activity?.latitude != null && activity?.longitude != null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: surface }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <AppText style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            {activity?.name || 'Activity Details'}
          </AppText>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={20} color={secondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'ios' && MapView ? (
              <MapView
                style={styles.map}
                region={{
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: hasCoords ? 0.02 : 30,
                  longitudeDelta: hasCoords ? 0.02 : 30,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                showsUserLocation={false}
              >
                {hasCoords && (
                  <Marker coordinate={{ latitude: lat, longitude: lng }} />
                )}
              </MapView>
            ) : (
              <WebView
                source={{ html: buildStaticMapHtml(lat, lng) }}
                style={styles.map}
                scrollEnabled={false}
                originWhitelist={['*']}
                javaScriptEnabled
              />
            )}
          </View>

          {/* Activity name */}
          <View style={styles.fieldBlock}>
            <AppText style={[styles.fieldLabel, { color: textColor }]}>Activity Name</AppText>
            <AppInput
              value={name}
              onChangeText={setName}
              placeholder="Activity name"
            />
          </View>

          {/* Time + Place */}
          <View style={styles.pickersRow}>
            <View style={styles.pickerColSmall}>
              <AppText style={[styles.pickerLabel, { color: textColor }]}>Time</AppText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: border }]}
                onPress={onPressTime}
                activeOpacity={0.8}
              >
                <Clock2 size={16} color={secondary} strokeWidth={1.8} />
                <AppText
                  style={[styles.pickerText, { color: timeValue ? textColor : secondary }]}
                  numberOfLines={1}
                >
                  {timeValue || 'Add time'}
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerColLarge}>
              <AppText style={[styles.pickerLabel, { color: textColor }]}>Place</AppText>
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: border }]}
                onPress={onPressLocation}
                activeOpacity={0.8}
              >
                <MapPin size={16} color={secondary} strokeWidth={1.8} />
                <AppText
                  style={[styles.pickerText, { color: locationText ? textColor : secondary }]}
                  numberOfLines={1}
                >
                  {locationText || 'Add location'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity type */}
          <View style={styles.typeRow}>
            <AppText style={[styles.pickerLabel, { color: textColor }]}>Activity type</AppText>
            <FilterChipGroup
              options={ACTIVITY_TYPE_OPTIONS}
              value={activityType}
              onChange={(type) => type && setActivityType(type)}
            />
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: border }]}>
          <View style={styles.actionsRow}>
            <View style={styles.actionCol}>
              <PrimaryButton label="Cancel" variant="outline" onPress={onClose} />
            </View>
            <View style={styles.actionCol}>
              <PrimaryButton label="Save" onPress={handleSave} />
            </View>
          </View>
          <PrimaryButton
            label="Delete"
            variant="outline"
            onPress={onDelete}
            labelStyle={styles.deleteLabel}
            style={styles.deleteButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    ...typography.base,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  mapContainer: {
    height: 200,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.sm,
    fontWeight: '500',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerColSmall: {
    width: 110,
    gap: spacing.xs,
  },
  pickerColLarge: {
    flex: 1,
    gap: spacing.xs,
  },
  pickerLabel: {
    ...typography.sm,
    fontWeight: '500',
  },
  pickerTrigger: {
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  pickerText: {
    flex: 1,
    ...typography.sm,
  },
  typeRow: {
    gap: spacing.xs,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#A1A1AA',
  },
  deleteLabel: {
    color: '#DC2626',
  },
});
