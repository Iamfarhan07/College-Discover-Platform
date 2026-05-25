import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  const idsStr = req.query.ids;
  if (!idsStr) {
    throw new ApiError(400, "Query parameter 'ids' is required");
  }

  // 1. Parse and validate IDs count (must be between 2 and 3)
  const idList = idsStr.toString().split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length < 2 || idList.length > 3) {
    throw new ApiError(400, "You must compare between 2 and 3 colleges");
  }

  // 2. Validate IDs format and check for duplicates
  const ids: number[] = [];
  const seenIds = new Set<number>();
  for (const idStr of idList) {
    const parsed = Number(idStr);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      throw new ApiError(400, `Invalid college ID format: "${idStr}"`);
    }
    if (seenIds.has(parsed)) {
      throw new ApiError(400, `Duplicate college ID: "${idStr}"`);
    }
    seenIds.add(parsed);
    ids.push(parsed);
  }

  // 3. Query the database for the colleges
  const colleges = await prisma.college.findMany({
    where: {
      id: { in: ids },
    },
    include: {
      placement: {
        select: {
          averagePackage: true,
        },
      },
      _count: {
        select: {
          courses: true,
        },
      },
    },
  });

  // 4. Ensure all requested colleges exist
  if (colleges.length !== ids.length) {
    throw new ApiError(400, "One or more college IDs were not found");
  }

  // 5. Build response keeping the requested order
  const collegeMap = new Map(colleges.map((c) => [c.id, c]));
  const result = ids.map((id) => {
    const college = collegeMap.get(id)!;
    return {
      id: college.id,
      name: college.name,
      location: college.location,
      fees: college.fees,
      rating: college.rating,
      placements: {
        averagePackage: college.placement?.averagePackage ?? 0,
      },
      courses: college._count.courses,
    };
  });

  return res.status(200).json(result);
}

export default apiHandler(handler);
