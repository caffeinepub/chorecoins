import Nat "mo:core/Nat";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    isInitialized : Bool; // Remove this field, not used in new version
    children : Map.Map<Nat, { id : Nat; name : Text; balanceCents : Int }>;
    chores : Map.Map<Nat, { id : Nat; name : Text; amountCents : Int; frequency : { #unlimitedDaily; #oncePerDay; #oncePerWeek }; isActive : Bool }>;
    transactions : Map.Map<Nat, { id : Nat; childId : Nat; amountCents : Int; txType : { #credit; #deduction }; note : Text; createdAt : Int }>;
    completions : Map.Map<Nat, { id : Nat; childId : Nat; choreId : Nat; submittedAt : Int; status : { #pending; #approved; #rejected } }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextChildId : Nat;
    nextChoreId : Nat;
    nextCompletionId : Nat;
    nextTransactionId : Nat;
  };

  type NewActor = {
    children : Map.Map<Nat, { id : Nat; name : Text; balanceCents : Int }>;
    chores : Map.Map<Nat, { id : Nat; name : Text; amountCents : Int; frequency : { #unlimitedDaily; #oncePerDay; #oncePerWeek }; isActive : Bool }>;
    transactions : Map.Map<Nat, { id : Nat; childId : Nat; amountCents : Int; txType : { #credit; #deduction }; note : Text; createdAt : Int }>;
    completions : Map.Map<Nat, { id : Nat; childId : Nat; choreId : Nat; submittedAt : Int; status : { #pending; #approved; #rejected } }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    choreAssignments : Map.Map<Nat, List.List<Nat>>;
    nextChildId : Nat;
    nextChoreId : Nat;
    nextCompletionId : Nat;
    nextTransactionId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let choreAssignments = Map.empty<Nat, List.List<Nat>>();
    { old with choreAssignments };
  };
};
