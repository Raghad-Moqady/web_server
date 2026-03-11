process.loadEnvFile();
function envOrThrow(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing environment variable: ${key}`);
    return value;
}
export const config = {
    dbURL: envOrThrow("DB_URL"),
    fileserverHits: 0
};
