import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversationMessages, useSendMessage, useMarkMessagesAsRead, useSendCallOffer } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Send, Phone, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import CallModal from '../components/CallModal';
import { CallType } from '../hooks/useWebRTCCall';

export default function ChatThreadScreen() {
  const navigate = useNavigate();
  const { conversationId } = useParams({ from: '/chats/$conversationId' });
  const { identity } = useInternetIdentity();
  const { data: messages, refetch, isLoading } = useGetConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const sendCallOffer = useSendCallOffer();
  const [messageText, setMessageText] = useState('');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallType, setActiveCallType] = useState<CallType>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myPrincipal = identity?.getPrincipal().toText();

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (conversationId && identity) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, identity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleCloseCall = () => {
    setIsCallModalOpen(false);
  };

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
              <h2 className="font-semibold">Chat</h2>
              <p className="text-xs text-muted-foreground">{conversationId?.slice(0, 16)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleStartCall('voice')}
              disabled={!recipientPrincipal}
              title={recipientPrincipal ? 'Start voice call' : 'Cannot determine recipient'}
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleStartCall('video')}
              disabled={!recipientPrincipal}
              title={recipientPrincipal ? 'Start video call' : 'Cannot determine recipient'}
            >
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Non-realtime notice */}
      <div className="container mx-auto px-4 pt-2">
        <Alert variant="default" className="bg-accent/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Messages are not real-time. Tap the Refresh button to check for new messages.
          </AlertDescription>
        </Alert>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
          ) : sortedMessages.length > 0 ? (
            sortedMessages.map((msg) => {
              const isMyMessage = msg.sender.toText() === myPrincipal;
              return (
                <div key={msg.id.toString()} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMyMessage
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Send a message to start the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
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
            <Button onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()} size="icon">
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
        />
      )}
    </div>
  );
}
