import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface FareAttributes {
  id: string;
  base_fare: number;
  distance: number;
  duration: number;
  surge_multiplier: number;
  currency: string;
  created_at?: Date;
  updated_at?: Date;
}

type FareCreationAttributes = Optional<FareAttributes, "id">;

export class FareModel
  extends Model<FareAttributes, FareCreationAttributes>
  implements FareAttributes
{
  public id!: string;
  public base_fare!: number;
  public distance!: number;
  public duration!: number;
  public surge_multiplier!: number;
  public currency!: string;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

FareModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    base_fare: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    distance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    surge_multiplier: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "RWF",
    },
  },
  {
    sequelize,
    tableName: "fares",
    underscored: true,
  },
);
