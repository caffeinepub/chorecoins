import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Bool "mo:core/Bool";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Option "mo:core/Option";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // --- Types ---
  public type ChoreFrequency = {
    #unlimitedDaily;
    #oncePerDay;
    #oncePerWeek;
  };

  public type TransactionType = { #credit; #deduction };

  public type Transaction = {
    id : Nat;
    childId : Nat;
    amountCents : Int;
    txType : TransactionType;
    note : Text;
    createdAt : Int; // Timestamp
  };

  public type Chore = {
    id : Nat;
    name : Text;
    amountCents : Int;
    frequency : ChoreFrequency;
    isActive : Bool;
  };

  public type Child = {
    id : Nat;
    name : Text;
    balanceCents : Int;
  };

  public type ChoreStatus = { #pending; #approved; #rejected };

  public type ChoreCompletion = {
    id : Nat;
    childId : Nat;
    choreId : Nat;
    submittedAt : Int;
    status : ChoreStatus;
  };

  public type UserProfile = { name : Text };

  // --- Comparison modules ---
  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  module Child {
    public func compare(c1 : Child, c2 : Child) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  module Chore {
    public func compare(chore1 : Chore, chore2 : Chore) : Order.Order {
      Nat.compare(chore1.id, chore2.id);
    };
  };

  module ChoreCompletion {
    public func compare(c1 : ChoreCompletion, c2 : ChoreCompletion) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  public type ChoreWithAvailability = {
    chore : Chore;
    canSubmit : Bool;
    reason : ?Text;
  };

  // --- State Variables ---
  var isInitialized = false;

  // --- Storage Structures ---
  let children = Map.empty<Nat, Child>();
  let chores = Map.empty<Nat, Chore>();
  let transactions = Map.empty<Nat, Transaction>();
  let completions = Map.empty<Nat, ChoreCompletion>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Unique ID counters
  var nextChildId = 1;
  var nextChoreId = 1;
  var nextCompletionId = 1;
  var nextTransactionId = 1;

  // --- Authorization ---
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --- User Profiles ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    assertUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    assertUser(caller);
    userProfiles.add(caller, profile);
  };

  // --- Helper Functions ---
  func assertAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
  };

  func assertUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User access required");
    };
  };

  func getCurrentTimestamp() : Int {
    Time.now();
  };

  func isSameDay(ts1 : Int, ts2 : Int) : Bool {
    let dayInSeconds = 86400;
    (ts1 / 1_000_000_000) / dayInSeconds == (ts2 / 1_000_000_000) / dayInSeconds;
  };

  func isThisWeek(ts : Int) : Bool {
    let weekInSeconds = 604_800;
    let currentTime = getCurrentTimestamp();
    let timeDiff = (currentTime - ts) / 1_000_000_000;
    timeDiff >= 0 and timeDiff < weekInSeconds;
  };

  func assertCharLimit(text : Text) {
    if (text.size() > 50) {
      Runtime.trap("Text exceeds 50 character limit");
    };
  };

  func ensureAmountPositive(amount : Int) {
    if (amount <= 0) { Runtime.trap("Amount must be positive") };
  };

  func isValidChoreAmount(amountCents : Int) : Bool {
    amountCents > 0;
  };

  func isValidDeductionAmount(amountCents : Int) : Bool {
    amountCents > 0 and amountCents <= 10_000_00;
  };

  func isAllowedToday(completionsIter : Iter.Iter<ChoreCompletion>) : Bool {
    completionsIter.any(func(completion) { isSameDay(completion.submittedAt, getCurrentTimestamp()) });
  };

  func isAllowedThisWeek(completionsIter : Iter.Iter<ChoreCompletion>) : Bool {
    completionsIter.any(func(completion) { isThisWeek(completion.submittedAt) });
  };

  // --- Chore Functions (Admin Only) ---
  public shared ({ caller }) func addChore(name : Text, amountCents : Int, frequency : ChoreFrequency, isActive : Bool) : async Nat {
    assertAdmin(caller);
    assertCharLimit(name);
    ensureAmountPositive(amountCents);

    let chore = {
      id = nextChoreId;
      name;
      amountCents;
      frequency;
      isActive;
    };

    chores.add(nextChoreId, chore);
    nextChoreId += 1;
    chore.id;
  };

  public shared ({ caller }) func updateChore(choreId : Nat, name : Text, amountCents : Int, frequency : ChoreFrequency, isActive : Bool) : async Bool {
    assertAdmin(caller);
    switch (chores.get(choreId), isValidChoreAmount(amountCents)) {
      case (?existingChore, true) {
        assertCharLimit(name);
        let updatedChore = {
          existingChore with name;
          amountCents;
          frequency;
          isActive;
        };
        chores.add(choreId, updatedChore);
        true;
      };
      case (_) { false };
    };
  };

  public query ({ caller }) func getAllChores() : async [Chore] {
    assertAdmin(caller);
    chores.values().toArray().sort();
  };

  public shared ({ caller }) func removeChore(choreId : Nat) : async Bool {
    assertAdmin(caller);
    let existed = chores.containsKey(choreId);
    chores.remove(choreId);
    existed;
  };

  // --- Child Functions (Admin Only) ---
  public shared ({ caller }) func addChild(name : Text) : async Nat {
    assertAdmin(caller);
    assertCharLimit(name);

    let child = {
      id = nextChildId;
      name;
      balanceCents = 0;
    };

    children.add(nextChildId, child);
    nextChildId += 1;
    child.id;
  };

  public shared ({ caller }) func updateChildName(childId : Nat, name : Text) : async Bool {
    assertAdmin(caller);
    assertCharLimit(name);
    switch (children.get(childId)) {
      case (?existingChild) {
        let updatedChild = { existingChild with name };
        children.add(childId, updatedChild);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getChildren() : async [Child] {
    assertAdmin(caller);
    children.values().toArray().sort();
  };

  public shared ({ caller }) func removeChild(childId : Nat) : async Bool {
    assertAdmin(caller);
    let existed = children.containsKey(childId);
    children.remove(childId);
    existed;
  };

  // --- Transaction Functions ---
  func createTransaction(childId : Nat, amountCents : Int, txType : TransactionType, note : Text) {
    let transaction = {
      id = nextTransactionId;
      childId;
      amountCents;
      txType;
      note;
      createdAt = getCurrentTimestamp();
    };
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
  };

  public shared ({ caller }) func deductMoney(childId : Nat, amountCents : Int, note : Text) : async Bool {
    assertAdmin(caller);
    switch (children.get(childId), isValidDeductionAmount(amountCents)) {
      case (?child, true) {
        let newBalance = child.balanceCents - amountCents;
        children.add(childId, { child with balanceCents = newBalance });
        createTransaction(childId, -amountCents, #deduction, note);
        true;
      };
      case (_) { false };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    assertAdmin(caller);
    transactions.values().toArray().sort();
  };

  public query ({ caller }) func getTransactions(childId : Nat) : async [Transaction] {
    assertAdmin(caller);
    transactions.values().toArray().filter(func(tx) { tx.childId == childId });
  };

  // --- Completion Functions ---
  public shared ({ caller }) func approveCompletion(completionId : Nat) : async Bool {
    assertAdmin(caller);
    switch (completions.get(completionId)) {
      case (?existingCompletion) {
        let updatedCompletion = {
          existingCompletion with status = #approved;
        };
        completions.add(completionId, updatedCompletion);
        processApprovedCompletion(existingCompletion);
        true;
      };
      case (null) { false };
    };
  };

  func processApprovedCompletion(completion : ChoreCompletion) {
    switch (chores.get(completion.choreId)) {
      case (?chore) {
        switch (children.get(completion.childId)) {
          case (?child) {
            let newBalance = child.balanceCents + chore.amountCents;
            children.add(completion.childId, { child with balanceCents = newBalance });
            createTransaction(completion.childId, chore.amountCents, #credit, "Chore for '" # chore.name # "' completed");
          };
          case (null) { Runtime.trap("Child not found"); };
        };
      };
      case (null) { Runtime.trap("Chore not found"); };
    };
  };

  public shared ({ caller }) func rejectCompletion(completionId : Nat) : async Bool {
    assertAdmin(caller);
    switch (completions.get(completionId)) {
      case (?existingCompletion) {
        let updatedCompletion = {
          existingCompletion with status = #rejected;
        };
        completions.add(completionId, updatedCompletion);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getPendingCompletions() : async [ChoreCompletion] {
    assertAdmin(caller);
    completions.values().toArray().filter(func(completion) { completion.status == #pending });
  };

  public query ({ caller }) func getAllCompletions() : async [ChoreCompletion] {
    assertAdmin(caller);
    completions.values().toArray().sort();
  };

  // --- Public/Child Functions (No Auth Required) ---
  public query ({ caller }) func getChildInfo(childId : Nat) : async ?Child {
    children.get(childId);
  };

  public query ({ caller }) func getChoresForChild(childId : Nat) : async [ChoreWithAvailability] {
    let activeChores = chores.values().toArray().filter(func(chore) { chore.isActive });
    let relevantCompletions = completions.values().toArray().filter(
      func(completion) { completion.childId == childId and (completion.status == #approved or completion.status == #pending) }
    );

    activeChores.map(func(chore : Chore) : ChoreWithAvailability {
      let choreCompletions = relevantCompletions.filter(func(c) { c.choreId == chore.id });
      let (canSubmit, reason) = switch (chore.frequency) {
        case (#unlimitedDaily) { (true, null) };
        case (#oncePerDay) {
          if (isAllowedToday(choreCompletions.values())) {
            (false, ?"Already submitted today");
          } else {
            (true, null);
          };
        };
        case (#oncePerWeek) {
          if (isAllowedThisWeek(choreCompletions.values())) {
            (false, ?"Already submitted this week");
          } else {
            (true, null);
          };
        };
      };
      { chore; canSubmit; reason };
    });
  };

  public shared ({ caller }) func submitChoreCompletion(childId : Nat, choreId : Nat) : async Bool {
    switch (validateSubmission(childId, choreId)) {
      case (?completion) {
        completions.add(completion.id, completion);
        true;
      };
      case (_) { false };
    };
  };

  public query ({ caller }) func getChildCompletions(childId : Nat) : async [ChoreCompletion] {
    completions.values().toArray().filter(func(completion) { completion.childId == childId });
  };

  public query ({ caller }) func getChildTransactions(childId : Nat) : async [Transaction] {
    transactions.values().toArray().filter(func(tx) { tx.childId == childId });
  };

  // --- Helper function ---
  func validateSubmission(childId : Nat, choreId : Nat) : ?ChoreCompletion {
    switch (children.get(childId), chores.get(choreId)) {
      case (?_, ?chore) {
        if (not chore.isActive) { return null };
        let relevantCompletions = completions.values().toArray().filter(
          func(completion) {
            completion.childId == childId and
            completion.choreId == choreId and
            (completion.status == #approved or completion.status == #pending)
          }
        );
        switch (chore.frequency) {
          case (#unlimitedDaily) {};
          case (#oncePerDay) {
            if (isAllowedToday(relevantCompletions.values())) { return null };
          };
          case (#oncePerWeek) {
            if (isAllowedThisWeek(relevantCompletions.values())) { return null };
          };
        };
        ?{
          id = nextCompletionId;
          childId;
          choreId;
          submittedAt = getCurrentTimestamp();
          status = #pending;
        };
      };
      case (_) { null };
    };
  };
};
