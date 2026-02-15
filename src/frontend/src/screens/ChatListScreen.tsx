import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversationIds, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ChatListScreen() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: conversationIds, refetch, isLoading } = useGetConversationIds();
  const { data: userProfile } = useGetCallerUserProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recipientPrincipal, setRecipientPrincipal] = useState('');

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const handleStartChat = () => {
    if (!recipientPrincipal.trim()) {
      toast.error('Please enter a Principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(recipientPrincipal.trim());
      const myPrincipal = identity?.getPrincipal();

      if (myPrincipal && principal.toText() === myPrincipal.toText()) {
        toast.error('You cannot start a chat with yourself');
        return;
      }

      // Generate conversation ID (same logic as backend)
      const ids = [myPrincipal?.toText() || '', principal.toText()].sort();
      const conversationId = ids[0] + ids[1];

      setIsDialogOpen(false);
      setRecipientPrincipal('');
      navigate({ to: '/chats/$conversationId', params: { conversationId } });
    } catch (error) {
      toast.error('Invalid Principal ID format');
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Conversations refreshed');
    } catch (error) {
      toast.error('Failed to refresh conversations');
    }
  };

  if (!identity) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chats</h2>
            {userProfile && <p className="text-sm text-muted-foreground">{userProfile.name}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Messages are not real-time. Tap the Refresh button to check for new messages.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="principal">Recipient's Principal ID</Label>
                    <Input
                      id="principal"
                      placeholder="Enter Principal ID"
                      value={recipientPrincipal}
                      onChange={(e) => setRecipientPrincipal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask your contact to share their Principal ID from Settings.
                    </p>
                  </div>
                  <Button onClick={handleStartChat} className="w-full">
                    Start Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading conversations...</div>
          ) : conversationIds && conversationIds.length > 0 ? (
            <div className="space-y-2">
              {conversationIds.map((convId) => (
                <Card
                  key={convId}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate({ to: '/chats/$conversationId', params: { conversationId: convId } })}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Conversation</p>
                      <p className="text-sm text-muted-foreground truncate">{convId.slice(0, 20)}...</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">Start a new chat to begin messaging</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
