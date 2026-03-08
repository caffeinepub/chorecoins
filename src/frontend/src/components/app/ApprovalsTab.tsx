import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Clock, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  nanosToDate,
  useApproveCompletion,
  useGetAllChores,
  useGetChildren,
  useGetPendingCompletions,
  useRejectCompletion,
} from "../../hooks/useQueries";

export function ApprovalsTab() {
  const { data: pending, isLoading } = useGetPendingCompletions();
  const { data: allChores } = useGetAllChores();
  const { data: children } = useGetChildren();
  const approveCompletion = useApproveCompletion();
  const rejectCompletion = useRejectCompletion();

  const choreMap = new Map((allChores ?? []).map((c) => [c.id.toString(), c]));
  const childMap = new Map((children ?? []).map((c) => [c.id.toString(), c]));

  const handleApprove = async (
    completionId: bigint,
    childName: string,
    choreName: string,
  ) => {
    try {
      await approveCompletion.mutateAsync(completionId);
      toast.success(`✅ Approved "${choreName}" for ${childName}!`);
    } catch {
      toast.error("Couldn't approve completion.");
    }
  };

  const handleReject = async (
    completionId: bigint,
    childName: string,
    choreName: string,
  ) => {
    try {
      await rejectCompletion.mutateAsync(completionId);
      toast.info(`❌ Rejected "${choreName}" for ${childName}.`);
    } catch {
      toast.error("Couldn't reject completion.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!pending || pending.length === 0) {
    return (
      <div
        data-ocid="approvals.empty_state"
        className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-5xl mb-3"
        >
          🎉
        </motion.div>
        <p className="font-display font-semibold text-lg">All caught up!</p>
        <p className="text-muted-foreground text-sm mt-1">
          No pending chore completions to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-warning" />
        <span className="font-semibold text-sm text-muted-foreground">
          {pending.length} pending approval{pending.length !== 1 ? "s" : ""}
        </span>
      </div>
      <AnimatePresence>
        {pending.map((completion, index) => {
          const chore = choreMap.get(completion.choreId.toString());
          const child = childMap.get(completion.childId.toString());
          const submitted = nanosToDate(completion.submittedAt);
          const childName = child?.name ?? "Unknown child";
          const choreName = chore?.name ?? "Unknown chore";

          return (
            <motion.div
              key={completion.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl border-2 border-warning/30 shadow-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧹</span>
                    <span className="font-display font-bold text-foreground text-base">
                      {choreName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="text-base">👦</span>
                      <span className="font-semibold text-foreground">
                        {childName}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {submitted.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {chore && (
                      <span className="font-display font-bold text-success">
                        ${(Number(chore.amountCents) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    data-ocid={`parent.approval.reject_button.${index + 1}`}
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleReject(completion.id, childName, choreName)
                    }
                    disabled={rejectCompletion.isPending}
                    className="w-11 h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                    aria-label="Reject"
                  >
                    {rejectCompletion.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    data-ocid={`parent.approval.approve_button.${index + 1}`}
                    size="icon"
                    onClick={() =>
                      handleApprove(completion.id, childName, choreName)
                    }
                    disabled={approveCompletion.isPending}
                    className="w-11 h-11 rounded-xl bg-success text-success-foreground hover:bg-success/90 shadow-glow-success transition-all"
                    aria-label="Approve"
                  >
                    {approveCompletion.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
