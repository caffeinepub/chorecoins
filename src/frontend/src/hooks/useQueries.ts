import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Child,
  type Chore,
  type ChoreCompletion,
  ChoreFrequency,
  type ChoreWithAvailability,
  type Transaction,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Helpers ──────────────────────────────────────────────────

export function centsToUSD(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export function dollarsToCents(dollars: string): bigint {
  return BigInt(Math.round(Number.parseFloat(dollars) * 100));
}

export function nanosToDate(nanos: bigint): Date {
  return new Date(Number(nanos / BigInt(1_000_000)));
}

export function frequencyLabel(f: ChoreFrequency): string {
  switch (f) {
    case ChoreFrequency.unlimitedDaily:
      return "Unlimited Daily";
    case ChoreFrequency.oncePerDay:
      return "Once Per Day";
    case ChoreFrequency.oncePerWeek:
      return "Once Per Week";
    default:
      return "Unknown";
  }
}

// ── Query Keys ───────────────────────────────────────────────

export const queryKeys = {
  children: ["children"],
  chores: ["chores"],
  pendingCompletions: ["pendingCompletions"],
  allCompletions: ["allCompletions"],
  childCompletions: (id: bigint) => ["childCompletions", id.toString()],
  choresForChild: (id: bigint) => ["choresForChild", id.toString()],
  childTransactions: (id: bigint) => ["childTransactions", id.toString()],
  childInfo: (id: bigint) => ["childInfo", id.toString()],
  isAdmin: ["isAdmin"],
};

// ── Children Queries ─────────────────────────────────────────

export function useGetChildren() {
  const { actor, isFetching } = useActor();
  return useQuery<Child[]>({
    queryKey: queryKeys.children,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChildren();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetChildInfo(childId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Child | null>({
    queryKey: queryKeys.childInfo(childId),
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getChildInfo(childId);
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddChild() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addChild(name);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.children });
    },
  });
}

export function useRemoveChild() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (childId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeChild(childId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.children });
    },
  });
}

// ── Chore Queries ─────────────────────────────────────────────

export function useGetAllChores() {
  const { actor, isFetching } = useActor();
  return useQuery<Chore[]>({
    queryKey: queryKeys.chores,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetChoresForChild(childId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreWithAvailability[]>({
    queryKey: queryKeys.choresForChild(childId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChoresForChild(childId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      amountCents,
      frequency,
      isActive,
    }: {
      name: string;
      amountCents: bigint;
      frequency: ChoreFrequency;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addChore(name, amountCents, frequency, isActive);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.chores });
    },
  });
}

export function useUpdateChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      choreId,
      name,
      amountCents,
      frequency,
      isActive,
    }: {
      choreId: bigint;
      name: string;
      amountCents: bigint;
      frequency: ChoreFrequency;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateChore(choreId, name, amountCents, frequency, isActive);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.chores });
    },
  });
}

export function useRemoveChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (choreId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeChore(choreId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.chores });
    },
  });
}

// ── Completions ──────────────────────────────────────────────

export function useGetPendingCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreCompletion[]>({
    queryKey: queryKeys.pendingCompletions,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingCompletions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useGetAllCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreCompletion[]>({
    queryKey: queryKeys.allCompletions,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCompletions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetChildCompletions(childId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreCompletion[]>({
    queryKey: queryKeys.childCompletions(childId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChildCompletions(childId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitChoreCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      choreId,
    }: {
      childId: bigint;
      choreId: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitChoreCompletion(childId, choreId);
    },
    onSuccess: (_data, { childId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.choresForChild(childId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.childCompletions(childId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.pendingCompletions });
    },
  });
}

export function useApproveCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (completionId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.approveCompletion(completionId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pendingCompletions });
      void qc.invalidateQueries({ queryKey: queryKeys.children });
      void qc.invalidateQueries({ queryKey: queryKeys.allCompletions });
    },
  });
}

export function useRejectCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (completionId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.rejectCompletion(completionId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pendingCompletions });
      void qc.invalidateQueries({ queryKey: queryKeys.allCompletions });
    },
  });
}

// ── Transactions ─────────────────────────────────────────────

export function useGetChildTransactions(childId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: queryKeys.childTransactions(childId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChildTransactions(childId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeductMoney() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      amountCents,
      note,
    }: {
      childId: bigint;
      amountCents: bigint;
      note: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.deductMoney(childId, amountCents, note);
    },
    onSuccess: (_data, { childId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.childTransactions(childId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.children });
      void qc.invalidateQueries({ queryKey: queryKeys.childInfo(childId) });
    },
  });
}

// ── Admin check ──────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: queryKeys.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
