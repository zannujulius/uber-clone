import { FareModel } from "../src/models/Fare";
import { TripModel, TRIP_STATUS } from "../src/models/Trip";
import { publishNotification } from "../src/kafka/producer";
import { processTripRequest } from "../src/services/tripProcessor";

jest.mock("../src/kafka/producer", () => ({
  publishNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/models/Fare", () => ({
  FareModel: {
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../src/models/Trip", () => ({
  TRIP_STATUS: {
    REQUESTED: "Requested",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In_Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
  TripModel: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("processTripRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a trip linked to an existing fare", async () => {
    (FareModel.findByPk as jest.Mock).mockResolvedValueOnce({ id: "fare-1" });

    await processTripRequest({
      riderId: "rider-1",
      pickup_latitude: -1.9441,
      pickup_longitude: 30.0619,
      dropoff_latitude: -1.9536,
      dropoff_longitude: 30.0925,
      pickup_address: "Kigali Heights",
      dropoff_address: "Kimironko",
      estimate_id: "fare-1",
      timestamp: Date.now(),
    });

    expect(TripModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        rider_id: "rider-1",
        fare_id: "fare-1",
        status: TRIP_STATUS.REQUESTED,
      }),
    );

    expect(publishNotification).toHaveBeenCalledWith(
      "rider-1",
      "trip:created",
      expect.objectContaining({
        fare_id: "fare-1",
        status: TRIP_STATUS.REQUESTED,
      }),
    );
  });
});
