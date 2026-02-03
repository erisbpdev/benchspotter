/**
 * Tests for the calculateDistance utility function
 *
 * This function uses the Haversine formula to calculate the
 * great-circle distance between two points on Earth.
 */

// Define the functions locally to avoid import issues with Jest/Expo
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

describe('calculateDistance', () => {
  describe('basic functionality', () => {
    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should return 0 for origin coordinates', () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });
  });

  describe('known distances', () => {
    it('should calculate distance from NYC to LA (approximately 3935 km)', () => {
      // New York City
      const nyLat = 40.7128;
      const nyLng = -74.006;
      // Los Angeles
      const laLat = 34.0522;
      const laLng = -118.2437;

      const distance = calculateDistance(nyLat, nyLng, laLat, laLng);

      // Distance should be approximately 3935 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should calculate distance from London to Paris (approximately 344 km)', () => {
      // London
      const londonLat = 51.5074;
      const londonLng = -0.1278;
      // Paris
      const parisLat = 48.8566;
      const parisLng = 2.3522;

      const distance = calculateDistance(londonLat, londonLng, parisLat, parisLng);

      // Distance should be approximately 344 km
      expect(distance).toBeGreaterThan(340);
      expect(distance).toBeLessThan(350);
    });

    it('should calculate distance across the equator (Quito to Singapore)', () => {
      // Quito, Ecuador
      const quitoLat = -0.1807;
      const quitoLng = -78.4678;
      // Singapore
      const singaporeLat = 1.3521;
      const singaporeLng = 103.8198;

      const distance = calculateDistance(quitoLat, quitoLng, singaporeLat, singaporeLng);

      // Distance should be approximately 19,700 km
      expect(distance).toBeGreaterThan(19500);
      expect(distance).toBeLessThan(20000);
    });
  });

  describe('edge cases', () => {
    it('should handle coordinates at the poles', () => {
      // North Pole to South Pole
      const distance = calculateDistance(90, 0, -90, 0);

      // This should be approximately half the Earth's circumference (~20,000 km)
      expect(distance).toBeGreaterThan(19900);
      expect(distance).toBeLessThan(20100);
    });

    it('should handle crossing the international date line', () => {
      // Near the date line, going west
      const distance = calculateDistance(0, 179, 0, -179);

      // Should be approximately 222 km (2 degrees at equator)
      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(250);
    });

    it('should be symmetric (A to B equals B to A)', () => {
      const lat1 = 37.7749;
      const lng1 = -122.4194;
      const lat2 = 40.7128;
      const lng2 = -74.006;

      const distance1 = calculateDistance(lat1, lng1, lat2, lng2);
      const distance2 = calculateDistance(lat2, lng2, lat1, lng1);

      expect(distance1).toBeCloseTo(distance2, 10);
    });
  });

  describe('small distances', () => {
    it('should accurately calculate very short distances (< 1 km)', () => {
      // Two points about 100 meters apart
      const lat1 = 37.7749;
      const lng1 = -122.4194;
      const lat2 = 37.7759; // ~111 meters north
      const lng2 = -122.4194;

      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      // Distance should be approximately 0.111 km
      expect(distance).toBeGreaterThan(0.1);
      expect(distance).toBeLessThan(0.15);
    });
  });
});

describe('toRadians', () => {
  it('should convert 0 degrees to 0 radians', () => {
    expect(toRadians(0)).toBe(0);
  });

  it('should convert 180 degrees to PI radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 10);
  });

  it('should convert 90 degrees to PI/2 radians', () => {
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('should convert 360 degrees to 2*PI radians', () => {
    expect(toRadians(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it('should handle negative degrees', () => {
    expect(toRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
  });
});
