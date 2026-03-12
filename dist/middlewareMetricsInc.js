import { config } from "./config.js";
export function middlewareMetricsInc(req, res, next) {
    config.api.fileserverHits++;
    next();
}
