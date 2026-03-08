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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Chore, ChoreFrequency } from "../../backend.d";
import {
  centsToUSD,
  dollarsToCents,
  frequencyLabel,
  useAddChore,
  useGetAllChores,
  useRemoveChore,
  useUpdateChore,
} from "../../hooks/useQueries";

function frequencyColor(f: ChoreFrequency): string {
  switch (f) {
    case ChoreFrequency.unlimitedDaily:
      return "bg-success/15 text-success border-success/30";
    case ChoreFrequency.oncePerDay:
      return "bg-primary/15 text-primary border-primary/30";
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

interface ChoreFormData {
  name: string;
  amount: string;
  frequency: ChoreFrequency;
  isActive: boolean;
}

function defaultForm(): ChoreFormData {
  return {
    name: "",
    amount: "",
    frequency: ChoreFrequency.oncePerDay,
    isActive: true,
  };
}

export function ChoresTab() {
  const { data: chores, isLoading } = useGetAllChores();
  const addChore = useAddChore();
  const updateChore = useUpdateChore();
  const removeChore = useRemoveChore();

  const [newForm, setNewForm] = useState<ChoreFormData>(defaultForm());
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editForm, setEditForm] = useState<ChoreFormData>(defaultForm());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.amount) return;
    const amountVal = Number.parseFloat(newForm.amount);
    if (Number.isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await addChore.mutateAsync({
        name: newForm.name.trim(),
        amountCents: dollarsToCents(newForm.amount),
        frequency: newForm.frequency,
        isActive: newForm.isActive,
      });
      setNewForm(defaultForm());
      toast.success(`Chore "${newForm.name.trim()}" added!`);
    } catch {
      toast.error("Couldn't add chore. Try again.");
    }
  };

  const startEdit = (chore: Chore) => {
    setEditingId(chore.id);
    setEditForm({
      name: chore.name,
      amount: (Number(chore.amountCents) / 100).toFixed(2),
      frequency: chore.frequency,
      isActive: chore.isActive,
    });
  };

  const handleUpdate = async (choreId: bigint) => {
    if (!editForm.name.trim() || !editForm.amount) return;
    const amountVal = Number.parseFloat(editForm.amount);
    if (Number.isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await updateChore.mutateAsync({
        choreId,
        name: editForm.name.trim(),
        amountCents: dollarsToCents(editForm.amount),
        frequency: editForm.frequency,
        isActive: editForm.isActive,
      });
      setEditingId(null);
      toast.success("Chore updated!");
    } catch {
      toast.error("Couldn't update chore.");
    }
  };

  const handleRemove = async (choreId: bigint, name: string) => {
    try {
      await removeChore.mutateAsync(choreId);
      toast.success(`"${name}" removed.`);
    } catch {
      toast.error("Couldn't remove chore.");
    }
  };

  const handleToggleActive = async (chore: Chore) => {
    try {
      await updateChore.mutateAsync({
        choreId: chore.id,
        name: chore.name,
        amountCents: chore.amountCents,
        frequency: chore.frequency,
        isActive: !chore.isActive,
      });
    } catch {
      toast.error("Couldn't toggle chore.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add Chore Form */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add a Chore
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Chore Name</Label>
              <Input
                data-ocid="parent.add_chore.input"
                value={newForm.name}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Do the dishes"
                className="rounded-xl h-11"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Amount ($)</Label>
              <Input
                value={newForm.amount}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="e.g. 1.50"
                type="number"
                min="0.01"
                step="0.01"
                className="rounded-xl h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Frequency</Label>
              <Select
                value={newForm.frequency}
                onValueChange={(v) =>
                  setNewForm((p) => ({ ...p, frequency: v as ChoreFrequency }))
                }
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ChoreFrequency.unlimitedDaily}>
                    ♾️ Unlimited Daily
                  </SelectItem>
                  <SelectItem value={ChoreFrequency.oncePerDay}>
                    ☀️ Once Per Day
                  </SelectItem>
                  <SelectItem value={ChoreFrequency.oncePerWeek}>
                    📅 Once Per Week
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3 pb-0.5">
              <div className="flex items-center gap-2">
                <Switch
                  id="new-active"
                  checked={newForm.isActive}
                  onCheckedChange={(v) =>
                    setNewForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label
                  htmlFor="new-active"
                  className="font-semibold text-sm cursor-pointer"
                >
                  Active
                </Label>
              </div>
            </div>
          </div>
          <Button
            data-ocid="parent.add_chore.submit_button"
            type="submit"
            disabled={
              addChore.isPending || !newForm.name.trim() || !newForm.amount
            }
            className="w-full rounded-xl font-display font-bold h-11"
          >
            {addChore.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Chore
          </Button>
        </form>
      </div>

      {/* Chores List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : chores && chores.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {chores.map((chore, index) => (
              <motion.div
                key={chore.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-card rounded-2xl border border-border shadow-card p-4 transition-opacity ${
                  !chore.isActive ? "opacity-60" : ""
                }`}
              >
                {editingId === chore.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="rounded-xl h-10"
                        placeholder="Chore name"
                      />
                      <Input
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, amount: e.target.value }))
                        }
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="rounded-xl h-10"
                        placeholder="Amount $"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select
                        value={editForm.frequency}
                        onValueChange={(v) =>
                          setEditForm((p) => ({
                            ...p,
                            frequency: v as ChoreFrequency,
                          }))
                        }
                      >
                        <SelectTrigger className="rounded-xl h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={ChoreFrequency.unlimitedDaily}>
                            ♾️ Unlimited Daily
                          </SelectItem>
                          <SelectItem value={ChoreFrequency.oncePerDay}>
                            ☀️ Once Per Day
                          </SelectItem>
                          <SelectItem value={ChoreFrequency.oncePerWeek}>
                            📅 Once Per Week
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`edit-active-${chore.id}`}
                          checked={editForm.isActive}
                          onCheckedChange={(v) =>
                            setEditForm((p) => ({ ...p, isActive: v }))
                          }
                        />
                        <Label
                          htmlFor={`edit-active-${chore.id}`}
                          className="cursor-pointer text-sm font-semibold"
                        >
                          Active
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(chore.id)}
                        disabled={updateChore.isPending}
                        className="rounded-xl flex-1 font-semibold"
                      >
                        {updateChore.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="rounded-xl flex-1"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-foreground truncate">
                          {chore.name}
                        </span>
                        {!chore.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-xs rounded-full"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-display font-extrabold text-success text-lg">
                          {centsToUSD(chore.amountCents)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${frequencyColor(chore.frequency)}`}
                        >
                          {frequencyEmoji(chore.frequency)}{" "}
                          {frequencyLabel(chore.frequency)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        data-ocid={`parent.chores.switch.${index + 1}`}
                        checked={chore.isActive}
                        onCheckedChange={() => handleToggleActive(chore)}
                        aria-label="Toggle active"
                      />
                      <Button
                        data-ocid={`parent.chores.edit_button.${index + 1}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(chore)}
                        className="rounded-xl hover:bg-primary/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            data-ocid={`parent.chores.delete_button.${index + 1}`}
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">
                              Delete "{chore.name}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this chore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(chore.id, chore.name)}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div
          data-ocid="parent.chores.empty_state"
          className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-border"
        >
          <p className="text-4xl mb-3">🧹</p>
          <p className="font-display font-semibold text-lg">No chores yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first chore above!
          </p>
        </div>
      )}
    </div>
  );
}
