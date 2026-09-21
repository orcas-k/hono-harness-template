import { createRoute, z } from "@hono/zod-openapi";
import { insertUsersSchema, patchUsersSchema, selectUsersSchema } from "@/db/schema/system/index";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import * as HttpStatusPhrases from "@/lib/http-status-phrases";
import { jsonContent, jsonContentRequired } from "@/lib/open-api/helpers";
import { createErrorSchema, createMessageObjectSchema, IdUUIDParamsSchema } from "@/lib/open-api/schema";
import requirePermission from "@/middlewares/authenticate";
import authMiddleware from "@/middlewares/authorize";

const tags = ["user"];

export const list = createRoute({
  path: "/users",
  method: "get",
  tags: tags,
  middleware: [authMiddleware, requirePermission("users", "read")],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(selectUsersSchema), "The list of users"),
  },
});

export const create = createRoute({
  path: "/users",
  method: "post",
  tags: tags,
  middleware: [authMiddleware],
  request: {
    body: jsonContentRequired(insertUsersSchema, "The user data to create"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectUsersSchema, "The created user"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Unauthorized access",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(insertUsersSchema), "Validation error(s)"),
  },
});

export const getOne = createRoute({
  path: "/users/{id}",
  method: "get",
  tags: tags,
  middleware: [authMiddleware],
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectUsersSchema, "The user details"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.NOT_FOUND),
      "The user was not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Unauthorized access",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(IdUUIDParamsSchema), "Validation error(s)"),
  },
});

export const patch = createRoute({
  path: "/users/{id}",
  method: "patch",
  tags: tags,
  middleware: [authMiddleware],
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(patchUsersSchema, "The user data to update"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectUsersSchema, "The updated user details"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.NOT_FOUND),
      "The user was not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Unauthorized access",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchUsersSchema).or(createErrorSchema(IdUUIDParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const remove = createRoute({
  path: "/users/{id}",
  method: "delete",
  tags: tags,
  middleware: [authMiddleware],
  request: {
    params: IdUUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "The user was successfully deleted" },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.NOT_FOUND),
      "The user was not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Unauthorized access",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(createErrorSchema(IdUUIDParamsSchema), "Validation error(s)"),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
