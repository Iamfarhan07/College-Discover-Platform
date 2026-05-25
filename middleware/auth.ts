import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../lib/jwt";
import { ApiError } from "../lib/apiHandler";

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: number;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any> | any
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthenticated: Missing or invalid token");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new ApiError(401, "Unauthenticated: Invalid or expired token");
    }

    // Attach user information to request
    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
    };

    return handler(req as AuthenticatedRequest, res);
  };
}
