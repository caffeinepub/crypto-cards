// No changes needed, you can directly deploy draft (Version 163) as-is.

import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";

actor {
  include MixinStorage();

  type WalletAddress = Text;
  type TransactionId = Text;

  type AccessControlUser = {
    principal : Principal;
    role : AccessControl.UserRole;
  };

  type PlayerStats = {
    gamesPlayed : Nat;
    gamesWon : Nat;
    totalWinnings : Nat;
    currentBalance : Nat;
    flopsSeen : Nat;
    flopsTotalHands : Nat;
  };

  type FlopsSeenStats = {
    flopsTotalHands : Nat;
    flopsSeen : Nat;
  };

  type Lobby = {
    id : Nat;
    creator : Principal;
    wagerAmount : Nat;
    maxPlayers : Nat;
    players : [Principal];
    isActive : Bool;
    chatMessages : [ChatMessage];
    botCount : Nat;
    gameType : { #spades; #omaha4Card };
    mode : { #forFun; #forReal };
    waitingForPlayers : Bool;
    createdAt : Int;
    flexaDepositId : ?Text;
  };

  type PersistentLobby = {
    id : Nat;
    creator : Principal;
    wagerAmount : Nat;
    maxPlayers : Nat;
    players : [Principal];
    isActive : Bool;
    chatMessages : [ChatMessage];
    botCount : Nat;
    gameType : { #spades; #omaha4Card };
    mode : { #forFun; #forReal };
    waitingForPlayers : Bool;
    createdAt : Int;
    flexaDepositId : ?Text;
  };

  type Tournament = {
    id : Nat;
    creator : Principal;
    entryFee : Nat;
    participants : [Principal];
    rounds : Nat;
    isActive : Bool;
    leaderboard : [LeaderboardEntry];
    gameType : { #spades; #omaha4Card };
  };

  type PersistentTournament = {
    id : Nat;
    creator : Principal;
    entryFee : Nat;
    participants : [Principal];
    rounds : Nat;
    isActive : Bool;
    leaderboard : [LeaderboardEntry];
    gameType : { #spades; #omaha4Card };
  };

  type ChatMessage = {
    sender : Principal;
    message : Text;
    timestamp : Int;
  };

  type TransactionRecord = {
    txId : TransactionId;
    txType : { #deposit; #wager; #winnings; #withdrawal };
    amount : Nat;
    timestamp : Int;
    status : { #pending; #completed; #failed };
  };

  type SerializablePlayerProfile = {
    walletAddress : WalletAddress;
    playerStats : PlayerStats;
    transactionHistory : [TransactionRecord];
    totalWinnings : Nat;
    currentBalance : Nat;
    flopsSeenStats : FlopsSeenStats;
  };

  type UserProfile = {
    name : Text;
    walletAddress : WalletAddress;
  };

  type LeaderboardEntry = {
    player : Principal;
    totalWinnings : Nat;
  };

  type BotProfile = {
    name : Text;
    wins : Nat;
    losses : Nat;
    isActive : Bool;
  };

  type AdminStats = {
    activeLobbies : Nat;
    activeTournaments : Nat;
    totalWagers : Nat;
    platformBalance : Nat;
    houseCutPercent : Nat;
  };

  type StartLobbyResult = { #forFunOnly; #realPlayStarted : Nat };

  type BiddingPhaseState = {
    hasViewedCards : Bool;
    biddingStarted : Bool;
    cardsViewedAt : ?Int;
    bids : [Bid];
    isMultiPlayer : Bool;
    isActive : Bool;
  };

  type Bid = {
    player : Principal;
    amount : Nat;
    timestamp : Int;
  };

  type Omaha4CardState = {
    // ... [No change]
    holeCards : Map.Map<Principal, [Text]>;
    flop : [Text];
    turn : ?Text;
    river : ?Text;
    bettingRound : Nat;
    pot : Nat;
    currentBets : Map.Map<Principal, Nat>;
    communityCards : [Text];
    dealerCards : DealerCardsDisplay;
    turnCardFlipped : Bool;
    riverCardFlipped : Bool;
    flopVisible : Bool;
    lastAction : ?{ #noAction; #call; #bet; #fold };
  };

  type DealerCardsDisplay = {
    isRevealed : Bool;
    cards : [Text];
  };

  type LobbyWithAutoProfileResult = {
    lobbyId : Nat;
    profileCreated : Bool;
  };

  type WithdrawalRequest = {
    amount : Nat;
    walletAddress : WalletAddress;
    timestamp : Int;
  };

  type Card = {
    suit : { #spades; #hearts; #diamonds; #clubs };
    rank : Nat;
  };

  type PlayedCard = {
    player : Principal;
    card : Card;
  };

  type Trick = {
    leadSuit : ?{ #spades; #hearts; #diamonds; #clubs };
    cards : [PlayedCard];
    winner : ?Principal;
  };

  type RenegPenalty = {
    player : Principal;
    trickNumber : Nat;
    timestamp : Int;
    penaltyPoints : Int;
  };

  type SerializableSpadesGameState = {
    lobbyId : Nat;
    currentTrick : Trick;
    completedTricks : [Trick];
    playerHands : [(Principal, [Card])];
    scores : [(Principal, Int)];
    currentPlayer : ?Principal;
    renegPenalties : [RenegPenalty];
    isActive : Bool;
  };

  type PersistentSpadesGameState = {
    lobbyId : Nat;
    currentTrick : Trick;
    currentTrickCards : [PlayedCard];
    completedTricks : [Trick];
    playerHands : Map.Map<Principal, [Card]>;
    scores : Map.Map<Principal, Int>;
    currentPlayer : ?Principal;
    renegPenalties : [RenegPenalty];
    isActive : Bool;
  };

  type MatchmakingResult = {
    lobbyId : Nat;
    profileCreated : Bool;
    playersFound : Nat;
    botsAdded : Nat;
    status : Text;
  };

  type FlexaDeposit = {
    depositId : Text;
    amount : Nat;
    status : { #pending; #confirmed; #failed };
    createdAt : Int;
    playerPrincipal : ?Principal;
    walletAddress : ?WalletAddress;
  };

  type FlexaWebhookPayload = {
    depositId : Text;
    amount : Nat;
    status : Text;
    timestamp : Int;
    signature : Text;
    apiKey : Text;
  };

  type CanisterBuildMetadata = {
    commitHash : Text;
    buildTime : Int;
    dfxVersion : Text;
  };

  type FlexaDepositIntent = {
    depositId : Text;
    amount : Nat;
    principal : Principal;
    walletAddress : Text;
    createdAt : Int;
  };

  let accessControlState = AccessControl.initState();
  let playerProfiles = Map.empty<Principal, SerializablePlayerProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let lobbies = Map.empty<Nat, Lobby>();
  let tournaments = Map.empty<Nat, Tournament>();
  let bots = Map.empty<Text, BotProfile>();
  let withdrawalRequests = Map.empty<TransactionId, WithdrawalRequest>();
  let spadesGames = Map.empty<Nat, PersistentSpadesGameState>();
  let biddingPhases = Map.empty<Nat, BiddingPhaseState>();
  let omaha4CardStates = Map.empty<Nat, Omaha4CardState>();
  let pendingFlexaDeposits = Map.empty<Text, FlexaDeposit>();
  let processedWebhookIds = Map.empty<Text, Int>();
  let authorizedFlexaWebhookPrincipals = Map.empty<Principal, Bool>();

  var minWagerAmount : Nat = 500;
  var nextLobbyId = 1;
  var nextTournamentId = 1;
  var houseCutPercent : Nat = 5;
  var adminInitialized : Bool = false;
  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var matchmakingWaitPeriodSeconds : Nat = 10;
  var flexaApiKey : ?Text = null;
  var flexaWebhookSecret : ?Text = null;

  // Canister build metadata
  var canisterBuildMetadata : CanisterBuildMetadata = {
    commitHash = "";
    buildTime = 0;
    dfxVersion = "";
  };

  /// Set canister build/deploy metadata (admin-only)
  public shared ({ caller }) func setCanisterBuildMetadata(commitHash : Text, buildTime : Int, dfxVersion : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Access denied: Only admin can update build metadata");
    };
    canisterBuildMetadata := {
      commitHash;
      buildTime;
      dfxVersion;
    };
  };

  public query ({ caller }) func getCanisterBuildMetadata() : async CanisterBuildMetadata {
    canisterBuildMetadata;
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// Flexa deposit intent endpoint
  public shared ({ caller }) func initiateFlexaDeposit(amount : Nat, walletAddress : Text) : async FlexaDepositIntent {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let depositId = caller.toText() # "." # Time.now().toText();
    let now = Time.now();
    let intent : FlexaDepositIntent = {
      depositId;
      amount;
      principal = caller;
      walletAddress;
      createdAt = now;
    };

    // Add pending deposit with `pending` status
    let pendingDeposit : FlexaDeposit = {
      depositId;
      amount;
      status = #pending;
      createdAt = now;
      playerPrincipal = ?caller;
      walletAddress = ?walletAddress;
    };
    pendingFlexaDeposits.add(depositId, pendingDeposit);

    intent;
  };

  /// Flexa deposit callback (simulated webhook)
  public shared ({ caller }) func updateFlexaDepositStatus(depositId : Text, status : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update deposit status");
    };

    let existing = pendingFlexaDeposits.get(depositId);
    switch (existing) {
      case (null) {
        Runtime.trap("No such deposit found");
      };
      case (?pendingDeposit) {
        let updatedStatus = switch (status) {
          case ("confirmed") { #confirmed };
          case ("failed") { #failed };
          case (_) { Runtime.trap("Invalid status - must be 'confirmed' or 'failed'") };
        };

        let updatedDeposit : FlexaDeposit = {
          depositId = pendingDeposit.depositId;
          amount = pendingDeposit.amount;
          status = updatedStatus;
          createdAt = pendingDeposit.createdAt;
          playerPrincipal = pendingDeposit.playerPrincipal;
          walletAddress = pendingDeposit.walletAddress;
        };

        pendingFlexaDeposits.add(depositId, updatedDeposit);

        if (updatedStatus == #confirmed) {
          // Update player profile balance
          switch (pendingDeposit.playerPrincipal) {
            case (null) { () };
            case (?playerPrincipal) {
              switch (playerProfiles.get(playerPrincipal)) {
                case (null) { () };
                case (?existingProfile) {
                  let txId = depositId;
                  let newTransaction : TransactionRecord = {
                    txId;
                    txType = #deposit;
                    amount = pendingDeposit.amount;
                    timestamp = Time.now();
                    status = #completed;
                  };

                  let updatedProfile : SerializablePlayerProfile = {
                    walletAddress = existingProfile.walletAddress;
                    playerStats = {
                      gamesPlayed = existingProfile.playerStats.gamesPlayed;
                      gamesWon = existingProfile.playerStats.gamesWon;
                      totalWinnings = existingProfile.playerStats.totalWinnings;
                      currentBalance = existingProfile.playerStats.currentBalance + pendingDeposit.amount;
                      flopsSeen = existingProfile.playerStats.flopsSeen;
                      flopsTotalHands = existingProfile.playerStats.flopsTotalHands;
                    };
                    transactionHistory = existingProfile.transactionHistory.concat([newTransaction]);
                    totalWinnings = existingProfile.totalWinnings;
                    currentBalance = existingProfile.currentBalance + pendingDeposit.amount;
                    flopsSeenStats = existingProfile.flopsSeenStats;
                  };
                  playerProfiles.add(playerPrincipal, updatedProfile);
                };
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getDepositsByPrincipal(principal : Principal) : async [FlexaDeposit] {
    if (principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own deposits");
    };
    let filtered = pendingFlexaDeposits.values().filter(
      func(d) {
        switch (d.playerPrincipal) {
          case (?p) { p == principal };
          case (null) { false };
        };
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getDepositsByWallet(walletAddress : Text) : async [FlexaDeposit] {
    let filtered = pendingFlexaDeposits.values().filter(
      func(d) {
        switch (d.walletAddress) {
          case (?a) { a == walletAddress };
          case (null) { false };
        };
      }
    );
    filtered.toArray();
  };

  public shared ({ caller }) func cancelDeposit(depositId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can cancel deposits");
    };
    let existing = pendingFlexaDeposits.get(depositId);
    switch (existing) {
      case (null) {
        Runtime.trap("Deposit not found");
      };
      case (?deposit) {
        pendingFlexaDeposits.remove(depositId);
      };
    };
  };

  public shared ({ caller }) func adminCreateDeposit(depositId : Text, amount : Nat, playerPrincipal : Principal, walletAddress : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create deposits");
    };
    let newDeposit : FlexaDeposit = {
      depositId;
      amount;
      status = #pending;
      createdAt = Time.now();
      playerPrincipal = ?playerPrincipal;
      walletAddress = ?walletAddress;
    };
    pendingFlexaDeposits.add(depositId, newDeposit);
  };

  public shared ({ caller }) func batchUpdateDepositStatus(updates : [(Text, Text)]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can batch update deposit status");
    };

    for ((depositId, status) in updates.values()) {
      await updateFlexaDepositStatus(depositId, status);
    };
  };

  public shared ({ caller }) func batchCreateDeposits(deposits : [(Text, Nat, Principal, Text)]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can batch create deposits");
    };

    for ((depositId, amount, principal, wallet) in deposits.values()) {
      await adminCreateDeposit(depositId, amount, principal, wallet);
    };
  };

  // FULL ACCESS CONTROL COPY PASTE

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };
};
