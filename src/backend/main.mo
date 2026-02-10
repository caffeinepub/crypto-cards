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

// Actor includes MixinStorage for file management
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

  type SpadesPersistentGameState = {
    lobbyId : Nat;
    currentTrick : Trick;
    completedTricks : [Trick];
    playerHands : Map.Map<Principal, [Card]>;
    scores : Map.Map<Principal, Int>;
    currentPlayer : ?Principal;
    renegPenalties : [RenegPenalty];
    isActive : Bool;
  };

  // New canister build metadata type
  type CanisterBuildMetadata = {
    commitHash : Text;
    buildTime : Int;
    dfxVersion : Text;
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
    commitHash = ""; // Will be set during deployment
    buildTime = 0; // Will be set during deployment
    dfxVersion = ""; // Will be set during deployment
  };

  public query ({ caller }) func getCanisterBuildMetadata() : async CanisterBuildMetadata {
    canisterBuildMetadata;
  };

  // STRIPE METHODS

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
