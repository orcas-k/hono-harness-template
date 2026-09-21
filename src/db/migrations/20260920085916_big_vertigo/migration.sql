CREATE TYPE "account_type" AS ENUM('LOCAL', 'LDAP');--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"created_at" timestamp(0),
	"created_by" varchar(64),
	"updated_at" timestamp(0),
	"updated_by" varchar(64),
	"name" varchar(64) NOT NULL,
	"code" varchar(100) NOT NULL UNIQUE,
	"resource" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"description" text,
	"status" varchar(16) DEFAULT 'ENABLED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid,
	"permission_id" uuid,
	CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"created_at" timestamp(0),
	"created_by" varchar(64),
	"updated_at" timestamp(0),
	"updated_by" varchar(64),
	"name" varchar(64) NOT NULL,
	"code" varchar(64) NOT NULL UNIQUE,
	"description" text,
	"status" varchar(16) DEFAULT 'ENABLED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid,
	"role_id" uuid,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"created_at" timestamp(0),
	"created_by" varchar(64),
	"updated_at" timestamp(0),
	"updated_by" varchar(64),
	"username" varchar(64) NOT NULL UNIQUE,
	"password" text NOT NULL,
	"ldap_dn" varchar(500),
	"account_type" "account_type" DEFAULT 'LOCAL'::"account_type" NOT NULL,
	"email" varchar(255),
	"display_name" varchar(200),
	"is_active" boolean DEFAULT true NOT NULL,
	"status" varchar(16) DEFAULT 'ENABLED' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" ("role_id");--> statement-breakpoint
CREATE INDEX "system_user_username_idx" ON "users" ("username");--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;