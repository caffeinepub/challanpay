import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface backendInterface {
    addChallan(vehicleNumber: string, violationType: string, fineAmount: bigint, date: string, location: string, officerName: string): Promise<bigint>;
    getChallan(id: bigint): Promise<Challan>;
    getChallansByVehicle(vehicleNumber: string): Promise<Array<Challan>>;
    payChallan(id: bigint): Promise<void>;
    seedSampleData(): Promise<void>;
}
