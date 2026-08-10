CREATE INDEX IF NOT EXISTS "tools_seq_idx" ON "tools" ("seq");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_logs_checked_out_at_idx" ON "checkout_logs" ("checked_out_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_logs_customer_id_idx" ON "checkout_logs" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_logs_tool_checked_out_at_idx" ON "checkout_logs" ("tool_local_id", "checked_out_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_logs_open_customer_idx" ON "checkout_logs" ("customer_id") WHERE "checked_in_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_logs_open_overdue_idx" ON "checkout_logs" ("expected_return_at") WHERE "checked_in_at" IS NULL;
