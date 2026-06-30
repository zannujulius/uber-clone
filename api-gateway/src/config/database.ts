import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? false : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
);

export default sequelize;
