export interface CityCoordinates {
  readonly city: string;
  readonly lat: number;
  readonly lon: number;
}

export const KNOWN_CITIES: Record<string, CityCoordinates> = {
  goa: { city: "Goa (Panaji)", lat: 15.4909, lon: 73.8278 },
  panaji: { city: "Goa (Panaji)", lat: 15.4909, lon: 73.8278 },
  tokyo: { city: "Tokyo", lat: 35.6762, lon: 139.6503 },
  mumbai: { city: "Mumbai", lat: 19.076, lon: 72.8777 },
  delhi: { city: "New Delhi", lat: 28.6139, lon: 77.209 },
  bengaluru: { city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  bangalore: { city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  hyderabad: { city: "Hyderabad", lat: 17.385, lon: 78.4867 },
  chennai: { city: "Chennai", lat: 13.0827, lon: 80.2707 },
  kolkata: { city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  pune: { city: "Pune", lat: 18.5204, lon: 73.8567 },
  london: { city: "London", lat: 51.5072, lon: -0.1276 },
  "new york": { city: "New York", lat: 40.7128, lon: -74.006 },
  "san francisco": { city: "San Francisco", lat: 37.7749, lon: -122.4194 },
  singapore: { city: "Singapore", lat: 1.3521, lon: 103.8198 },
  dubai: { city: "Dubai", lat: 25.2048, lon: 55.2708 },
};

/**
 * Resolves a city name from natural speech via 0ms dictionary or Open-Meteo Geocoding API (<70 lines).
 */
export async function resolveSpokenCity(
  query: string,
  fallbackCity: string,
  fallbackLat: number,
  fallbackLon: number
): Promise<CityCoordinates> {
  const lower = query.toLowerCase();

  for (const [key, coords] of Object.entries(KNOWN_CITIES)) {
    const pattern = new RegExp(`\\b${key}\\b`, "i");
    if (pattern.test(lower)) {
      return coords;
    }
  }

  const match = query.match(
    /\b(?:in|for|at)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)(?:\s+(?:today|now|right now|tomorrow)\b|[?.!,]|$)/i
  );
  const candidate = match?.[1]?.trim();
  const ignoredWords = new Set(["today", "now", "the", "morning", "evening", "night", "outside"]);

  if (candidate && !ignoredWords.has(candidate.toLowerCase())) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ name: string; latitude: number; longitude: number }>;
        };
        const first = data.results?.[0];
        if (first) {
          return { city: first.name, lat: first.latitude, lon: first.longitude };
        }
      }
    } catch {
      // Fallback to default coordinates if offline
    }
  }

  return { city: fallbackCity, lat: fallbackLat, lon: fallbackLon };
}
