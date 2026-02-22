// Haversine formula --> calculate distance between two lat/lng point
function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(coord1, coord2) {
  const R = 6371; // Earth radius (km)

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
    Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance (km)
}

export function mockRoute(origin, destination) {
  const distanceKm = haversineDistance(origin, destination);

  // Assume average city speed 35km/h
  const averageSpeed = 35;

  const commuteTimeHours = distanceKm / averageSpeed;
  const commuteTimeMinutes = Math.round(commuteTimeHours * 60);

  // Fuel cost estimate (RM0.25 per km approx blended fuel+wear)
  const estimatedTransportCost = Number((distanceKm * 0.25).toFixed(2));

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    commuteTimeMinutes,
    estimatedTransportCost
  };
}
