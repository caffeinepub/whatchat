import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@dfinity/principal';

// Local type definitions for chat functionality
// These should match the backend types but are defined here since they're not in the generated interface
export interface UserProfile {
  email: string;
  name: string;
}

export interface Message {
  id: bigint;
  sender: Principal;
  receiver: Principal;
  content: string;
  timestamp: bigint;
  isRead: boolean;
}

export type ConversationId = string;

// Extend the actor interface to include chat methods
interface ExtendedActor {
  getCallerUserProfile?: () => Promise<UserProfile | null>;
  saveCallerUserProfile?: (profile: UserProfile) => Promise<void>;
  getConversationIds?: () => Promise<ConversationId[]>;
  getConversationMessages?: (conversationId: ConversationId) => Promise<Message[]>;
  sendMessage?: (receiver: Principal, content: string) => Promise<void>;
  markMessagesAsRead?: (conversationId: ConversationId) => Promise<void>;
  getUnreadMessageCount?: () => Promise<bigint>;
  getUserProfile?: (principal: Principal) => Promise<UserProfile | null>;
  getDevDocumentationUrl?: () => Promise<string>;
  sendOffer: (callee: Principal, offer: string) => Promise<void>;
  sendAnswer: (callerPrincipal: Principal, answer: string) => Promise<void>;
  sendCandidate: (receiver: Principal, candidate: string) => Promise<void>;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getCallerUserProfile) {
        throw new Error('getCallerUserProfile method not available');
      }
      return extendedActor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.saveCallerUserProfile) {
        throw new Error('saveCallerUserProfile method not available');
      }
      await extendedActor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetConversationIds() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ConversationId[]>({
    queryKey: ['conversationIds'],
    queryFn: async () => {
      if (!actor) return [];
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getConversationIds) {
        return [];
      }
      return extendedActor.getConversationIds();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetConversationMessages(conversationId: ConversationId | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['conversationMessages', conversationId],
    queryFn: async () => {
      if (!actor || !conversationId) return [];
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getConversationMessages) {
        return [];
      }
      return extendedActor.getConversationMessages(conversationId);
    },
    enabled: !!actor && !actorFetching && !!conversationId,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiver, content }: { receiver: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.sendMessage) {
        throw new Error('sendMessage method not available');
      }
      return extendedActor.sendMessage(receiver, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversationMessages'] });
      queryClient.invalidateQueries({ queryKey: ['conversationIds'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkMessagesAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: ConversationId) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.markMessagesAsRead) {
        throw new Error('markMessagesAsRead method not available');
      }
      await extendedActor.markMessagesAsRead(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversationMessages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useGetUnreadMessageCount() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getUnreadMessageCount) {
        return BigInt(0);
      }
      return extendedActor.getUnreadMessageCount();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUserProfile(principalId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getUserProfile) {
        return null;
      }
      try {
        const principal = Principal.fromText(principalId);
        return extendedActor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principalId,
  });
}

export function useGetDevDocumentationUrl() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['devDocUrl'],
    queryFn: async () => {
      if (!actor) return '';
      const extendedActor = actor as unknown as ExtendedActor;
      if (!extendedActor.getDevDocumentationUrl) {
        return '';
      }
      return extendedActor.getDevDocumentationUrl();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Call signaling hooks
export function useSendCallOffer() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ callee, offer }: { callee: Principal; offer: string }) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      await extendedActor.sendOffer(callee, offer);
    },
    onError: (error) => {
      console.error('Failed to send call offer:', error);
    },
  });
}

export function useSendCallAnswer() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ caller, answer }: { caller: Principal; answer: string }) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      await extendedActor.sendAnswer(caller, answer);
    },
    onError: (error) => {
      console.error('Failed to send call answer:', error);
    },
  });
}

export function useSendCallCandidate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ receiver, candidate }: { receiver: Principal; candidate: string }) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as unknown as ExtendedActor;
      await extendedActor.sendCandidate(receiver, candidate);
    },
    onError: (error) => {
      console.error('Failed to send ICE candidate:', error);
    },
  });
}
