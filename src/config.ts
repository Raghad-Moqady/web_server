import { MigrationConfig } from "drizzle-orm/migrator";
process.loadEnvFile();

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}
export const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",  
};
 
 
type APIConfig = {
  fileserverHits: number;
};
type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};
 

export const config = {
  api: {
    fileserverHits: 0,
  } as APIConfig,
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig,
  } as DBConfig,
};
 


