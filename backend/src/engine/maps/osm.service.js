import axios from "axios";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function getDistance(origin, destination) {
  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

  const response = await axios.get(url, {
    params: {
      overview: "false"
    }
  });

  const route = response.data.routes[0];

  return {
    distanceKm: route.distance / 1000,
    commuteTimeMinutes: Math.round(route.duration / 60)
  };
}
