import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useWebRTCCall, CallType } from '../hooks/useWebRTCCall';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: CallType;
  recipientPrincipal: Principal;
  recipientName?: string;
  isInitiator: boolean;
  onSendOffer?: (offer: string) => Promise<void>;
  onSendAnswer?: (answer: string) => Promise<void>;
  onSendCandidate?: (candidate: string) => Promise<void>;
  incomingOffer?: string | null;
}

export default function CallModal({
  isOpen,
  onClose,
  callType,
  recipientPrincipal,
  recipientName,
  isInitiator,
  onSendOffer,
  onSendAnswer,
  onSendCandidate,
  incomingOffer,
}: CallModalProps) {
  const [callStatus, setCallStatus] = useState<'initializing' | 'connecting' | 'connected' | 'failed'>('initializing');
  const [isEnding, setIsEnding] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const hasProcessedOffer = useRef(false);
  const hasCreatedOffer = useRef(false);

  const {
    localStream,
    remoteStream,
    peerConnection,
    isInitializing,
    isMuted,
    isCameraOff,
    error,
    connectionState,
    initializeMedia,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleMute,
    toggleCamera,
    cleanup,
  } = useWebRTCCall({
    callType,
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        setCallStatus('connected');
      } else if (state === 'failed' || state === 'disconnected') {
        setCallStatus('failed');
      }
    },
  });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle ICE candidates
  useEffect(() => {
    if (!peerConnection) return;

    const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && onSendCandidate) {
        onSendCandidate(JSON.stringify(event.candidate.toJSON()));
      }
    };

    peerConnection.addEventListener('icecandidate', handleIceCandidate);

    return () => {
      peerConnection.removeEventListener('icecandidate', handleIceCandidate);
    };
  }, [peerConnection, onSendCandidate]);

  // Initialize media and start call flow
  useEffect(() => {
    if (!isOpen) return;

    const startCall = async () => {
      const success = await initializeMedia();
      if (!success) {
        setCallStatus('failed');
        return;
      }

      setCallStatus('connecting');

      // If initiator, create and send offer
      if (isInitiator && !hasCreatedOffer.current && onSendOffer) {
        hasCreatedOffer.current = true;
        const offer = await createOffer();
        if (offer) {
          await onSendOffer(JSON.stringify(offer));
        } else {
          setCallStatus('failed');
        }
      }

      // If receiver and has incoming offer, create and send answer
      if (!isInitiator && incomingOffer && !hasProcessedOffer.current && onSendAnswer) {
        hasProcessedOffer.current = true;
        try {
          const offer = JSON.parse(incomingOffer);
          const answer = await createAnswer(offer);
          if (answer) {
            await onSendAnswer(JSON.stringify(answer));
          } else {
            setCallStatus('failed');
          }
        } catch (err) {
          console.error('Error processing incoming offer:', err);
          setCallStatus('failed');
        }
      }
    };

    startCall();
  }, [isOpen, isInitiator, incomingOffer, initializeMedia, createOffer, createAnswer, onSendOffer, onSendAnswer]);

  const handleEndCall = useCallback(async () => {
    setIsEnding(true);
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  const handleRefresh = () => {
    toast.info('Refreshing call state...');
    // This would trigger a refetch in the parent component
  };

  const getStatusText = () => {
    if (error) return 'Call failed';
    if (isEnding) return 'Ending call...';
    
    switch (callStatus) {
      case 'initializing':
        return 'Initializing...';
      case 'connecting':
        return isInitiator ? 'Calling...' : 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'failed':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  const recipientDisplay = recipientName || recipientPrincipal.toText().slice(0, 16) + '...';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="capitalize">{callType}</span> Call - {recipientDisplay}
            </div>
            <span className="text-sm font-normal text-muted-foreground">{getStatusText()}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Non-realtime notice */}
        <Alert variant="default" className="bg-accent/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Calling may take a moment because it is not real-time. The connection is established through polling.
          </AlertDescription>
        </Alert>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Video display */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          {/* Local video */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {callType === 'video' ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">You (Audio only)</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              You
            </div>
            {isCameraOff && callType === 'video' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Remote video */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {remoteStream ? (
              callType === 'video' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{recipientDisplay}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted-foreground/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Phone className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {callStatus === 'connecting' ? 'Waiting for connection...' : 'No remote stream'}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {recipientDisplay}
            </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isInitializing || isEnding}
            className="h-12 w-12"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>

          <Button
            variant={isMuted ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleMute}
            disabled={isInitializing || isEnding || !localStream}
            className="h-12 w-12"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {callType === 'video' && (
            <Button
              variant={isCameraOff ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleCamera}
              disabled={isInitializing || isEnding || !localStream}
              className="h-12 w-12"
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndCall}
            disabled={isEnding}
            className="h-14 w-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
