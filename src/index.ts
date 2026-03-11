import express, { NextFunction, Request, Response } from "express";
import { middlewareLogResponses } from "./middlewareLogResponses.js";
import { middlewareMetricsInc } from "./middlewareMetricsInc.js";
import { config } from "./config.js";
import { errorHandler } from "./errorMiddleware.js";
import { BadRequestError } from './customErrorClasses.js';

// Automatic Migrations
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
// 

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(middlewareLogResponses);

 
app.get("/api/healthz", (req: Request, res: Response) => {
  res
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("OK");
});

app.get("/admin/metrics",(req:Request,res:Response)=>{
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
})
app.post("/admin/reset", (req: Request, res: Response) => {
  config.api.fileserverHits = 0; 
  res
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("Hits reset to 0");
});
// app.post("/api/validate_chirp", (req: Request, res: Response) => {
//   let body = "";
//   req.on("data", (chunk) => {
//     body += chunk;
//   });
//   req.on("end", () => {
//     try {
//       const parsed = JSON.parse(body);

//       const chirp = parsed.body;

//       if (!chirp) {
//         res.status(400).json({
//           error: "Something went wrong"
//         });
//         return;
//       }

//       if (chirp.length > 140) {
//         res.status(400).json({
//           error: "Chirp is too long"
//         });
//         return;
//       }

//       res.status(200).json({
//         valid: true
//       });

//     } catch (err) {
//       res.status(400).json({
//         error: "Invalid JSON"
//       });
//     }
//   });

// });
app.post("/api/validate_chirp", (req: Request, res: Response,next:NextFunction) => {

  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  try{
  if (!params.body) {
    res.status(400).json({
      error: "Something went wrong"
    });
    return;
  }
 if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const profaneWords = ["kerfuffle", "sharbert", "fornax"]; 
  const words = params.body.split(" ");
  const cleanedWords = words.map((word) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }
    return word;
  });
  const cleanedBody = cleanedWords.join(" ");
 
  res.status(200).json({
    cleanedBody: cleanedBody
  });
}catch(err){
   next(err);
}
 

});
app.use("/app",middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});