import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";

interface RiderAttributes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  is_active: boolean;
}

type RiderCreationAttributes = Optional<RiderAttributes, "id" | "is_active">;

class Rider
  extends Model<RiderAttributes, RiderCreationAttributes>
  implements RiderAttributes
{
  declare id: string;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare phone_number: string;
  declare password: string;
  declare gender: "MALE" | "FEMALE" | "OTHER";
  declare is_active: boolean;

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }
}

Rider.init(
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
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: "riders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

Rider.beforeCreate(async (rider) => {
  rider.password = await bcrypt.hash(rider.password, 12);
});

Rider.beforeUpdate(async (rider) => {
  if (rider.changed("password")) {
    rider.password = await bcrypt.hash(rider.password, 12);
  }
});

export default Rider;
