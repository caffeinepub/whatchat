import { useRef, useState, useCallback, useEffect } from 'react';

export type CallType = 'voice' | 'video';

export interface UseWebRTCCallOptions {
  callType: CallType;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export interface UseWebRTCCallReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isInitializing: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  error: string | null;
  connectionState: RTCPeerConnectionState;
  
  initializeMedia: () => Promise<boolean>;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
  setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  cleanup: () => void;
}

export function useWebRTCCall(options: UseWebRTCCallOptions): UseWebRTCCallReturn {
  const { callType, onRemoteStream, onConnectionStateChange } = options;
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const initializeMedia = useCallback(async (): Promise<boolean> => {
    setIsInitializing(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Initialize peer connection
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteMediaStream] = event.streams;
        remoteStreamRef.current = remoteMediaStream;
        setRemoteStream(remoteMediaStream);
        onRemoteStream?.(remoteMediaStream);
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        onConnectionStateChange?.(pc.connectionState);
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      setIsInitializing(false);
      return true;
    } catch (err: any) {
      console.error('Error initializing media:', err);
      let errorMessage = 'Failed to access camera or microphone';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission denied. Please allow access to your camera and microphone.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      }
      
      setError(errorMessage);
      setIsInitializing(false);
      return false;
    }
  }, [callType, onRemoteStream, onConnectionStateChange]);

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) {
      setError('Peer connection not initialized');
      return null;
    }

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to create call offer');
      return null;
    }
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) {
      setError('Peer connection not initialized');
      return null;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidatesQueue.current = [];

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      return answer;
    } catch (err) {
      console.error('Error creating answer:', err);
      setError('Failed to answer call');
      return null;
    }
  }, []);

  const setRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit): Promise<void> => {
    if (!peerConnectionRef.current) {
      setError('Peer connection not initialized');
      return;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(description));
      
      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidatesQueue.current = [];
    } catch (err) {
      console.error('Error setting remote description:', err);
      setError('Failed to establish connection');
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (!peerConnectionRef.current) {
      return;
    }

    try {
      // If remote description is not set yet, queue the candidate
      if (!peerConnectionRef.current.remoteDescription) {
        iceCandidatesQueue.current.push(candidate);
        return;
      }

      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!audioTracks[0]?.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current || callType !== 'video') return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff(!videoTracks[0]?.enabled);
  }, [callType]);

  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop all remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear state
    setError(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setConnectionState('closed');
    iceCandidatesQueue.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    peerConnection: peerConnectionRef.current,
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
  };
}
