import { snakeCase, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { baseColumns } from "@/db/schema/_shard/base-columns";
import type { StatusType } from "@/lib/enums";
import { Status } from "@/lib/enums";

export const roles = snakeCase.table("roles", {
  ...baseColumns,
  name: varchar({ length: 64 }).notNull(),
  code: varchar({ length: 64 }).notNull().unique(),
  description: text(),
  status: varchar({ length: 16 }).$type<StatusType>().default(Status.ENABLED).notNull(),
});

export const selectRolesSchema = createSelectSchema(roles, {
  id: (schema) => schema.meta({ description: "角色ID" }),
  name: (schema) => schema.meta({ description: "角色名称" }),
  description: (schema) => schema.meta({ description: "角色描述" }),
  status: z.enum([Status.ENABLED, Status.DISABLED]).meta({ description: "状态 (ENABLED=启用, DISABLED=禁用)" }),
});

export const insertRolesSchema = createInsertSchema(roles, {
  id: (schema) => schema.min(1).regex(/^[a-z0-9_]+$/),
  name: (schema) => schema.min(1),
  status: z.enum([Status.ENABLED, Status.DISABLED]),
}).omit({
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
