import { fareConfig } from "../config/fare";
import { FareBreakdown } from "../types";

const roundMoney = (value: number): number => Math.round(value);

const roundMetric = (value: number): number => Math.round(value * 100) / 100;

export const calculateFare = (
  durationMinutes: number,
  distanceKm: number,
): FareBreakdown => {
  const baseFare = fareConfig.baseFare;
  const timeRate = fareConfig.timeRate;
  const distanceRate = fareConfig.distanceRate;
  const surgeMultiplier = fareConfig.surgeMultiplier;

  const subtotal =
    baseFare + timeRate * durationMinutes + distanceRate * distanceKm;
  const estimatedFare = roundMoney(subtotal * surgeMultiplier);

  return {
    baseFare,
    timeRate,
    distanceRate,
    surgeMultiplier,
    currency: fareConfig.currency,
    durationMinutes: roundMetric(durationMinutes),
    distanceKm: roundMetric(distanceKm),
    estimatedFare,
  };
};
