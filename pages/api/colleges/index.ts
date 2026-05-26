import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";
import { listCollegesSchema } from "../../../lib/validators/college";
import { Prisma } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // 1. Validate query parameters
  const query = listCollegesSchema.parse(req.query);

  const { search, location, minFees, maxFees, minRating, sortBy, page, limit } = query;

  // 2. Build where filter conditions
  const where: Prisma.CollegeWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (minFees !== undefined || maxFees !== undefined) {
    where.fees = {
      ...(minFees !== undefined ? { gte: minFees } : {}),
      ...(maxFees !== undefined ? { lte: maxFees } : {}),
    };
  }

  if (minRating !== undefined) {
    where.rating = { gte: minRating };
  }

  // 3. Build sorting rules
  let orderBy: Prisma.CollegeOrderByWithRelationInput = { id: "asc" };

  if (sortBy) {
    switch (sortBy) {
      case "fees_asc":
        orderBy = { fees: "asc" };
        break;
      case "fees_desc":
        orderBy = { fees: "desc" };
        break;
      case "rating_desc":
        orderBy = { rating: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
    }
  }

  // 4. Run queries in a transaction or concurrently (Prisma client has concurrent capabilities)
  const skip = (page - 1) * limit;
  const take = limit;

  const [total, colleges] = await prisma.$transaction([
    prisma.college.count({ where }),
    prisma.college.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        location: true,
        fees: true,
        rating: true,
        type: true,
        established: true,
        imageUrl: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    data: colleges,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  });
}

export default apiHandler(handler);
