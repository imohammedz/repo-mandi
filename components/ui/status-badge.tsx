type Status =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SOLD"
  | "BANK_PENDING_REVIEW"
  | "SUBMITTED_TO_REPOMANDI";

const styles: Record<Status, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  SOLD: "bg-sky-50 text-sky-700",
  BANK_PENDING_REVIEW: "bg-indigo-50 text-indigo-700",
  SUBMITTED_TO_REPOMANDI: "bg-violet-50 text-violet-700",
};

const labels: Record<Status, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SOLD: "Sold",
  BANK_PENDING_REVIEW: "Bank Pending Review",
  SUBMITTED_TO_REPOMANDI: "Submitted to RepoMandi",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
