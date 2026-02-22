import { getDistance as getOSMDistance } from "./osm.service.js";
import { mockRoute } from "./mockMaps.js";

const USE_OSM = process.env.USE_OSM === "true";

export async function getRoute(origin, destination) {
  if (USE_OSM) {
    try {
      return await getOSMDistance(origin, destination);
    } catch (err) {
      return mockRoute(origin, destination);
    }
  }

  return mockRoute(origin, destination);
}