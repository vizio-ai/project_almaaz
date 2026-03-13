export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingService {
  /**
   * Autocomplete suggestions as user types.
   * @param biasLat - Optional latitude to bias results towards (e.g. current map center)
   * @param biasLng - Optional longitude to bias results towards
   */
  autocomplete(query: string, biasLat?: number, biasLng?: number): Promise<PlaceSuggestion[]>;
  /** Forward geocoding: place name → coordinates */
  geocode(query: string): Promise<Coordinates | null>;
  /** Reverse geocoding: coordinates → human-readable address/name */
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}
