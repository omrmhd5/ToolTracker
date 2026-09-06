import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { checkoutLogs, customers, tools, users } from "./schema";

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ??
  "postgresql://tooltracker:tooltracker@localhost:5433/tooltracker";

function resolveSeedUrl() {
  if (process.env.LOCAL_DEMO_SEED === "1") {
    return LOCAL_URL;
  }
  return process.env.DATABASE_URL ?? LOCAL_URL;
}

function daysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

if (process.argv.includes("--local")) {
  process.env.LOCAL_DEMO_SEED = "1";
}

async function seedDemo() {
  const connectionString = resolveSeedUrl();
  const forcedLocal = process.env.LOCAL_DEMO_SEED === "1";
  const needsSsl = /neon\.tech|sslmode=require/i.test(connectionString);
  console.log(
    `Demo seed: ${forcedLocal ? "forced local" : "DATABASE_URL or local"} (${connectionString.replace(/:[^:@/]+@/, ":***@")})`,
  );

  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    ...(needsSsl ? { ssl: "require" as const } : {}),
  });
  const db = drizzle(client);

  await db.delete(checkoutLogs);
  await db.delete(tools);
  await db.delete(customers);
  await db.delete(users);

  const adminHash = await bcrypt.hash("admin123", 12);
  const userHash = await bcrypt.hash("user123", 12);

  const [admin, tech] = await db
    .insert(users)
    .values([
      {
        email: "admin@admin.com",
        passwordHash: adminHash,
        name: "Demo Admin",
        role: "admin",
        isActive: true,
      },
      {
        email: "user@user.com",
        passwordHash: userHash,
        name: "Demo Technician",
        role: "user",
        isActive: true,
      },
    ])
    .returning();

  const customerRows = await db
    .insert(customers)
    .values([
      { employeeId: "EMP-01", name: "Sara Nabil", specialization: "Avionics" },
      { employeeId: "EMP-02", name: "Omar Farid", specialization: "Airframe" },
      { employeeId: "EMP-03", name: "Layla Hassan", specialization: "Engines" },
      { employeeId: "EMP-04", name: "Youssef Adel", specialization: "Ground support" },
      { employeeId: "EMP-05", name: "Nour Saleh", specialization: "Electrical" },
      { employeeId: "EMP-06", name: "Karim Mostafa", specialization: "Hydraulics" },
      { employeeId: "EMP-07", name: "Hana Mahmoud", specialization: "Quality" },
      { employeeId: "EMP-08", name: "Tarek Samir", specialization: "Stores" },
    ])
    .returning();

  const byEmp = Object.fromEntries(
    customerRows.map((row) => [row.employeeId, row.id]),
  );

  const toolDefs = [
    { localId: "TT-001", partNumber: "WR-14", serialNumber: "SN-1001", commonName: "Torque wrench 1/2\"", status: "OUT" as const },
    { localId: "TT-002", partNumber: "DR-18", serialNumber: "SN-1002", commonName: "Cordless drill", status: "OUT" as const },
    { localId: "TT-003", partNumber: "MX-02", serialNumber: "SN-1003", commonName: "Multimeter", status: "OUT" as const },
    { localId: "TT-004", partNumber: "CL-40", serialNumber: "SN-1004", commonName: "Cable tensiometer", status: "OUT" as const },
    { localId: "TT-005", partNumber: "HM-09", serialNumber: "SN-1005", commonName: "Rubber mallet", status: "OUT" as const },
    { localId: "TT-006", partNumber: "PL-22", serialNumber: "SN-1006", commonName: "Needle-nose pliers", status: "IN" as const },
    { localId: "TT-007", partNumber: "HX-10", serialNumber: "SN-1007", commonName: "Hex key set", status: "IN" as const },
    { localId: "TT-008", partNumber: "CP-7", serialNumber: "SN-1008", commonName: "Crimping tool", status: "IN" as const },
    { localId: "TT-009", partNumber: "IN-3", serialNumber: "SN-1009", commonName: "Inspection mirror", status: "IN" as const },
    { localId: "TT-010", partNumber: "TB-1", serialNumber: "SN-1010", commonName: "Tool bag", status: "IN" as const },
    { localId: "TT-011", partNumber: "SC-4", serialNumber: "SN-1011", commonName: "Screwdriver set", status: "IN" as const },
    { localId: "TT-012", partNumber: "CT-12", serialNumber: "SN-1012", commonName: "Caliper", status: "IN" as const },
    { localId: "TT-013", partNumber: "LS-5", serialNumber: "SN-1013", commonName: "Lockwire pliers", status: "IN" as const },
    { localId: "TT-014", partNumber: "FT-8", serialNumber: "SN-1014", commonName: "Feeler gauge", status: "IN" as const },
    { localId: "TT-015", partNumber: "BP-2", serialNumber: "SN-1015", commonName: "Bleed pump", status: "IN" as const },
    { localId: "TT-016", partNumber: "LT-1", serialNumber: "SN-1016", commonName: "Work light", status: "IN" as const },
  ];

  await db.insert(tools).values(
    toolDefs.map((tool, index) => ({
      localId: tool.localId,
      seq: index + 1,
      partNumber: tool.partNumber,
      serialNumber: tool.serialNumber,
      commonName: tool.commonName,
      nomenclature: tool.commonName,
      authqty: 1,
      assignedqty: tool.status === "OUT" ? 1 : 0,
      location: "Hangar A",
      subLocation: `Bay ${Math.floor(index / 4) + 1}`,
      inventoryDate: daysFromToday(-30),
      status: tool.status,
    })),
  );

  await db.insert(checkoutLogs).values([
    {
      toolLocalId: "TT-001",
      customerId: byEmp["EMP-01"],
      checkedOutBy: tech.id,
      expectedReturnAt: daysFromToday(-5),
      notes: "Avionics bay daily kit",
    },
    {
      toolLocalId: "TT-002",
      customerId: byEmp["EMP-02"],
      checkedOutBy: admin.id,
      expectedReturnAt: daysFromToday(-2),
      notes: "Airframe panel work",
    },
    {
      toolLocalId: "TT-003",
      customerId: byEmp["EMP-03"],
      checkedOutBy: tech.id,
      expectedReturnAt: daysFromToday(-1),
    },
    {
      toolLocalId: "TT-004",
      customerId: byEmp["EMP-05"],
      checkedOutBy: tech.id,
      expectedReturnAt: daysFromToday(2),
    },
    {
      toolLocalId: "TT-005",
      customerId: byEmp["EMP-06"],
      checkedOutBy: admin.id,
      expectedReturnAt: daysFromToday(6),
    },
    {
      toolLocalId: "TT-011",
      customerId: byEmp["EMP-04"],
      checkedOutBy: tech.id,
      checkedInBy: admin.id,
      expectedReturnAt: daysFromToday(-10),
      checkedInAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: "Returned after line check",
    },
    {
      toolLocalId: "TT-012",
      customerId: byEmp["EMP-07"],
      checkedOutBy: admin.id,
      checkedInBy: tech.id,
      expectedReturnAt: daysFromToday(-8),
      checkedInAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  await client.end();
  console.log("Demo seed complete. Admin: admin@admin.com / admin123 · User: user@user.com / user123");
}

seedDemo().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
