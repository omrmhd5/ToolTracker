CREATE TYPE "public"."tool_status" AS ENUM('IN', 'OUT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "checkout_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_local_id" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"checked_out_by" uuid NOT NULL,
	"checked_in_by" uuid,
	"checked_out_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_return_at" date NOT NULL,
	"checked_in_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"specialization" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"local_id" varchar(100) PRIMARY KEY NOT NULL,
	"seq" integer,
	"nsn" varchar(100),
	"part_number" varchar(100) NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"nomenclature" text,
	"common_name" text,
	"authqty" integer DEFAULT 1 NOT NULL,
	"assignedqty" integer DEFAULT 0 NOT NULL,
	"location" varchar(255),
	"sub_location" varchar(255),
	"inventory_date" date,
	"status" "tool_status" DEFAULT 'IN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tools_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkout_logs" ADD CONSTRAINT "checkout_logs_tool_local_id_tools_local_id_fk" FOREIGN KEY ("tool_local_id") REFERENCES "public"."tools"("local_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_logs" ADD CONSTRAINT "checkout_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_logs" ADD CONSTRAINT "checkout_logs_checked_out_by_users_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_logs" ADD CONSTRAINT "checkout_logs_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_logs_tool_local_id_idx" ON "checkout_logs" USING btree ("tool_local_id");--> statement-breakpoint
CREATE INDEX "checkout_logs_checked_in_at_idx" ON "checkout_logs" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "customers_employee_id_idx" ON "customers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "tools_serial_number_idx" ON "tools" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "tools_part_number_idx" ON "tools" USING btree ("part_number");--> statement-breakpoint
CREATE INDEX "tools_nsn_idx" ON "tools" USING btree ("nsn");--> statement-breakpoint
CREATE INDEX "tools_status_idx" ON "tools" USING btree ("status");