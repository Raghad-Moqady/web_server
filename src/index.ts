import express, { Request, Response } from "express";
import { middlewareLogResponses } from "./middlewareLogResponses.js";
import { middlewareMetricsInc } from "./middlewareMetricsInc.js";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);

 
app.get("/healthz", (req: Request, res: Response) => {
  res
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("OK");
});

app.get("/metrics",(req:Request,res:Response)=>{
    res.set("Content-Type", "text/plain; charset=utf-8")
    .send(`Hits: ${config.fileserverHits}`);
})
app.get("/reset", (req: Request, res: Response) => {
  config.fileserverHits = 0; 
  res
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("Hits reset to 0");
});
app.use("/app",middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});