// Props for the exported component
export interface CallCenterProps {
  /** Automatically read from URL? Consumers can also pass roomId/userId */
  roomId?: string;
  userId?: string;
}

// All state & actions returned by our hook
export interface UseCallCenterReturn {
  isConnecting: boolean;
  connectionError: string | null;
  isInCall: boolean;
  isCallPopup: boolean;
  guestCaller: string | null;
  showConfirm: boolean;
  isFullScreen: boolean;
  cameraOn: boolean;
  micOn: boolean;
  callTime: number;
  remoteJoined: boolean;
  localStream: MediaStream | null;
  

  /** Refs to wire into UI */
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;

  /** Handlers */
  handleConfirmYes(): void;
  handleConfirmNo(): void;
  handleAcceptCall(): void;
  handleDeclineCall(): void;
  handleStartCall(): void;
  handleStopCall(): void;
  toggleCamera(): void;
  toggleMic(): void;
  toggleFullScreen(): void;
  formatTime(seconds: number): string;
}
