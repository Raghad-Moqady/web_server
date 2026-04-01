process.loadEnvFile();
function envOrThrow(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing environment variable: ${key}`);
    return value;
}
export const migrationConfig = {
    migrationsFolder: "./src/db/migrations",
};
export const config = {
    api: {
        fileserverHits: 0,
        platform: process.env["PLATFORM"],
        key: process.env["POLKA_KEY"],
    },
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig,
    },
    auth: {
        jwtSecret: envOrThrow("JWT_SECRET"),
    },
};
