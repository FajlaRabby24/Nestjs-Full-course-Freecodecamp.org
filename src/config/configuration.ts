export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT!),
  SECRET: process.env.SECRET,

  //   db configuration
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
});

// export const envVars = {
//   NODE_ENV: process.env.NODE_ENV,
//   PORT: Number(process.env.PORT),
// };

// export const envConfiguration = () => envVars;
