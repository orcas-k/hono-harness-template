import { snakeCase, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { baseColumns } from "@/db/schema/_shard/base-columns";
import type { StatusType } from "@/lib/enums";
import { Status } from "@/lib/enums";

export const permissions = snakeCase.table("permissions", {
  ...baseColumns,
  name: varchar({ length: 64 }).notNull(),
  code: varchar({ length: 100 }).notNull().unique(),
  resource: varchar({ length: 64 }).notNull(),
  action: varchar({ length: 64 }).notNull(),
  description: text(),
  status: varchar({ length: 16 }).$type<StatusType>().default(Status.ENABLED).notNull(),
});

export const selectPermissionsSchema = createSelectSchema(permissions, {
  id: (schema) => schema.meta({ description: "权限ID" }),
  name: (schema) => schema.meta({ description: "权限名称" }),
  code: (schema) => schema.meta({ description: "权限编码" }),
  resource: (schema) => schema.meta({ description: "资源名称" }),
  action: (schema) => schema.meta({ description: "操作名称" }),
  description: (schema) => schema.meta({ description: "权限描述" }),
  status: z.enum([Status.ENABLED, Status.DISABLED]).meta({ description: "状态 (ENABLED=启用, DISABLED=禁用)" }),
});

export const insertPermissionsSchema = createInsertSchema(permissions, {
  id: (schema) => schema.min(1).regex(/^[a-z0-9_]+$/),
  name: (schema) => schema.min(1),
  code: (schema) => schema.min(1).regex(/^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/),
  resource: (schema) => schema.min(1),
  action: (schema) => schema.min(1),
  status: z.enum([Status.ENABLED, Status.DISABLED]),
}).omit({
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
