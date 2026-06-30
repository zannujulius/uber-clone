import { calculateFare } from "../src/services/fareCalculator";

describe("calculateFare", () => {
  it("applies the configured fare formula", () => {
    const fare = calculateFare(10, 5);

    expect(fare.baseFare).toBe(500);
    expect(fare.timeRate).toBe(50);
    expect(fare.distanceRate).toBe(300);
    expect(fare.surgeMultiplier).toBe(1);
    expect(fare.estimatedFare).toBe(2500);
    expect(fare.currency).toBe("RWF");
  });
});
