import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";

interface DriverAttributes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  status: "ONLINE" | "OFFLINE" | "ON_TRIP";
  vehicle_id?: string;
  is_active: boolean;
}

type DriverCreationAttributes = Optional<
  DriverAttributes,
  "id" | "is_active" | "status" | "vehicle_id"
>;

class Driver
  extends Model<DriverAttributes, DriverCreationAttributes>
  implements DriverAttributes
{
  declare id: string;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare phone_number: string;
  declare password: string;
  declare gender: "MALE" | "FEMALE" | "OTHER";
  declare status: "ONLINE" | "OFFLINE" | "ON_TRIP";
  declare vehicle_id: string;
  declare is_active: boolean;

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }
}

Driver.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ONLINE", "OFFLINE", "ON_TRIP"),
      defaultValue: "OFFLINE",
    },
    vehicle_id: { type: DataTypes.UUID, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: "drivers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

Driver.beforeCreate(async (driver) => {
  driver.password = await bcrypt.hash(driver.password, 12);
});

Driver.beforeUpdate(async (driver) => {
  if (driver.changed("password")) {
    driver.password = await bcrypt.hash(driver.password, 12);
  }
});

export default Driver;
