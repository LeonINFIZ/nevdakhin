import db from './db';

const DADATA_API_KEY = process.env.DADATA_API_KEY || '89887621a67838d1f67b325ffa215f91615a2439';
const DADATA_SECRET_KEY = process.env.DADATA_SECRET_KEY || '9eccd4da1adef4c547cd68f9174d5b50e7eb1bed';

export const BASE_COORDS = {
  lat: 56.131897,
  lon: 43.743571,
  address: 'Нижегородская обл., Богородский м.о., д. Бурцево, ул. Раздолье, 236/2',
};

export const DELIVERY_RULES = {
  radiusKm: 2.0,
  deliveryCost: 250,
  freeDeliveryThreshold: 5000,
};

/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 100) / 100;
}

export interface AddressSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    geo_lat?: string | null;
    geo_lon?: string | null;
    qc_geo?: string | null;
    city?: string | null;
    settlement?: string | null;
    street?: string | null;
    house?: string | null;
  };
}

/**
 * Real-time address suggestions using DaData Suggest API
 */
export async function suggestAddress(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${DADATA_API_KEY}`,
      },
      body: JSON.stringify({
        query: query.trim(),
        count: 5,
        // prioritize Nizhny Novgorod region if not specified
        locations: [
          {
            region: 'Нижегородская',
          },
        ],
      }),
    });

    if (!res.ok) {
      // Fallback without location restriction
      const fallbackRes = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${DADATA_API_KEY}`,
        },
        body: JSON.stringify({ query: query.trim(), count: 5 }),
      });
      const data = await fallbackRes.json();
      return data.suggestions || [];
    }

    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.error('DaData suggest error:', err);
    return [];
  }
}

export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lon: number;
  distanceKm: number;
  isEligible: boolean;
  deliveryCost: number;
  reason?: string;
  qcGeo?: number;
}

/**
 * Standardize address and calculate exact distance to production base
 */
export async function geocodeAndCalculateDistance(
  address: string,
  subtotal: number = 0
): Promise<GeocodeResult> {
  const normalizedQuery = address.trim().toLowerCase();

  // 1. Check SQLite cache
  const cached = db
    .prepare('SELECT * FROM geocache WHERE address_query = ?')
    .get(normalizedQuery) as
    | {
        result_address: string;
        geo_lat: number;
        geo_lon: number;
        distance_km: number;
      }
    | undefined;

  if (cached && cached.geo_lat && cached.geo_lon) {
    const isEligible = cached.distance_km <= DELIVERY_RULES.radiusKm;
    const deliveryCost = isEligible
      ? subtotal >= DELIVERY_RULES.freeDeliveryThreshold
        ? 0
        : DELIVERY_RULES.deliveryCost
      : 0;

    return {
      formattedAddress: cached.result_address,
      lat: cached.geo_lat,
      lon: cached.geo_lon,
      distanceKm: cached.distance_km,
      isEligible,
      deliveryCost,
      reason: isEligible
        ? undefined
        : `Расстояние до адреса ${cached.distance_km} км. Доставка действует только в радиусе ${DELIVERY_RULES.radiusKm} км от производства в д. Бурцево.`,
    };
  }

  // 2. Query DaData Clean API
  try {
    const res = await fetch('https://cleaner.dadata.ru/api/v1/clean/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${DADATA_API_KEY}`,
        'X-Secret': DADATA_SECRET_KEY,
      },
      body: JSON.stringify([address.trim()]),
    });

    if (!res.ok) {
      throw new Error(`DaData cleaner error: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data || !data[0]) {
      throw new Error('Адрес не найден');
    }

    const item = data[0];
    const lat = item.geo_lat ? parseFloat(item.geo_lat) : null;
    const lon = item.geo_lon ? parseFloat(item.geo_lon) : null;
    const formattedAddress = item.result || address;

    if (!lat || !lon) {
      return {
        formattedAddress,
        lat: 0,
        lon: 0,
        distanceKm: 999,
        isEligible: false,
        deliveryCost: 0,
        reason: 'Не удалось точно определить координаты данного адреса. Уточните улицу и номер дома.',
      };
    }

    const distanceKm = calculateDistanceKm(BASE_COORDS.lat, BASE_COORDS.lon, lat, lon);
    const isEligible = distanceKm <= DELIVERY_RULES.radiusKm;
    const deliveryCost = isEligible
      ? subtotal >= DELIVERY_RULES.freeDeliveryThreshold
        ? 0
        : DELIVERY_RULES.deliveryCost
      : 0;

    // Cache result in SQLite
    db.prepare(`
      INSERT OR REPLACE INTO geocache (address_query, result_address, geo_lat, geo_lon, distance_km, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(normalizedQuery, formattedAddress, lat, lon, distanceKm);

    return {
      formattedAddress,
      lat,
      lon,
      distanceKm,
      isEligible,
      deliveryCost,
      qcGeo: item.qc_geo,
      reason: isEligible
        ? undefined
        : `Расстояние до адреса ${distanceKm} км. Доставка курьером осуществляется только в радиусе ${DELIVERY_RULES.radiusKm} км от производства (д. Бурцево).`,
    };
  } catch (err: any) {
    console.error('Geocoding error:', err);
    return {
      formattedAddress: address,
      lat: 0,
      lon: 0,
      distanceKm: 999,
      isEligible: false,
      deliveryCost: 0,
      reason: 'Ошибка сервиса геокодирования. Пожалуйста, проверьте введённый адрес или выберите самовывоз.',
    };
  }
}
