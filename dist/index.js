import express from "express";
import { middlewareLogResponses } from "./middlewareLogResponses.js";
import { middlewareMetricsInc } from "./middlewareMetricsInc.js";
import { config } from "./config.js";
import { errorHandler } from "./errorMiddleware.js";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from './customErrorClasses.js';
// Automatic Migrations
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser, deleteAllUsers, findByEmail, updateAuthedUser, upgrade } from "./db/queries/users.js";
import { createChirp, deleteChirp, getAllChirps, getChirpById } from "./db/queries/chirps.js";
import { checkPasswordHash, getAPIKey, getBearerToken, hashPassword, makeJWT, makeRefreshToken, validateJWT } from "./auth.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken } from "./db/queries/auth.js";
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
// 
const app = express();
const PORT = 8080;
app.use(express.json());
app.use(middlewareLogResponses);
app.get("/api/healthz", (req, res) => {
    res
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("OK");
});
app.get("/admin/metrics", (req, res) => {
    res
        .set("Content-Type", "text/html; charset=utf-8")
        .send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body> 
</html>
`);
});
app.post("/admin/reset", async (req, res) => {
    if (config.api.platform !== "dev") {
        return res.status(403).send("Forbidden");
    }
    await deleteAllUsers();
    res.send("All users deleted");
});
app.post("/api/chirps", async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        const userId = validateJWT(token, config.auth.jwtSecret);
        const { body } = req.body;
        if (!body) {
            throw new BadRequestError("Chirp body is required");
        }
        if (!userId) {
            throw new BadRequestError("User ID is required");
        }
        if (body.length > 140) {
            throw new BadRequestError("Chirp is too long. Max length is 140");
        }
        const profaneWords = ["kerfuffle", "sharbert", "fornax"];
        const words = body.split(" ");
        const cleanedWords = words.map((word) => {
            if (profaneWords.includes(word.toLowerCase())) {
                return "****";
            }
            return word;
        });
        const cleanedBody = cleanedWords.join(" ");
        const chirp = await createChirp(cleanedBody, userId);
        res.status(201).json(chirp);
    }
    catch (err) {
        next(err);
    }
});
app.get("/api/chirps", async (req, res, next) => {
    try {
        const chirps = await getAllChirps();
        res.status(200).json(chirps);
    }
    catch (err) {
        next(err);
    }
});
app.get("/api/chirps/:chirpId", async (req, res, next) => {
    try {
        const { chirpId } = req.params;
        const chirp = await getChirpById(chirpId);
        if (!chirp) {
            throw new NotFoundError("Chirp is Not Found");
        }
        res.status(200).json(chirp);
    }
    catch (err) {
        next(err);
    }
});
app.post("/api/users", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const newUser = await createUser(email, hashedPassword);
    const { ...response } = newUser;
    res.status(201).json(response);
});
app.post("/api/login", async (req, res) => {
    const { email, password, expiresInSeconds } = req.body;
    const user = await findByEmail(email);
    if (!user) {
        throw new UnauthorizedError("incorrect email or password");
    }
    if (!await checkPasswordHash(password, user.hashedPassword)) {
        throw new UnauthorizedError("incorrect email or password");
    }
    let expiresIn = 60 * 60;
    if (expiresInSeconds) {
        expiresIn = Math.min(expiresInSeconds, 60 * 60);
    }
    const token = makeJWT(user.id, expiresIn, config.auth.jwtSecret);
    const refreshToken = makeRefreshToken();
    await createRefreshToken(refreshToken, user.id);
    const { isChirpyRed, ...response } = user;
    res.status(200).json({ response, token, refreshToken, isChirpyRed, email, });
});
app.post("/api/refresh", async (req, res) => {
    try {
        const token = getBearerToken(req);
        const stored = await getRefreshToken(token);
        if (!stored ||
            stored.revokedAt ||
            stored.expiresAt < new Date()) {
            return res.status(401).json({ error: "invalid token" });
        }
        const accessToken = makeJWT(stored.userId, 60 * 60, config.auth.jwtSecret);
        res.status(200).json({ token: accessToken });
    }
    catch {
        res.status(401).json({ error: "invalid token" });
    }
});
app.post("/api/revoke", async (req, res) => {
    try {
        const token = getBearerToken(req);
        await revokeRefreshToken(token);
        res.status(204).send();
    }
    catch {
        res.status(401).json({ error: "invalid token" });
    }
});
app.put("/api/users", async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        const userId = validateJWT(token, config.auth.jwtSecret);
        if (!userId)
            throw new UnauthorizedError("Invalid token");
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestError("Email and password are required");
        }
        const hashedPassword = await hashPassword(password);
        const updatedUser = await updateAuthedUser(email, hashedPassword, userId);
        if (!updatedUser) {
            throw new BadRequestError("User not found");
        }
        const { ...response } = updatedUser;
        res.status(200).json(response);
    }
    catch (err) {
        next(err);
    }
});
app.delete("/api/chirps/:chirpId", async (req, res, next) => {
    try {
        const token = getBearerToken(req);
        const userId = validateJWT(token, config.auth.jwtSecret);
        const chirpId = req.params.chirpId;
        const chirp = await getChirpById(chirpId);
        if (!chirp) {
            throw new NotFoundError("Chirp not found");
        }
        if (chirp.userId !== userId) {
            throw new ForbiddenError("Forbidden");
        }
        await deleteChirp(chirpId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
app.post("/api/polka/webhooks", async (req, res, next) => {
    try {
        if (getAPIKey(req) !== config.api.key) {
            throw new UnauthorizedError("");
        }
        const { event, data } = req.body;
        const { userId } = data;
        if (event !== "user.upgraded") {
            res.status(204).send();
        }
        else if (event === "user.upgraded") {
            const updatedUser = await upgrade(userId);
            if (!updatedUser) {
                throw new NotFoundError("User not found");
            }
            return res.status(204).send();
        }
    }
    catch (err) {
        next(err);
    }
});
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
