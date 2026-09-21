import { and, eq } from "drizzle-orm";
import { hash } from "node-argon2";
import db from "./index";
import { permissions, rolePermissions, roles, userRoles, users } from "./schema/system/index";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_EMAIL = "admin@edi.local";

const ALL_RESOURCES = ["users", "roles", "permissions", "ldap"];
const ALL_ACTIONS = ["read", "create", "update", "delete"];

async function seed() {
  console.log("Starting database seed...");

  // 1. Create permissions for all resources/actions
  console.log("Creating permissions...");
  const permIds: Record<string, string> = {};
  for (const resource of ALL_RESOURCES) {
    for (const action of ALL_ACTIONS) {
      const name = `${resource}_${action}`;
      const code = `${resource}:${action}`;
      const [row] = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, name))
        .limit(1);
      if (row) {
        permIds[name] = row.id;
      } else {
        const [inserted] = await db
          .insert(permissions)
          .values({
            name,
            code,
            resource,
            action,
            status: "ENABLED",
            createdBy: "BuildIn",
            updatedBy: "BuildIn",
          })
          .returning({ id: permissions.id });
        permIds[name] = inserted!.id;
      }
    }
  }
  console.log(`  ${Object.keys(permIds).length} permissions ready`);

  // 2. Create Super Admin role
  console.log("Creating Super Admin role...");
  let [superAdminRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, "Super Admin")).limit(1);
  if (!superAdminRole) {
    [superAdminRole] = await db
      .insert(roles)
      .values({
        name: "Super Admin",
        code: "admin",
        description: "Super Admin role",
        status: "ENABLED",
        createdBy: "BuildIn",
        updatedBy: "BuildIn",
      })
      .returning({ id: roles.id });
  }
  console.log(`  Super Admin role ready`);

  // 3. Assign all permissions to Super Admin role
  console.log("Assigning permissions to Super Admin...");
  let assignedCount = 0;
  for (const permId of Object.values(permIds)) {
    const [existing] = await db
      .select({ roleId: rolePermissions.roleId })
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, superAdminRole!.id), eq(rolePermissions.permissionId, permId)))
      .limit(1);
    if (!existing) {
      await db.insert(rolePermissions).values({ roleId: superAdminRole!.id, permissionId: permId });
      assignedCount++;
    }
  }
  console.log(`  ${assignedCount} new permissions assigned`);

  // 4. Create admin user
  console.log("Creating admin user...");
  let [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.username, ADMIN_USERNAME)).limit(1);
  if (!adminUser) {
    const passwordHash = await hash(ADMIN_PASSWORD);
    [adminUser] = await db
      .insert(users)
      .values({
        username: ADMIN_USERNAME,
        password: passwordHash,
        accountType: "LOCAL",
        email: ADMIN_EMAIL,
        displayName: "System Admin",
        isActive: true,
        status: "ENABLED",
        createdBy: "BuildIn",
        updatedBy: "BuildIn",
      })
      .returning({ id: users.id });
    console.log(`  Admin user created: ${ADMIN_USERNAME}`);
  } else {
    console.log(`  Admin user already exists: ${ADMIN_USERNAME}`);
  }

  // 5. Assign Super Admin role to admin user
  const [existingAssignment] = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(and(eq(userRoles.userId, adminUser!.id), eq(userRoles.roleId, superAdminRole!.id)))
    .limit(1);
  if (!existingAssignment) {
    await db.insert(userRoles).values({ userId: adminUser!.id, roleId: superAdminRole!.id });
    console.log("  Super Admin role assigned to admin");
  } else {
    console.log("  Admin already has Super Admin role");
  }

  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
