import axios from 'axios';

// Simple in-memory cache
const cache = {
    geo: new Map(),
    transit: new Map()
};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCacheKey(lat, lng) {
    return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export const locationService = {
    async resolveLocation(lat, lng) {
        if (!lat || !lng) return null;

        const key = getCacheKey(Number(lat), Number(lng));
        const now = Date.now();

        if (cache.geo.has(key)) {
            const entry = cache.geo.get(key);
            if (now - entry.timestamp < CACHE_TTL) return entry.data;
        }

        try {
            // Free Nominatim API (Recall: Usage policy requires User-Agent)
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'CostPilot-Hackathon-App/1.0' }
            });

            const addr = res.data.address || {};
            const result = {
                city: addr.city || addr.town || addr.district || addr.suburb || "Unknown",
                state: addr.state || "",
                postcode: addr.postcode || "",
                full_name: res.data.display_name
            };

            cache.geo.set(key, { timestamp: now, data: result });
            return result;
        } catch (e) {
            console.error("Geocode failed:", e.message);
            return { city: "Unknown", state: "" };
        }
    },

    async findNearestTransit(lat, lng) {
        if (!lat || !lng) return [];

        const key = getCacheKey(Number(lat), Number(lng));
        const now = Date.now();

        if (cache.transit.has(key)) {
            const entry = cache.transit.get(key);
            if (now - entry.timestamp < CACHE_TTL) return entry.data;
        }

        try {
            // Overpass API for railway stations (MRT, LRT, Monorail, KTM) within 3km
            const query = `
                [out:json];
                (
                  node["railway"~"station|subway|light_rail|monorail"](around:3000, ${lat}, ${lng});
                );
                out body 5;
            `;
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
            const res = await axios.get(url);

            const stations = res.data.elements.map(el => {
                const dist = calculateDistance(lat, lng, el.lat, el.lon);
                return {
                    name: el.tags.name,
                    type: el.tags.railway || "transit",
                    distanceKm: Number(dist.toFixed(1)),
                    operator: el.tags.operator
                };
            })
                .filter(s => s.name) // valid names only
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .slice(0, 3); // Top 3

            cache.transit.set(key, { timestamp: now, data: stations });
            return stations;
        } catch (e) {
            console.error("Transit lookup failed:", e.message);
            return [];
        }
    },

    async getContext(lat, lng) {
        if (!lat || !lng) return null;
        const [geo, transit] = await Promise.all([
            this.resolveLocation(lat, lng),
            this.findNearestTransit(lat, lng)
        ]);

        return {
            ...geo,
            nearbyTransit: transit
        };
    }
};

// Haversine formula for distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
