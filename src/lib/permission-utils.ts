import { and, eq } from "drizzle-orm";
import db from "@/db";
import { permissions, rolePermissions, roles, userRoles, users } from "@/db/schema/system";

export const checkPermission = async (userId: string, resource: string, permission: string) => {
  const matchedPermissions = await db
    .select({ id: permissions.id })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(users.id, userId),
        eq(users.isActive, true),
        eq(users.status, "ENABLED"),
        eq(roles.status, "ENABLED"),
        eq(permissions.status, "ENABLED"),
        eq(permissions.code, `${resource}:${permission}`),
      ),
    )
    .limit(1);

  return matchedPermissions.length > 0;
};
