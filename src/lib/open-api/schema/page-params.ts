import { z } from "@hono/zod-openapi";

const PageParamsSchema = z.object({
  page: z.coerce.number().openapi({
    param: {
      name: "page",
      in: "query",
      required: true,
    },
    required: ["page"],
    example: 1,
  }),
  limit: z.coerce.number().openapi({
    param: {
      name: "limit",
      in: "query",
      required: true,
    },
    required: ["limit"],
    example: 10,
  }),
  search: z.string().openapi({
    param: {
      name: "search",
      in: "query",
      required: true,
    },
    required: ["search"],
    example: "search term",
  }),
});

export default PageParamsSchema;
