import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ExternalLink } from 'lucide-react-native';
import { AppText, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';

// ─── Day color palette (matches marker colors in the map HTML) ────────────────

const DAY_COLORS = [
  '#E94D35', '#2D8EFF', '#28A745', '#F5A623',
  '#9B59B6', '#1ABC9C', '#E67E22', '#E91E63',
];

// ─── Map HTML builder ─────────────────────────────────────────────────────────

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  locationText: string | null;
  activityType: string | null;
  startTime: string | null;
  /** Formatted date string for the day, e.g. "04.02.2026" */
  dateLabel: string | null;
  dayNumber: number;
  /** Index into DAY_COLORS */
  dayIndex: number;
  /** 'activity' (default) or 'accommodation' */
  markerType?: 'activity' | 'accommodation';
}

function buildItineraryMapHtml(markers: MarkerData[]): string {
  // Embed markers as JSON inside the HTML so no JS injection is needed after load.
  const markersJson = JSON.stringify(markers);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html,body{margin:0;padding:0;height:100%;width:100%;background:#e8e8e8;}
    #map{width:100%;height:100%;}
    .dm{
      width:26px;height:26px;border-radius:50%;
      border:2.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    }
    .dm-acc{
      width:28px;height:28px;border-radius:6px;
      border:2.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
    }
    .leaflet-popup-content-wrapper{
      border-radius:8px;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.1);
      border:1px solid #e4e4e7;
    }
    .leaflet-popup-content{margin:0;min-width:180px;}
    .leaflet-popup-tip{border-top-color:#fff;}
    .pc{padding:8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
    .pc-title{font-size:12px;font-weight:600;color:#09090b;line-height:16px;margin-bottom:6px;}
    .pc-rows{display:flex;flex-direction:column;gap:4px;}
    .pc-row{display:flex;align-items:center;gap:4px;}
    .pc-icon{width:12px;height:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
    .pc-icon svg{width:12px;height:12px;}
    .pc-label{font-size:12px;color:#18181b;line-height:14px;}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var COLORS=${JSON.stringify(DAY_COLORS)};
    var data=${markersJson};
    var map=L.map('map',{zoomControl:true,attributionControl:false,tap:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    setTimeout(function(){ map.invalidateSize(); },300);
    setTimeout(function(){ map.invalidateSize(); },1000);

    var SVG_TYPE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
    var SVG_LOC='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
    var SVG_TIME='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 15"/></svg>';
    var SVG_BED='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>';

    var bounds=[];
    data.forEach(function(m){
      var c=COLORS[m.dayIndex%COLORS.length];
      var icon;
      if(m.markerType==='accommodation'){
        icon=L.divIcon({
          className:'',
          html:'<div class="dm-acc" style="background:'+c+'">'+SVG_BED+'</div>',
          iconSize:[28,28],iconAnchor:[14,28],popupAnchor:[0,-30]
        });
      }else{
        icon=L.divIcon({
          className:'',
          html:'<div class="dm" style="background:'+c+'">'+m.dayNumber+'</div>',
          iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-28]
        });
      }
      var mk=L.marker([m.lat,m.lng],{icon:icon}).addTo(map);

      var rows='';
      if(m.activityType){
        rows+='<div class="pc-row"><div class="pc-icon">'+SVG_TYPE+'</div><span class="pc-label">'+m.activityType.charAt(0).toUpperCase()+m.activityType.slice(1)+'</span></div>';
      }
      if(m.locationText){
        rows+='<div class="pc-row"><div class="pc-icon">'+SVG_LOC+'</div><span class="pc-label">'+m.locationText+'</span></div>';
      }
      if(m.dateLabel||m.startTime){
        var timeStr=m.dateLabel||'';
        if(m.startTime){timeStr+=(timeStr?' - ':'')+m.startTime;}
        rows+='<div class="pc-row"><div class="pc-icon">'+SVG_TIME+'</div><span class="pc-label">'+timeStr+'</span></div>';
      }

      var popup='<div class="pc"><div class="pc-title">'+m.name+'</div>'+(rows?'<div class="pc-rows">'+rows+'</div>':'')+'</div>';
      mk.bindPopup(popup,{closeButton:false});
      bounds.push([m.lat,m.lng]);
    });

    if(bounds.length===1){
      map.setView(bounds[0],14);
    } else if(bounds.length>1){
      map.fitBounds(L.latLngBounds(bounds),{padding:[36,36]});
    } else {
      map.setView([20,0],2);
    }
  </script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  secondary: string;
  days: ItineraryDay[];
  activitiesByDay: Record<string, Activity[]>;
}

export function MapItineraryTab({ secondary, days, activitiesByDay }: Props) {
  const textColor = useThemeColor('text');
  const surface = useThemeColor('surface');
  const borderMuted = useThemeColor('borderMuted');

  // Separate activities into those with and without coordinates, and add accommodation markers
  const { markers, unmapped } = useMemo(() => {
    const markers: MarkerData[] = [];
    const unmapped: { name: string; dayNumber: number }[] = [];

    days.forEach((day, dayIndex) => {
      const dateLabel = day.date
        ? new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null;

      // Accommodation marker
      if (
        day.accommodation &&
        day.accommodationLatitude != null &&
        day.accommodationLongitude != null
      ) {
        markers.push({
          lat: day.accommodationLatitude,
          lng: day.accommodationLongitude,
          name: day.accommodation,
          locationText: null,
          activityType: null,
          startTime: null,
          dateLabel,
          dayNumber: day.dayNumber,
          dayIndex,
          markerType: 'accommodation',
        });
      }

      // Activity markers
      const acts = activitiesByDay[day.id] ?? [];
      acts.forEach((act) => {
        if (act.latitude != null && act.longitude != null) {
          markers.push({
            lat: act.latitude,
            lng: act.longitude,
            name: act.name,
            locationText: act.locationText ?? null,
            activityType: act.activityType ?? null,
            startTime: act.startTime ?? null,
            dateLabel,
            dayNumber: day.dayNumber,
            dayIndex,
            markerType: 'activity',
          });
        } else {
          unmapped.push({ name: act.name, dayNumber: day.dayNumber });
        }
      });
    });

    return { markers, unmapped };
  }, [days, activitiesByDay]);

  const mapHtml = useMemo(() => buildItineraryMapHtml(markers), [markers]);

  const handleShowOnMap = useCallback(() => {
    if (markers.length === 1) {
      const m = markers[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
      Linking.openURL(url);
      return;
    }
    const origin = `${markers[0].lat},${markers[0].lng}`;
    const dest = `${markers[markers.length - 1].lat},${markers[markers.length - 1].lng}`;
    const waypoints = markers
      .slice(1, -1)
      .map((m) => `${m.lat},${m.lng}`)
      .join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}`;
    Linking.openURL(url);
  }, [markers]);

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (markers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={40} color={secondary} style={styles.emptyIcon} />
        <AppText style={[styles.emptyTitle, { color: secondary }]}>No mapped activities</AppText>
        <AppText style={[styles.emptyHint, { color: secondary }]}>
          Pick a location for your activities in the Detailed View to see them here.
        </AppText>
      </View>
    );
  }

  // ── Map + legend ────────────────────────────────────────────────────────────

  return (
    <View>
      {/* Leaflet map */}
      <View style={[styles.mapContainer, { backgroundColor: surface }]}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.webView}
          scrollEnabled={false}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          androidLayerType="hardware"
          mixedContentMode="compatibility"
          nestedScrollEnabled
        />
      </View>

      {/* Show on Map button */}
      <TouchableOpacity
        style={[styles.showOnMapButton, { borderColor: borderMuted }]}
        activeOpacity={0.7}
        onPress={handleShowOnMap}
      >
        <ExternalLink size={14} color={textColor} strokeWidth={2} />
        <AppText style={[styles.showOnMapLabel, { color: textColor }]}>
          Show on Map ({markers.length})
        </AppText>
      </TouchableOpacity>

      {/* Mapped marker legend */}
      {markers.map((m, i) => (
        <View
          key={i}
          style={[styles.legendRow, { borderBottomColor: borderMuted }]}
        >
          <View
            style={[
              m.markerType === 'accommodation' ? styles.dotSquare : styles.dot,
              { backgroundColor: DAY_COLORS[m.dayIndex % DAY_COLORS.length] },
            ]}
          >
            {m.markerType === 'accommodation' ? (
              <Ionicons name="bed-outline" size={13} color="#fff" />
            ) : (
              <AppText style={styles.dotLabel}>{m.dayNumber}</AppText>
            )}
          </View>
          <View style={styles.legendText}>
            <AppText style={[styles.legendName, { color: textColor }]} numberOfLines={1}>
              {m.name}
            </AppText>
            {m.markerType === 'accommodation' ? (
              <AppText style={[styles.legendLocation, { color: secondary }]} numberOfLines={1}>
                Day {m.dayNumber} · Accommodation
              </AppText>
            ) : m.locationText ? (
              <AppText style={[styles.legendLocation, { color: secondary }]} numberOfLines={1}>
                {m.locationText}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}

      {/* Activities without coordinates */}
      {unmapped.length > 0 && (
        <View style={[styles.unmappedSection, { borderTopColor: borderMuted }]}>
          <AppText style={[styles.unmappedTitle, { color: secondary }]}>
            Without location ({unmapped.length})
          </AppText>
          {unmapped.map((u, i) => (
            <AppText
              key={i}
              style={[styles.unmappedItem, { color: secondary }]}
              numberOfLines={1}
            >
              Day {u.dayNumber} · {u.name}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Empty state
  emptyContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
  },
  emptyHint: {
    ...typography.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Map
  mapContainer: {
    height: 320,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  webView: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },

  // Show on Map button
  showOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  showOnMapLabel: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },

  // Legend rows
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  legendLocation: {
    ...typography.caption,
    marginTop: 1,
  },

  // Unmapped section
  unmappedSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  unmappedTitle: {
    ...typography.caption,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  unmappedItem: {
    ...typography.caption,
  },
});
