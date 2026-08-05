import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const toolStatusEnum = pgEnum("tool_status", ["IN", "OUT"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: varchar("employee_id", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    specialization: varchar("specialization", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customers_employee_id_idx").on(table.employeeId)],
);

export const tools = pgTable(
  "tools",
  {
    localId: varchar("local_id", { length: 100 }).primaryKey(),
    seq: integer("seq"),
    nsn: varchar("nsn", { length: 100 }),
    partNumber: varchar("part_number", { length: 100 }).notNull(),
    serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
    nomenclature: text("nomenclature"),
    commonName: text("common_name"),
    authqty: integer("authqty").notNull().default(1),
    assignedqty: integer("assignedqty").notNull().default(0),
    location: varchar("location", { length: 255 }),
    subLocation: varchar("sub_location", { length: 255 }),
    inventoryDate: date("inventory_date"),
    status: toolStatusEnum("status").notNull().default("IN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tools_serial_number_idx").on(table.serialNumber),
    index("tools_part_number_idx").on(table.partNumber),
    index("tools_nsn_idx").on(table.nsn),
    index("tools_status_idx").on(table.status),
  ],
);

export const checkoutLogs = pgTable(
  "checkout_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toolLocalId: varchar("tool_local_id", { length: 100 })
      .notNull()
      .references(() => tools.localId),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    checkedOutBy: uuid("checked_out_by")
      .notNull()
      .references(() => users.id),
    checkedInBy: uuid("checked_in_by").references(() => users.id),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }).notNull().defaultNow(),
    expectedReturnAt: date("expected_return_at").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("checkout_logs_tool_local_id_idx").on(table.toolLocalId),
    index("checkout_logs_checked_in_at_idx").on(table.checkedInAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  checkoutsPerformed: many(checkoutLogs, { relationName: "checkedOutBy" }),
  checkinsPerformed: many(checkoutLogs, { relationName: "checkedInBy" }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  checkoutLogs: many(checkoutLogs),
}));

export const toolsRelations = relations(tools, ({ many }) => ({
  checkoutLogs: many(checkoutLogs),
}));

export const checkoutLogsRelations = relations(checkoutLogs, ({ one }) => ({
  tool: one(tools, {
    fields: [checkoutLogs.toolLocalId],
    references: [tools.localId],
  }),
  customer: one(customers, {
    fields: [checkoutLogs.customerId],
    references: [customers.id],
  }),
  checkedOutByUser: one(users, {
    fields: [checkoutLogs.checkedOutBy],
    references: [users.id],
    relationName: "checkedOutBy",
  }),
  checkedInByUser: one(users, {
    fields: [checkoutLogs.checkedInBy],
    references: [users.id],
    relationName: "checkedInBy",
  }),
}));

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type CheckoutLog = typeof checkoutLogs.$inferSelect;
