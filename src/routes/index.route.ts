import { createRoute } from "@hono/zod-openapi";
import { createRouter } from "@/lib/create-app";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import { jsonContent } from "@/lib/open-api/helpers";
import { createMessageObjectSchema } from "@/lib/open-api/schema";

const router = createRouter().openapi(
  createRoute({
    tags: ["Index"],
    method: "get",
    path: "/",
    responses: {
      [HttpStatusCodes.OK]: jsonContent(createMessageObjectSchema("Hono Harness API"), "Hono API Index"),
    },
  }),
  (c) => {
    return c.json(
      {
        message: "Hono Harness API",
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
