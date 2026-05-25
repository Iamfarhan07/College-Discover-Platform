import { NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, string[]>;

  constructor(statusCode: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function apiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      // 1. Handle Zod validation errors
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        error.issues.forEach((err: any) => {
          // Identify field path. If path is empty (e.g. body validator root), default to a placeholder
          const path = err.path.length > 0 ? err.path.join(".") : "query";
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });
        return res.status(400).json({
          error: "Validation failed",
          details,
        });
      }

      // 2. Handle Custom API Errors
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          error: error.message,
          ...(error.details ? { details: error.details } : {}),
        });
      }

      // 3. Handle known Prisma database errors
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Record already exists",
        });
      }
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Record not found",
        });
      }

      // 4. Default: Internal Server Error
      console.error("[API Error Details]:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };
}
