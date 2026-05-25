import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";
import { collegeIdSchema, reviewsPaginationSchema } from "../../../lib/validators/college";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // 1. Validate the path parameter (ID)
  const { id: collegeId } = collegeIdSchema.parse({ id: req.query.id });

  // 2. Validate reviews pagination parameters
  const { reviewPage, reviewLimit } = reviewsPaginationSchema.parse(req.query);

  // 3. Fetch college details (courses + placement)
  const college = await prisma.college.findUnique({
    where: { id: collegeId },
    include: {
      courses: {
        select: {
          name: true,
          duration: true,
          fees: true,
        },
      },
      placement: {
        select: {
          averagePackage: true,
          highestPackage: true,
          topRecruiters: true,
        },
      },
    },
  });

  if (!college) {
    throw new ApiError(404, "College not found");
  }

  // 4. Fetch paginated reviews
  const reviews = await prisma.review.findMany({
    where: { collegeId },
    orderBy: { createdAt: "desc" },
    skip: (reviewPage - 1) * reviewLimit,
    take: reviewLimit,
    select: {
      userId: true,
      comment: true,
      rating: true,
      createdAt: true,
    },
  });

  // 5. Structure the response
  return res.status(200).json({
    id: college.id,
    name: college.name,
    location: college.location,
    fees: college.fees,
    rating: college.rating,
    type: college.type,
    established: college.established,
    overview: college.overview,
    imageUrl: college.imageUrl,
    courses: college.courses,
    placements: college.placement
      ? {
          averagePackage: college.placement.averagePackage,
          highestPackage: college.placement.highestPackage,
          topRecruiters: college.placement.topRecruiters,
        }
      : {
          averagePackage: 0,
          highestPackage: 0,
          topRecruiters: [],
        },
    reviews,
  });
}

export default apiHandler(handler);
