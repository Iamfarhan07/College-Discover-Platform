import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";
import { registerSchema } from "../../../lib/validators/auth";
import { signToken } from "../../../lib/jwt";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // 1. Validate request body
  const body = registerSchema.parse(req.body);

  // 2. Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  // 3. Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(body.password, salt);

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  // 5. Generate token
  const token = signToken({ userId: user.id });

  return res.status(201).json({
    message: "Registration successful",
    token,
    user,
  });
}

export default apiHandler(handler);
