import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChoreFrequency, ChoreStatus, TransactionType } from "../backend.d";
import {
  centsToUSD,
  frequencyLabel,
  nanosToDate,
  useGetChildCompletions,
  useGetChildInfo,
  useGetChildTransactions,
  useGetChoresForChild,
  useSubmitChoreCompletion,
} from "../hooks/useQueries";

interface ChildDashboardProps {
  childId: bigint;
  childName: string;
  onBack: () => void;
}

const CHILD_EMOJIS = [
  "🌟",
  "🦊",
  "🐬",
  "🦋",
  "🦄",
  "🐻",
  "🐸",
  "🦁",
  "🌈",
  "🎈",
];

function getChildEmoji(name: string): string {
  const idx = name.charCodeAt(0) % CHILD_EMOJIS.length;
  return CHILD_EMOJIS[idx];
}

function frequencyBadgeColor(f: ChoreFrequency): string {
  switch (f) {
    case ChoreFrequency.unlimitedDaily:
      return "bg-success/20 text-success border-success/30";
    case ChoreFrequency.oncePerDay:
      return "bg-primary/20 text-primary-foreground border-primary/30";
    case ChoreFrequency.oncePerWeek:
      return "bg-secondary text-secondary-foreground border-secondary/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function frequencyEmoji(f: ChoreFrequency): string {
  switch (f) {
    case ChoreFrequency.unlimitedDaily:
      return "♾️";
    case ChoreFrequency.oncePerDay:
      return "☀️";
    case ChoreFrequency.oncePerWeek:
      return "📅";
    default:
      return "❓";
  }
}

export function ChildDashboard({
  childId,
  childName,
  onBack,
}: ChildDashboardProps) {
  const { data: childInfo } = useGetChildInfo(childId);
  const { data: chores, isLoading: choresLoading } =
    useGetChoresForChild(childId);
  const { data: transactions } = useGetChildTransactions(childId);
  const { data: completions } = useGetChildCompletions(childId);
  const submitChore = useSubmitChoreCompletion();

  const balance = childInfo?.balanceCents ?? BigInt(0);
  const emoji = getChildEmoji(childName);

  // Pending completions (submitted but not yet approved)
  const pendingCompletionIds = new Set(
    (completions ?? [])
      .filter((c) => c.status === ChoreStatus.pending)
      .map((c) => c.choreId.toString()),
  );

  // Recent transactions (last 8)
  const recentTransactions = [...(transactions ?? [])]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 8);

  // Chores split: available vs unavailable
  const activeChores = (chores ?? []).filter((cwa) => cwa.chore.isActive);

  const handleDone = async (choreId: bigint, choreName: string) => {
    try {
      await submitChore.mutateAsync({ childId, choreId });
      toast.success(`"${choreName}" submitted! Waiting for parent approval 🎉`);
    } catch {
      toast.error("Couldn't submit chore. Try again!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30">
        <div
          className="px-4 py-4 flex items-center justify-between"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.72 0.2 28))",
          }}
        >
          <Button
            data-ocid="child.back_button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-foreground bg-white/25 hover:bg-white/40 rounded-xl backdrop-blur-sm"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <div className="text-3xl">{emoji}</div>
            <h1 className="font-display font-extrabold text-foreground text-xl leading-tight">
              {childName}
            </h1>
          </div>

          {/* Balance Display */}
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-2 text-right">
            <div className="text-xs font-semibold text-foreground/70">
              Balance
            </div>
            <motion.div
              key={balance.toString()}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="font-display font-extrabold text-foreground text-xl balance-glow"
              style={{ color: "oklch(0.18 0.04 260)" }}
            >
              {centsToUSD(balance)}
            </motion.div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-8">
        {/* Chores Section */}
        <section>
          <h2 className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
            🧹 My Chores
          </h2>

          {choresLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : activeChores.length === 0 ? (
            <div
              data-ocid="chores.empty_state"
              className="text-center py-10 bg-card rounded-2xl border-2 border-dashed border-border"
            >
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-display font-semibold text-lg">
                No chores right now!
              </p>
              <p className="text-muted-foreground text-sm">Enjoy the break!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeChores.map((cwa, index) => {
                const isPending = pendingCompletionIds.has(
                  cwa.chore.id.toString(),
                );
                return (
                  <motion.div
                    key={cwa.chore.id.toString()}
                    data-ocid={`child.chore_item.${index + 1}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className={`
                      rounded-2xl border-2 p-4 flex items-center justify-between gap-4
                      ${
                        isPending
                          ? "border-warning/40 bg-warning/10"
                          : cwa.canSubmit
                            ? "border-border bg-card shadow-card"
                            : "border-border/50 chore-card-unavailable"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-foreground text-base truncate">
                          {cwa.chore.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${frequencyBadgeColor(cwa.chore.frequency)}`}
                        >
                          {frequencyEmoji(cwa.chore.frequency)}{" "}
                          {frequencyLabel(cwa.chore.frequency)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-display font-extrabold text-success text-lg">
                          {centsToUSD(cwa.chore.amountCents)}
                        </span>
                        {isPending && (
                          <span className="text-xs text-warning font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Waiting for approval…
                          </span>
                        )}
                        {!cwa.canSubmit && !isPending && cwa.reason && (
                          <span className="text-xs text-muted-foreground">
                            {cwa.reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {isPending ? (
                      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warning/20 text-warning font-semibold text-sm">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    ) : cwa.canSubmit ? (
                      <motion.div whileTap={{ scale: 0.94 }}>
                        <Button
                          data-ocid={`child.chore_done_button.${index + 1}`}
                          onClick={() =>
                            handleDone(cwa.chore.id, cwa.chore.name)
                          }
                          disabled={submitChore.isPending}
                          className="shrink-0 h-14 px-6 rounded-2xl font-display font-extrabold text-lg shadow-glow-success transition-all"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.72 0.17 155), oklch(0.65 0.15 175))",
                            color: "white",
                          }}
                        >
                          Done! 🎉
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="shrink-0 px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-semibold">
                        Not yet
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Earnings */}
        {recentTransactions.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" /> Recent Earnings
            </h2>
            <div className="space-y-2">
              <AnimatePresence>
                {recentTransactions.map((tx, index) => {
                  const isCredit = tx.txType === TransactionType.credit;
                  const date = nanosToDate(tx.createdAt);
                  return (
                    <motion.div
                      key={tx.id.toString()}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between bg-card rounded-xl p-3 border border-border shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                            isCredit ? "bg-success/15" : "bg-destructive/15"
                          }`}
                        >
                          {isCredit ? "💰" : "😬"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground truncate max-w-[160px]">
                            {tx.note ||
                              (isCredit ? "Chore reward" : "Deduction")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-display font-extrabold text-base ${
                          isCredit ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {centsToUSD(tx.amountCents)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Completed today badge */}
        {completions &&
          completions.filter((c) => c.status === ChoreStatus.approved).length >
            0 && (
            <section className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="inline-flex items-center gap-2 bg-success/15 text-success px-5 py-2.5 rounded-full font-semibold text-sm border border-success/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                {
                  completions.filter((c) => c.status === ChoreStatus.approved)
                    .length
                }{" "}
                chore
                {completions.filter((c) => c.status === ChoreStatus.approved)
                  .length !== 1
                  ? "s"
                  : ""}{" "}
                approved! Keep it up!
              </motion.div>
            </section>
          )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
