import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export const TRIP_STATUS = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In_Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export type TripStatusValue = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

interface TripAttributes {
  id: string;
  rider_id: string;
  driver_id?: string | null;
  fare_id?: string | null;
  vehicle_id?: string | null;
  start_time?: Date | null;
  end_time?: Date | null;
  status: TripStatusValue;
  requested_at?: Date | null;
  completed_at?: Date | null;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  started_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type TripCreationAttributes = Optional<
  TripAttributes,
  | "id"
  | "driver_id"
  | "fare_id"
  | "vehicle_id"
  | "start_time"
  | "end_time"
  | "requested_at"
  | "completed_at"
  | "pickup_address"
  | "dropoff_address"
  | "started_at"
>;

export class TripModel
  extends Model<TripAttributes, TripCreationAttributes>
  implements TripAttributes
{
  public id!: string;
  public rider_id!: string;
  public driver_id!: string | null;
  public fare_id!: string | null;
  public vehicle_id!: string | null;
  public start_time!: Date | null;
  public end_time!: Date | null;
  public status!: TripStatusValue;
  public requested_at!: Date | null;
  public completed_at!: Date | null;
  public pickup_latitude!: number;
  public pickup_longitude!: number;
  public dropoff_latitude!: number;
  public dropoff_longitude!: number;
  public pickup_address!: string | null;
  public dropoff_address!: string | null;
  public started_at!: Date | null;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

TripModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    rider_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    driver_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fare_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    vehicle_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TRIP_STATUS)),
      allowNull: false,
      defaultValue: TRIP_STATUS.REQUESTED,
    },
    requested_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickup_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    pickup_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dropoff_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dropoff_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    pickup_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dropoff_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "trips",
    underscored: true,
  },
);
