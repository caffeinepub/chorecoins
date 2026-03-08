import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Chore {
    id: bigint;
    name: string;
    amountCents: bigint;
    isActive: boolean;
    frequency: ChoreFrequency;
}
export interface ChoreCompletion {
    id: bigint;
    status: ChoreStatus;
    submittedAt: bigint;
    childId: bigint;
    choreId: bigint;
}
export interface Child {
    id: bigint;
    name: string;
    balanceCents: bigint;
}
export interface ChoreWithAvailability {
    chore: Chore;
    canSubmit: boolean;
    reason?: string;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: bigint;
    note: string;
    createdAt: bigint;
    amountCents: bigint;
    childId: bigint;
    txType: TransactionType;
}
export enum ChoreFrequency {
    unlimitedDaily = "unlimitedDaily",
    oncePerWeek = "oncePerWeek",
    oncePerDay = "oncePerDay"
}
export enum ChoreStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum TransactionType {
    deduction = "deduction",
    credit = "credit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChild(name: string): Promise<bigint>;
    addChore(name: string, amountCents: bigint, frequency: ChoreFrequency, isActive: boolean): Promise<bigint>;
    approveCompletion(completionId: bigint): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignChoreToChildren(choreId: bigint, childIds: Array<bigint>): Promise<void>;
    deductMoney(childId: bigint, amountCents: bigint, note: string): Promise<boolean>;
    getAllChoreAssignments(): Promise<Array<[bigint, Array<bigint>]>>;
    getAllChores(): Promise<Array<Chore>>;
    getAllCompletions(): Promise<Array<ChoreCompletion>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChildCompletions(childId: bigint): Promise<Array<ChoreCompletion>>;
    getChildInfo(childId: bigint): Promise<Child | null>;
    getChildTransactions(childId: bigint): Promise<Array<Transaction>>;
    getChildren(): Promise<Array<Child>>;
    getChildrenPublic(): Promise<Array<Child>>;
    getChoreAssignments(choreId: bigint): Promise<Array<bigint>>;
    getChoresForChild(childId: bigint): Promise<Array<ChoreWithAvailability>>;
    getPendingCompletions(): Promise<Array<ChoreCompletion>>;
    getTransactions(childId: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    rejectCompletion(completionId: bigint): Promise<boolean>;
    removeChild(childId: bigint): Promise<boolean>;
    removeChore(choreId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitChoreCompletion(childId: bigint, choreId: bigint): Promise<boolean>;
    updateChildName(childId: bigint, name: string): Promise<boolean>;
    updateChore(choreId: bigint, name: string, amountCents: bigint, frequency: ChoreFrequency, isActive: boolean): Promise<boolean>;
}
