import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ManualPaymentRecord {
    id: bigint;
    utr: string;
    status: UtrStatus;
    vehicleNumber: string;
    violations: string;
    submittedAt: string;
    totalAmount: bigint;
    phone: string;
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
export interface UtrRecord {
    id: bigint;
    utr: string;
    status: UtrStatus;
    challanId: bigint;
    vehicleNumber: string;
    submittedAt: string;
    amount: bigint;
}
export interface ViolationType {
    id: bigint;
    name: string;
    amount: bigint;
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
export interface backendInterface {
    addChallan(vehicleNumber: string, violationType: string, fineAmount: bigint, date: string, location: string, officerName: string): Promise<bigint>;
    addViolationType(name: string, amount: bigint): Promise<bigint>;
    approveManualPayment(id: bigint): Promise<void>;
    approveUtr(utrId: bigint): Promise<void>;
    deleteViolationType(id: bigint): Promise<void>;
    getApiConfig(): Promise<{
        apiKey?: string;
        apiBaseUrl?: string;
    }>;
    getChallan(id: bigint): Promise<Challan>;
    getChallansByVehicle(vehicleNumber: string): Promise<Array<Challan>>;
    getManualPayments(): Promise<Array<ManualPaymentRecord>>;
    getSupportNumber(): Promise<string | null>;
    getUpiId(): Promise<string | null>;
    getUtrSubmissions(): Promise<Array<UtrRecord>>;
    getViolationTypes(): Promise<Array<ViolationType>>;
    payChallan(id: bigint): Promise<void>;
    rejectManualPayment(id: bigint): Promise<void>;
    rejectUtr(utrId: bigint): Promise<void>;
    seedSampleData(): Promise<void>;
    setApiConfig(key: string, baseUrl: string): Promise<void>;
    setSupportNumber(number: string): Promise<void>;
    setUpiId(newUpiId: string): Promise<void>;
    submitManualPayment(vehicleNumber: string, phone: string, violations: string, totalAmount: bigint, utr: string, submittedAt: string): Promise<bigint>;
    submitUtr(challanId: bigint, vehicleNumber: string, amount: bigint, utr: string, submittedAt: string): Promise<bigint>;
}
