import { NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { apiHandler, ApiError } from "../../../../lib/apiHandler";
import { withAuth, AuthenticatedRequest } from "../../../../middleware/auth";
import { collegeIdSchema } from "../../../../lib/validators/college";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  const userId = req.user.id;

  // 1. Validate path parameters
  const { id: collegeId } = collegeIdSchema.parse({ id: req.query.collegeId });

  // 2. Check if the saved item exists
  const existingSave = await prisma.savedCollege.findUnique({
    where: {
      userId_collegeId: {
        userId,
        collegeId,
      },
    },
  });

  if (!existingSave) {
    throw new ApiError(404, "College not found in saved list");
  }

  // 3. Delete the saved item
  await prisma.savedCollege.delete({
    where: {
      id: existingSave.id,
    },
  });

  return res.status(200).json({
    message: "College removed from saved list successfully",
  });
}

export default apiHandler(withAuth(handler));
