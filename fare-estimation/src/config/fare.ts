const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

export const fareConfig = {
  baseFare: numberFromEnv("FARE_BASE_FARE", 500),
  timeRate: numberFromEnv("FARE_TIME_RATE", 50),
  distanceRate: numberFromEnv("FARE_DISTANCE_RATE", 300),
  surgeMultiplier: numberFromEnv("FARE_SURGE_MULTIPLIER", 1),
  currency: process.env.FARE_CURRENCY || "RWF",
  fallbackAverageSpeedKph: numberFromEnv("FARE_FALLBACK_AVERAGE_SPEED_KPH", 28),
};
