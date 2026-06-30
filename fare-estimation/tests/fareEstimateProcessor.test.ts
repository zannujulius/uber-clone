import { FareModel } from "../src/models/Fare";
import { publishNotification } from "../src/kafka/producer";
import { processEstimateRequest } from "../src/services/fareEstimateProcessor";
import * as routeMetricsService from "../src/services/routeMetrics";

jest.mock("../src/kafka/producer", () => ({
  publishNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/models/Fare", () => ({
  FareModel: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("processEstimateRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists the estimate and publishes a ready event", async () => {
    jest
      .spyOn(routeMetricsService, "getRouteMetrics")
      .mockResolvedValueOnce({
        distanceKm: 5,
        durationMinutes: 10,
        source: "google",
      });

    await processEstimateRequest({
      riderId: "rider-1",
      pickup_latitude: -1.9441,
      pickup_longitude: 30.0619,
      dropoff_latitude: -1.9536,
      dropoff_longitude: 30.0925,
      pickup_address: "Kigali Heights",
      dropoff_address: "Kimironko",
      timestamp: Date.now(),
    });

    expect(FareModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        base_fare: 500,
        distance: 5,
        duration: 10,
      }),
    );

    expect(publishNotification).toHaveBeenCalledWith(
      "rider-1",
      "trip:estimate:ready",
      expect.objectContaining({
        amount: 2500,
        currency: "RWF",
        pickup_address: "Kigali Heights",
      }),
    );
  });

  it("publishes a failed event when processing throws", async () => {
    jest
      .spyOn(routeMetricsService, "getRouteMetrics")
      .mockRejectedValueOnce(new Error("Boom"));

    await processEstimateRequest({
      riderId: "rider-1",
      pickup_latitude: -1.9441,
      pickup_longitude: 30.0619,
      dropoff_latitude: -1.9536,
      dropoff_longitude: 30.0925,
      timestamp: Date.now(),
    });

    expect(publishNotification).toHaveBeenCalledWith(
      "rider-1",
      "trip:estimate:failed",
      { message: "Unable to estimate fare right now" },
    );
  });
});
