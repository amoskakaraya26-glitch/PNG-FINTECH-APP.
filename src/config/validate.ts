export function validateEnv() {
  const required = [
    'PORT'
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      throw new Error(
        `Missing env variable: ${key}`
      );
    }
  });
}
