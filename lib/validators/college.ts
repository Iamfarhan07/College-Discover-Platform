import { z } from "zod";

export const listCollegesSchema = z.object({
  search: z.string().trim().min(2, "Search query must be at least 2 characters").optional(),
  location: z.string().trim().optional(),
  minFees: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number({ message: "minFees must be a number" }).nonnegative("minFees must be non-negative").optional()
  ),
  maxFees: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number({ message: "maxFees must be a number" }).nonnegative("maxFees must be non-negative").optional()
  ),
  minRating: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number({ message: "minRating must be a number" }).min(0, "minRating must be at least 0").max(5, "minRating must be at most 5").optional()
  ),
  sortBy: z.enum(["fees_asc", "fees_desc", "rating_desc", "name_asc"]).optional(),
  page: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int("page must be an integer").positive("page must be positive").default(1)
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int("limit must be an integer").positive("limit must be positive").max(50, "limit cannot exceed 50").default(10)
  ),
});

export const collegeIdSchema = z.object({
  id: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int("ID must be an integer").positive("ID must be positive")
  ),
});

export const reviewsPaginationSchema = z.object({
  reviewPage: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int("reviewPage must be an integer").positive("reviewPage must be positive").default(1)
  ),
  reviewLimit: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int("reviewLimit must be an integer").positive("reviewLimit must be positive").default(5)
  ),
});
