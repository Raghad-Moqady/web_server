import express from "express";
import { middlewareLogResponses } from "./middlewareLogResponses.js";
import { middlewareMetricsInc } from "./middlewareMetricsInc.js";
import { config } from "./config.js";
const app = express();
const PORT = 8080;
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
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body> 
</html>
`);
});
app.post("/admin/reset", (req, res) => {
    config.fileserverHits = 0;
    res
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("Hits reset to 0");
});
app.post("/api/validate_chirp", (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });
    req.on("end", () => {
        try {
            const parsed = JSON.parse(body);
            const chirp = parsed.body;
            if (!chirp) {
                res.status(400).json({
                    error: "Something went wrong"
                });
                return;
            }
            if (chirp.length > 140) {
                res.status(400).json({
                    error: "Chirp is too long"
                });
                return;
            }
            res.status(200).json({
                valid: true
            });
        }
        catch (err) {
            res.status(400).json({
                error: "Invalid JSON"
            });
        }
    });
});
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
