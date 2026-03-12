import express, { NextFunction, Request, Response } from "express";
import { middlewareLogResponses } from "./middlewareLogResponses.js";
import { middlewareMetricsInc } from "./middlewareMetricsInc.js";
import { config } from "./config.js";
import { errorHandler } from "./errorMiddleware.js";
import { BadRequestError, NotFoundError } from './customErrorClasses.js';


// Automatic Migrations
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser, deleteAllUsers } from "./db/queries/users.js";
import { createChirp, getAllChirps, getChirpById } from "./db/queries/chirps.js";

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
app.post("/admin/reset", async(req: Request, res: Response) => {
   if (config.api.platform !== "dev") {
    return res.status(403).send("Forbidden");
  }
  await deleteAllUsers();
  res.send("All users deleted");
});
app.post("/api/chirps", async (req, res, next:NextFunction) => {

  const { body, userId } = req.body; 
  
  try{
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
  const cleanedWords = words.map((word:string) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }
    return word;
  });
  const cleanedBody = cleanedWords.join(" ");
  const chirp = await createChirp(cleanedBody, userId);

  res.status(201).json(chirp);
  
}catch(err){
   next(err);
}  
});
app.get("/api/chirps", async (req, res, next:NextFunction) => {
 try {
    const chirps = await getAllChirps();
    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
});
app.get("/api/chirps/:chirpId", async (req, res, next:NextFunction) => {
 try {
    const {chirpId} = req.params; 
    const chirp = await getChirpById(chirpId);
    if(!chirp){
      throw new NotFoundError("Chirp is Not Found");
    }
    res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users", async (req: Request, res: Response) => {
  const { email } = req.body;
  const newUser = await createUser({ email });
  res.status(201).json(newUser);
}); 
app.use("/app",middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});