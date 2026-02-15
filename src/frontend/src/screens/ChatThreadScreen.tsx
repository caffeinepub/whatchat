import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversationMessages, useSendMessage, useMarkMessagesAsRead, useSendCallOffer, useSendCallAnswer, useSendCallCandidate } from '../hooks/useQueries';
import { usePollingRefetch } from '../hooks/usePollingRefetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Send, Phone, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import CallModal from '../components/CallModal';
import { CallType } from '../hooks/useWebRTCCall';

export default function ChatThreadScreen() {
  const navigate = useNavigate();
  const { conversationId } = useParams({ from: '/chats/$conversationId' });
  const { identity, isInitializing } = useInternetIdentity();
  const { data: messages, refetch, isLoading } = useGetConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const sendCallOffer = useSendCallOffer();
  const sendCallAnswer = useSendCallAnswer();
  const sendCallCandidate = useSendCallCandidate();
  const [messageText, setMessageText] = useState('');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallType, setActiveCallType] = useState<CallType>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myPrincipal = identity?.getPrincipal().toText();

  useEffect(() => {
    if (!identity && !isInitializing) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  useEffect(() => {
    if (conversationId && identity) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, identity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh polling for messages
  const handlePollingRefetch = useCallback(async () => {
    await refetch();
    // Re-mark as read after refresh to keep unread state accurate
    if (conversationId && identity) {
      markAsRead.mutate(conversationId);
    }
  }, [refetch, conversationId, identity, markAsRead]);

  usePollingRefetch({
    enabled: !!identity && !!conversationId,
    interval: 3000,
    onRefetch: handlePollingRefetch,
  });

  const getRecipientPrincipal = (): Principal | null => {
    if (!conversationId || !myPrincipal) return null;

    // Extract the two principal IDs from the conversation ID
    // The conversation ID is the concatenation of two sorted principal IDs
    const myPrincipalText = myPrincipal;
    
    // Try to split the conversation ID to find the other principal
    // This is a simplified approach - in production you'd want a more robust method
    if (conversationId.includes(myPrincipalText)) {
      const otherPrincipalText = conversationId.replace(myPrincipalText, '');
      try {
        return Principal.fromText(otherPrincipalText);
      } catch {
        return null;
      }
    }
    
    return null;
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;

    const recipient = getRecipientPrincipal();
    if (!recipient) {
      toast.error('Could not determine recipient');
      return;
    }

    try {
      await sendMessage.mutateAsync({ receiver: recipient, content: messageText.trim() });
      setMessageText('');
      await refetch();
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Messages refreshed');
    } catch (error) {
      toast.error('Failed to refresh messages');
    }
  };

  const handleStartCall = (callType: CallType) => {
    const recipient = getRecipientPrincipal();
    if (!recipient) {
      toast.error('Cannot start call: Could not determine recipient');
      return;
    }

    setActiveCallType(callType);
    setIsCallModalOpen(true);
  };

  const handleSendOffer = async (offer: string) => {
    const recipient = getRecipientPrincipal();
    if (!recipient) {
      toast.error('Cannot send offer: Could not determine recipient');
      return;
    }

    try {
      await sendCallOffer.mutateAsync({ callee: recipient, offer });
    } catch (error) {
      console.error('Failed to send offer:', error);
      toast.error('Failed to initiate call');
    }
  };

  const handleSendAnswer = async (answer: string) => {
    const recipient = getRecipientPrincipal();
    if (!recipient) {
      toast.error('Cannot send answer: Could not determine recipient');
      return;
    }

    try {
      await sendCallAnswer.mutateAsync({ caller: recipient, answer });
    } catch (error) {
      console.error('Failed to send answer:', error);
      toast.error('Failed to answer call');
    }
  };

  const handleSendCandidate = async (candidate: string) => {
    const recipient = getRecipientPrincipal();
    if (!recipient) {
      return;
    }

    try {
      await sendCallCandidate.mutateAsync({ receiver: recipient, candidate });
    } catch (error) {
      console.error('Failed to send ICE candidate:', error);
    }
  };

  const handleCloseCall = () => {
    setIsCallModalOpen(false);
  };

  // Show loading state while auth is initializing
  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  const sortedMessages = messages ? [...messages].sort((a, b) => Number(a.timestamp - b.timestamp)) : [];
  const recipientPrincipal = getRecipientPrincipal();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/chats' })}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Chat</h2>
              <p className="text-xs text-muted-foreground">{conversationId.slice(0, 16)}...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleStartCall('voice')}>
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleStartCall('video')}>
              <Video className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Messages auto-update while viewing this chat. You can also tap Refresh for an immediate update.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-wallpaper">
        <div className="container mx-auto px-4 py-4 space-y-4 chat-wallpaper-content">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
          ) : sortedMessages.length > 0 ? (
            sortedMessages.map((msg) => {
              const isMyMessage = msg.sender.toText() === myPrincipal;
              return (
                <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground border border-border'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={sendMessage.isPending}
            />
            <Button onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      {recipientPrincipal && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={handleCloseCall}
          callType={activeCallType}
          recipientPrincipal={recipientPrincipal}
          isInitiator={true}
          onSendOffer={handleSendOffer}
          onSendAnswer={handleSendAnswer}
          onSendCandidate={handleSendCandidate}
        />
      )}
    </div>
  );
}
