import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
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
  dayNumber: number;
  /** Index into DAY_COLORS */
  dayIndex: number;
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
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var COLORS=${JSON.stringify(DAY_COLORS)};
    var data=${markersJson};
    var map=L.map('map',{zoomControl:true,attributionControl:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    var bounds=[];
    data.forEach(function(m){
      var c=COLORS[m.dayIndex%COLORS.length];
      var icon=L.divIcon({
        className:'',
        html:'<div class="dm" style="background:'+c+'">'+m.dayNumber+'</div>',
        iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-28]
      });
      var mk=L.marker([m.lat,m.lng],{icon:icon}).addTo(map);
      var popup='<b>'+m.name+'</b>'+(m.locationText?'<br><small>'+m.locationText+'</small>':'');
      mk.bindPopup(popup);
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

  // Separate activities into those with and without coordinates
  const { markers, unmapped } = useMemo(() => {
    const markers: MarkerData[] = [];
    const unmapped: { name: string; dayNumber: number }[] = [];

    days.forEach((day, dayIndex) => {
      const acts = activitiesByDay[day.id] ?? [];
      acts.forEach((act) => {
        if (act.latitude != null && act.longitude != null) {
          markers.push({
            lat: act.latitude,
            lng: act.longitude,
            name: act.name,
            locationText: act.locationText ?? null,
            dayNumber: day.dayNumber,
            dayIndex,
          });
        } else {
          unmapped.push({ name: act.name, dayNumber: day.dayNumber });
        }
      });
    });

    return { markers, unmapped };
  }, [days, activitiesByDay]);

  const mapHtml = useMemo(() => buildItineraryMapHtml(markers), [markers]);

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
        />
      </View>

      {/* Mapped activity legend */}
      {markers.map((m, i) => (
        <View
          key={i}
          style={[styles.legendRow, { borderBottomColor: borderMuted }]}
        >
          <View style={[styles.dot, { backgroundColor: DAY_COLORS[m.dayIndex % DAY_COLORS.length] }]}>
            <AppText style={styles.dotLabel}>{m.dayNumber}</AppText>
          </View>
          <View style={styles.legendText}>
            <AppText style={[styles.legendName, { color: textColor }]} numberOfLines={1}>
              {m.name}
            </AppText>
            {m.locationText ? (
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
