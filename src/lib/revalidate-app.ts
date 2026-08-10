import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateCheckoutData() {
  revalidateTag("dashboard-stats");
  revalidateTag("overdue-reminder");
  revalidatePath("/operations");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/tools-by-customer");
  revalidatePath("/admin/tools");
}

export function revalidateToolData() {
  revalidateTag("dashboard-stats");
  revalidatePath("/admin/tools");
  revalidatePath("/operations");
}

export function revalidateCustomerData() {
  revalidatePath("/admin/customers");
  revalidatePath("/tools-by-customer");
  revalidatePath("/operations");
}

export function revalidateHistoryData() {
  revalidateTag("dashboard-stats");
  revalidateTag("overdue-reminder");
  revalidatePath("/history");
  revalidatePath("/operations");
  revalidatePath("/dashboard");
  revalidatePath("/admin/tools");
  revalidatePath("/tools-by-customer");
}
