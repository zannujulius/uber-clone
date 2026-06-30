import sequelize from "../config/database";
import { FareModel } from "./Fare";
import { TripModel } from "./Trip";

FareModel.hasMany(TripModel, {
  foreignKey: "fare_id",
  as: "trips",
});

TripModel.belongsTo(FareModel, {
  foreignKey: "fare_id",
  as: "fare",
});

export const syncDatabase = async (): Promise<void> => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Fare-estimation database connected");
};
