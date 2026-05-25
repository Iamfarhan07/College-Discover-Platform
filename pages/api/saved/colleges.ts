import { NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { apiHandler, ApiError } from "../../../lib/apiHandler";
import { withAuth, AuthenticatedRequest } from "../../../middleware/auth";
import { saveCollegeSchema } from "../../../lib/validators/saved";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user.id;

  // Handle GET /api/saved/colleges
  if (req.method === "GET") {
    const savedColleges = await prisma.savedCollege.findMany({
      where: { userId },
      include: {
        college: {
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
        },
      },
      orderBy: { savedAt: "desc" },
    });

    // Map to return only the college details
    const result = savedColleges.map((sc) => sc.college);
    return res.status(200).json(result);
  }

  // Handle POST /api/saved/colleges
  if (req.method === "POST") {
    // 1. Validate the body
    const body = saveCollegeSchema.parse(req.body);
    const { collegeId } = body;

    // 2. Check if the college exists
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new ApiError(404, "College not found");
    }

    // 3. Check if already saved
    const existingSave = await prisma.savedCollege.findUnique({
      where: {
        userId_collegeId: {
          userId,
          collegeId,
        },
      },
    });

    if (existingSave) {
      throw new ApiError(409, "College is already saved");
    }

    // 4. Save the college
    const saved = await prisma.savedCollege.create({
      data: {
        userId,
        collegeId,
      },
      select: {
        id: true,
        userId: true,
        collegeId: true,
        savedAt: true,
      },
    });

    return res.status(201).json({
      message: "College saved successfully",
      saved,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  throw new ApiError(405, `Method ${req.method} Not Allowed`);
}

export default apiHandler(withAuth(handler));
