import { index, primaryKey, snakeCase, uuid } from "drizzle-orm/pg-core";

import { permissions } from "./permissions";
import { roles } from "./roles";

export const rolePermissions = snakeCase.table(
  "role_permissions",
  {
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("idx_role_permissions_role_id").on(table.roleId),
    index("idx_role_permissions_permission_id").on(table.permissionId),
  ],
);
