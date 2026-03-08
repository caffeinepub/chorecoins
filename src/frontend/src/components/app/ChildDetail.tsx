import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, TrendingDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "../../backend.d";
import {
  centsToUSD,
  dollarsToCents,
  nanosToDate,
  useDeductMoney,
  useGetChildInfo,
  useGetChildTransactions,
} from "../../hooks/useQueries";

interface ChildDetailProps {
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

export function ChildDetail({ childId, childName, onBack }: ChildDetailProps) {
  const { data: childInfo, isLoading: infoLoading } = useGetChildInfo(childId);
  const { data: transactions, isLoading: txLoading } =
    useGetChildTransactions(childId);
  const deductMoney = useDeductMoney();

  const [deductOpen, setDeductOpen] = useState(false);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");

  const balance = childInfo?.balanceCents ?? BigInt(0);
  const emoji = getChildEmoji(childName);

  const sortedTx = [...(transactions ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  const totalEarned = (transactions ?? [])
    .filter((t) => t.txType === TransactionType.credit)
    .reduce((sum, t) => sum + t.amountCents, BigInt(0));

  const totalDeducted = (transactions ?? [])
    .filter((t) => t.txType === TransactionType.deduction)
    .reduce((sum, t) => sum + t.amountCents, BigInt(0));

  const handleDeduct = async () => {
    const amount = Number.parseFloat(deductAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!deductReason.trim()) {
      toast.error("Please enter a reason for the deduction.");
      return;
    }
    try {
      await deductMoney.mutateAsync({
        childId,
        amountCents: dollarsToCents(deductAmount),
        note: deductReason.trim(),
      });
      setDeductOpen(false);
      setDeductAmount("");
      setDeductReason("");
      toast.success(`Deducted $${amount.toFixed(2)} from ${childName}.`);
    } catch {
      toast.error("Couldn't deduct money. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-display font-bold text-2xl">
          {childName}'s Account
        </h2>
      </div>

      {/* Balance Card */}
      {infoLoading ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.04 260), oklch(0.25 0.06 260))",
          }}
        >
          {/* Decorative blob */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, oklch(0.82 0.18 85), transparent)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="text-4xl mb-2">{emoji}</div>
              <p className="text-white/60 font-semibold text-sm">
                Current Balance
              </p>
              <motion.p
                key={balance.toString()}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-display font-extrabold text-4xl text-white mt-1 balance-glow"
              >
                {centsToUSD(balance)}
              </motion.p>
            </div>
            <Dialog open={deductOpen} onOpenChange={setDeductOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="parent.deduct.open_modal_button"
                  variant="outline"
                  className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2 font-semibold"
                >
                  <TrendingDown className="w-4 h-4" />
                  Deduct
                </Button>
              </DialogTrigger>
              <DialogContent
                data-ocid="parent.deduct.dialog"
                className="rounded-2xl"
              >
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Deduct Money from {childName}
                  </DialogTitle>
                  <DialogDescription>
                    Enter an amount and reason. This will reduce {childName}'s
                    balance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Amount ($)</Label>
                    <Input
                      data-ocid="parent.deduct.input"
                      value={deductAmount}
                      onChange={(e) => setDeductAmount(e.target.value)}
                      placeholder="e.g. 0.50"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Reason</Label>
                    <Textarea
                      value={deductReason}
                      onChange={(e) => setDeductReason(e.target.value)}
                      placeholder="e.g. Left room messy, argued with sibling…"
                      className="rounded-xl resize-none"
                      rows={3}
                      maxLength={200}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeductOpen(false)}
                    className="rounded-xl"
                    data-ocid="parent.deduct.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="parent.deduct.confirm_button"
                    onClick={handleDeduct}
                    disabled={
                      deductMoney.isPending ||
                      !deductAmount ||
                      !deductReason.trim()
                    }
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deductMoney.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-2" />
                    )}
                    Deduct
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-5 relative z-10">
            <div>
              <p className="text-white/50 text-xs font-semibold">
                Total Earned
              </p>
              <p className="font-display font-bold text-white/90 text-base">
                {centsToUSD(totalEarned)}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-semibold">
                Total Deducted
              </p>
              <p className="font-display font-bold text-white/90 text-base">
                -{centsToUSD(totalDeducted)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="font-display font-bold text-xl mb-4">
          Transaction History
        </h3>
        {txLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : sortedTx.length === 0 ? (
          <div
            data-ocid="parent.transactions.empty_state"
            className="text-center py-10 bg-card rounded-2xl border-2 border-dashed border-border"
          >
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold text-muted-foreground">
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {sortedTx.map((tx, index) => {
                const isCredit = tx.txType === TransactionType.credit;
                const date = nanosToDate(tx.createdAt);
                return (
                  <motion.div
                    key={tx.id.toString()}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between bg-card rounded-xl p-3.5 border border-border shadow-xs"
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
                        <p className="font-semibold text-sm text-foreground line-clamp-1 max-w-[180px]">
                          {tx.note || (isCredit ? "Chore reward" : "Deduction")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-display font-extrabold text-base shrink-0 ${
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
        )}
      </div>
    </div>
  );
}
