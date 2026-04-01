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
  platform:string;
  key:string
};
type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};
type AuthConfig={
  jwtSecret: string;
}
 
export const config = {
  api: {
    fileserverHits: 0,
    platform:process.env["PLATFORM"],
    key:process.env["POLKA_KEY"],
  } as APIConfig,
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig,
  } as DBConfig,
  auth: {
    jwtSecret: envOrThrow("JWT_SECRET"),
  } as AuthConfig,
};
 


