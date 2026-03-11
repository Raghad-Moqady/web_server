import { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "./customErrorClasses.js";

export const errorHandler = (err: Error, req: Request,res: Response,next: NextFunction) => {
  console.log(err);

  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });

  } else if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });

  } else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });

  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message }); 
  } else {
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
 
}; 