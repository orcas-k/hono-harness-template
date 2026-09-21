import { boolean, index, pgEnum, snakeCase, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { baseColumns } from "@/db/schema/_shard/base-columns";
import type { StatusType } from "@/lib/enums";
import { Status } from "@/lib/enums";
import { passwordField, StatusDescriptions, usernameField } from "@/lib/schemas";

export const accountTypeEnum = pgEnum("account_type", ["LOCAL", "LDAP"]);

export const users = snakeCase.table(
  "users",
  {
    ...baseColumns,
    username: varchar({ length: 64 }).notNull().unique(),
    password: text().notNull(),
    ldapDn: varchar("ldap_dn", { length: 500 }),
    accountType: accountTypeEnum("account_type").notNull().default("LOCAL"),
    email: varchar("email", { length: 255 }),
    displayName: varchar("display_name", { length: 200 }),
    isActive: boolean("is_active").notNull().default(true),
    status: varchar({ length: 16 }).$type<StatusType>().default(Status.ENABLED).notNull(),
  },
  (table) => [index("system_user_username_idx").on(table.username)],
);

export const selectUsersSchema = createSelectSchema(users, {
  id: (schema) => schema.meta({ description: "用户ID" }),
  username: (schema) => schema.meta({ description: "用户名" }),
  password: (schema) => schema.meta({ description: "密码" }),
  email: (schema) => schema.meta({ description: "邮箱" }),
  displayName: (schema) => schema.meta({ description: "显示名称" }),
  isActive: (schema) => schema.meta({ description: "是否激活" }),
  accountType: (schema) => schema.meta({ description: "账户类型" }),
  ldapDn: (schema) => schema.meta({ description: "LDAP DN" }),
  status: z.enum([Status.ENABLED, Status.DISABLED]).meta({ description: StatusDescriptions.SYSTEM }),
});

export const insertUsersSchema = createInsertSchema(users, {
  username: () => usernameField,
  password: () => passwordField,
  status: z.enum([Status.ENABLED, Status.DISABLED]),
}).omit({
  id: true,
  email: true,
  displayName: true,
  isActive: true,
  accountType: true,
  ldapDn: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export const patchUsersSchema = createUpdateSchema(users, {
  username: () => usernameField,
  password: () => passwordField,
  status: z.enum([Status.ENABLED, Status.DISABLED]).optional(),
});
