import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface FlexaDeposit {
    status: Variant_pending_confirmed_failed;
    depositId: string;
    createdAt: bigint;
    walletAddress?: WalletAddress;
    amount: bigint;
    playerPrincipal?: Principal;
}
export interface CanisterBuildMetadata {
    dfxVersion: string;
    commitHash: string;
    buildTime: bigint;
}
export type WalletAddress = string;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface FlexaDepositIntent {
    depositId: string;
    principal: Principal;
    createdAt: bigint;
    walletAddress: string;
    amount: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
    walletAddress: WalletAddress;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_confirmed_failed {
    pending = "pending",
    confirmed = "confirmed",
    failed = "failed"
}
export interface backendInterface {
    adminCreateDeposit(depositId: string, amount: bigint, playerPrincipal: Principal, walletAddress: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    batchCreateDeposits(deposits: Array<[string, bigint, Principal, string]>): Promise<void>;
    batchUpdateDepositStatus(updates: Array<[string, string]>): Promise<void>;
    cancelDeposit(depositId: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterBuildMetadata(): Promise<CanisterBuildMetadata>;
    getDepositsByPrincipal(principal: Principal): Promise<Array<FlexaDeposit>>;
    getDepositsByWallet(walletAddress: string): Promise<Array<FlexaDeposit>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    /**
     * / Flexa deposit intent endpoint
     */
    initiateFlexaDeposit(amount: bigint, walletAddress: string): Promise<FlexaDepositIntent>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Set canister build/deploy metadata (admin-only)
     */
    setCanisterBuildMetadata(commitHash: string, buildTime: bigint, dfxVersion: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    /**
     * / Flexa deposit callback (simulated webhook)
     */
    updateFlexaDepositStatus(depositId: string, status: string): Promise<void>;
}
