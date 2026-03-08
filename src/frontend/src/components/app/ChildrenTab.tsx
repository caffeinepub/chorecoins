import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  centsToUSD,
  useAddChild,
  useGetChildren,
  useRemoveChild,
} from "../../hooks/useQueries";

const CHILD_COLORS = [
  "from-yellow-300 to-orange-300",
  "from-pink-300 to-rose-300",
  "from-cyan-300 to-blue-300",
  "from-green-300 to-emerald-300",
  "from-purple-300 to-violet-300",
  "from-amber-300 to-yellow-300",
];
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

function getColor(i: number) {
  return CHILD_COLORS[i % CHILD_COLORS.length];
}
function getEmoji(i: number) {
  return CHILD_EMOJIS[i % CHILD_EMOJIS.length];
}

interface ChildrenTabProps {
  onViewChild: (childId: bigint, childName: string) => void;
}

export function ChildrenTab({ onViewChild }: ChildrenTabProps) {
  const { data: children, isLoading } = useGetChildren();
  const addChild = useAddChild();
  const removeChild = useRemoveChild();
  const [newName, setNewName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await addChild.mutateAsync(trimmed);
      setNewName("");
      toast.success(`${trimmed} added! 🎉`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unauthorized") || msg.includes("Admin")) {
        toast.error(
          "Not authorized. Please close the app and reopen it from your Caffeine dashboard to restore your admin session.",
          { duration: 8000 },
        );
      } else {
        toast.error("Couldn't add child. Try again.");
      }
    }
  };

  const handleRemove = async (childId: bigint, name: string) => {
    try {
      await removeChild.mutateAsync(childId);
      toast.success(`${name} removed.`);
    } catch {
      toast.error("Couldn't remove child.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add Child Form */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add a Child
        </h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <Input
            data-ocid="parent.add_child.input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Child's name…"
            className="flex-1 rounded-xl h-11 text-base"
            maxLength={50}
          />
          <Button
            data-ocid="parent.add_child.submit_button"
            type="submit"
            disabled={addChild.isPending || !newName.trim()}
            className="h-11 px-5 rounded-xl font-display font-bold"
          >
            {addChild.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </form>
      </div>

      {/* Children List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : children && children.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {children.map((child, index) => (
              <motion.div
                key={child.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border shadow-card flex items-center gap-4 p-4 group hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColor(index)} flex items-center justify-center text-2xl shadow-sm shrink-0`}
                >
                  {getEmoji(index)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-lg truncate">
                    {child.name}
                  </p>
                  <p className="text-success font-display font-extrabold text-lg">
                    {centsToUSD(child.balanceCents)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChild(child.id, child.name)}
                    className="rounded-xl gap-1.5 font-semibold hover:bg-primary/10"
                  >
                    Details
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-ocid={`parent.children.delete_button.${index + 1}`}
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">
                          Remove {child.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {child.name} and all
                          their data. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="parent.children.confirm_button"
                          onClick={() => handleRemove(child.id, child.name)}
                          className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div
          data-ocid="parent.children.empty_state"
          className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-border"
        >
          <p className="text-4xl mb-3">👶</p>
          <p className="font-display font-semibold text-lg">No children yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first child above!
          </p>
        </div>
      )}
    </div>
  );
}
