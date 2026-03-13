export type { GeocodingService, PlaceSuggestion, Coordinates } from './GeocodingService';
export { GeoapifyGeocodingService } from './GeoapifyGeocodingService';

import { GeoapifyGeocodingService } from './GeoapifyGeocodingService';
import type { GeocodingService } from './GeocodingService';

// Active geocoding provider — swap this one line to change provider
export const geocodingService: GeocodingService = new GeoapifyGeocodingService(
  process.env.EXPO_PUBLIC_GEOAPIFY_KEY ?? '',
);
