import { z } from "zod";

export const saveCollegeSchema = z.object({
  collegeId: z.number().int("collegeId must be an integer").positive("collegeId must be positive"),
});
