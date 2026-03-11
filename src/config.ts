process.loadEnvFile();

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}
 
type APIConfig = {
  dbURL: string,
  fileserverHits: number;
};

export const config: APIConfig = {
  dbURL: envOrThrow("DB_URL"),
  fileserverHits: 0
};