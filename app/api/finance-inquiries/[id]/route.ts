import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { financeInquiries } from "@/lib/schema";

type FinanceInquiryStatus = "NEW" | "CONTACTED" | "CLOSED" | "REJECTED";

const VALID_STATUSES: FinanceInquiryStatus[] = ["NEW", "CONTACTED", "CLOSED", "REJECTED"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  if (current.user.accountType !== "ADMIN") return Response.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await context.params;
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return Response.json({ message: "Invalid inquiry id." }, { status: 400 });
  }

  const body = (await request.json()) as { status?: FinanceInquiryStatus };
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json({ message: "Invalid status." }, { status: 400 });
  }

  const [updated] = await db
    .update(financeInquiries)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(financeInquiries.id, parsedId))
    .returning();

  if (!updated) return Response.json({ message: "Inquiry not found." }, { status: 404 });
  return Response.json(updated);
}
