import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Message, ConversationId } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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
      await actor.saveCallerUserProfile(profile);
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
      return actor.getConversationIds();
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
      return actor.getConversationMessages(conversationId);
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
      return actor.sendMessage(receiver, content);
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
      await actor.markMessagesAsRead(conversationId);
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
      return actor.getUnreadMessageCount();
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
      try {
        const principal = Principal.fromText(principalId);
        return actor.getUserProfile(principal);
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
      return actor.getDevDocumentationUrl();
    },
    enabled: !!actor && !actorFetching,
  });
}
