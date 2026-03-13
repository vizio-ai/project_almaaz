import type { GeocodingService, PlaceSuggestion, Coordinates } from './GeocodingService';

const BASE = 'https://api.geoapify.com/v1';

/** Builds a concise "Name, City, Country" label instead of the verbose formatted address. */
function buildLabel(props: Record<string, any>): string {
  const parts: string[] = [];

  const primary = props.name || props.address_line1;
  if (primary) parts.push(primary);

  const locality = props.city || props.county || props.state;
  if (locality && locality !== primary) parts.push(locality);

  if (props.country) parts.push(props.country);

  return parts.length > 0 ? parts.join(', ') : (props.formatted ?? '');
}

export class GeoapifyGeocodingService implements GeocodingService {
  constructor(private readonly apiKey: string) {}

  async autocomplete(query: string, biasLat?: number, biasLng?: number): Promise<PlaceSuggestion[]> {
    if (query.trim().length < 2) return [];
    try {
      // bias=proximity ranks results near the given point without hard-filtering
      const bias = biasLat != null && biasLng != null
        ? `&bias=proximity:${biasLng},${biasLat}`
        : '';
      const res = await fetch(
        `${BASE}/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=6&lang=en${bias}&apiKey=${this.apiKey}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.features ?? []).map((f: any) => ({
        label: buildLabel(f.properties),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        placeId: f.properties.place_id ?? undefined,
      }));
    } catch {
      return [];
    }
  }

  async geocode(query: string): Promise<Coordinates | null> {
    if (!query.trim()) return null;
    try {
      const res = await fetch(
        `${BASE}/geocode/search?text=${encodeURIComponent(query)}&limit=1&lang=en&apiKey=${this.apiKey}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      const f = data.features?.[0];
      if (!f) return null;
      return {
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    } catch {
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const res = await fetch(
        `${BASE}/geocode/reverse?lat=${lat}&lon=${lng}&lang=en&apiKey=${this.apiKey}`,
      );
      if (!res.ok) return null;
      const props = (await res.json()).features?.[0]?.properties;
      if (!props) return null;
      return buildLabel(props);
    } catch {
      return null;
    }
  }
}
