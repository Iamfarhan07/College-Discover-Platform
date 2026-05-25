import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";
import { loginSchema } from "../../../lib/validators/auth";
import { signToken } from "../../../lib/jwt";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // 1. Validate request body
  const body = loginSchema.parse(req.body);

  // 2. Fetch user
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(body.password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 4. Generate token
  const token = signToken({ userId: user.id });

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}

export default apiHandler(handler);
