import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StatusResponse {
    status?: string;
    hasStatus: boolean;
}
export interface Candidate {
    sender: Principal;
    timestamp: bigint;
    candidate: string;
    receiver: Principal;
}
export interface OfferResponse {
    offer?: string;
    state: string;
    caller?: Principal;
}
export interface CandidatesResponse {
    hasCandidates: boolean;
    candidates: Array<Candidate>;
}
export interface AnswerResponse {
    answer?: string;
    state: string;
    callee?: Principal;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCallState(participant1: Principal, participant2: Principal): Promise<void>;
    fetchAnswer(callee: Principal): Promise<AnswerResponse>;
    fetchCandidates(callee: Principal): Promise<CandidatesResponse>;
    fetchOffer(callee: Principal): Promise<OfferResponse>;
    fetchStatus(callee: Principal): Promise<StatusResponse>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendAnswer(callerPrincipal: Principal, answer: string): Promise<void>;
    sendCandidate(receiver: Principal, candidate: string): Promise<void>;
    sendOffer(callee: Principal, offer: string): Promise<void>;
}
