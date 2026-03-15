import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UtrRecord {
    id: bigint;
    utr: string;
    status: UtrStatus;
    challanId: bigint;
    vehicleNumber: string;
    submittedAt: string;
    amount: bigint;
}
export interface Challan {
    id: bigint;
    status: Status;
    fineAmount: bigint;
    date: string;
    vehicleNumber: string;
    officerName: string;
    discountedAmount: bigint;
    location: string;
    violationType: string;
}
export enum Status {
    pending = "pending",
    paid = "paid"
}
export enum UtrStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface ApiConfig {
    apiKey: string | null;
    apiBaseUrl: string | null;
}
export interface backendInterface {
    addChallan(vehicleNumber: string, violationType: string, fineAmount: bigint, date: string, location: string, officerName: string): Promise<bigint>;
    approveUtr(utrId: bigint): Promise<void>;
    getChallan(id: bigint): Promise<Challan>;
    getChallansByVehicle(vehicleNumber: string): Promise<Array<Challan>>;
    getSupportNumber(): Promise<string | null>;
    getUpiId(): Promise<string | null>;
    getUtrSubmissions(): Promise<Array<UtrRecord>>;
    payChallan(id: bigint): Promise<void>;
    rejectUtr(utrId: bigint): Promise<void>;
    seedSampleData(): Promise<void>;
    setSupportNumber(number: string): Promise<void>;
    setUpiId(newUpiId: string): Promise<void>;
    submitUtr(challanId: bigint, vehicleNumber: string, amount: bigint, utr: string, submittedAt: string): Promise<bigint>;
    setApiConfig(key: string, baseUrl: string): Promise<void>;
    getApiConfig(): Promise<{ apiKey: string | null; apiBaseUrl: string | null }>;
}
