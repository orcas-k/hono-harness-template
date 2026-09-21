import { defineRelations } from "drizzle-orm";
import * as schema from "./system/index";

export const relations = defineRelations(schema, (r) => ({
  users: {
    roles: r.many.userRoles({
      from: r.users.id,
      to: r.userRoles.userId,
    }),
  },
  roles: {
    users: r.many.userRoles({
      from: r.roles.id,
      to: r.userRoles.roleId,
    }),
    permissions: r.many.rolePermissions({
      from: r.roles.id,
      to: r.rolePermissions.roleId,
    }),
  },
  permissions: {
    roles: r.many.rolePermissions({
      from: r.permissions.id,
      to: r.rolePermissions.permissionId,
    }),
  },
}));
