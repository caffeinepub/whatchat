import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: bigint;
    content: string;
    isRead: boolean;
    sender: Principal;
    timestamp: bigint;
    receiver: Principal;
}
export interface UserProfile {
    name: string;
    email: string;
}
export type ConversationId = string;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationIds(): Promise<Array<ConversationId>>;
    getConversationMessages(conversationId: ConversationId): Promise<Array<Message>>;
    getDevDocumentationUrl(): Promise<string>;
    getUnreadMessageCount(): Promise<bigint>;
    getUnreadMessages(conversationId: ConversationId): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markMessagesAsRead(conversationId: ConversationId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(receiver: Principal, content: string): Promise<Message>;
}
