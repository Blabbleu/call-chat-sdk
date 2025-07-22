import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SocketAction,
  CallStartMessage,
  CallEndMessage,
  BaseSocketMessage,
} from '../interfaces/Message';
import { SERVER_API_SOCKET_ENDPOINT } from '../constant/index';
import { UseCallCenterReturn } from '../interfaces/CallCenter.types';
import { formatTime } from '../utils/mediaUtils';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function useCallCenter(): UseCallCenterReturn {
  const query = useQuery();
  const roomId = query.get('roomId') ?? undefined;
  const userId = query.get('userId') ?? undefined;
  const navigate = useNavigate();

  // Refs
  const websocketRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // WebRTC & signaling state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);

  // UI state
  const [showConfirm, setShowConfirm] = useState(true);
  const [isCallPopup, setIsCallPopup] = useState(false);
  const [guestCaller, setGuestCaller] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callTime, setCallTime] = useState(0);

  // — Play/stop ringtone on confirm dialog —
  useEffect(() => {
    const audio = ringtoneRef.current;
    if (!audio) return;
    showConfirm ? audio.play().catch(() => {}) : audio.pause();
  }, [showConfirm]);

  // — Timer when in call —
  useEffect(() => {
    if (!isInCall) return;
    const timer = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isInCall]);

  // — Auto hang up if nobody joins within 60s —
  useEffect(() => {
    if (!isInCall) return;
    if (!remoteJoined) {
      const timer = setTimeout(() => {
        handleStopCall();
      }, 60_000);
      return () => clearTimeout(timer);
    }
  }, [isInCall, remoteJoined])

  // — WebRTC setup & signaling —
  const connectWebRTC = useCallback((): Promise<void> => {
    if (!roomId) return Promise.reject(new Error('No room specified'));
    return new Promise((res, rej) => {
      const ws = new WebSocket(
        `${SERVER_API_SOCKET_ENDPOINT}video-call-endpoint?roomId=${roomId}`
      );
      ws.onopen = () => {
        ws.onmessage = webRTCOnMessage;
        websocketRef.current = ws;
        res();
      };
      ws.onerror = e => rej(e);
    });
  }, [roomId]);

  const sendRTC = useCallback((event: string, data: any) => {
    websocketRef.current?.send(JSON.stringify({ event, roomId, username: userId, data }));
  }, [roomId, userId]);

  const webRTCOnMessage = useCallback((e: MessageEvent) => {
    const msg = JSON.parse(e.data);
    switch (msg.event) {
      case 'offer': handleOffer(msg.data); break;
      case 'answer': handleAnswer(msg.data); break;
      case 'candidate': handleCandidate(msg.data); break;
    }
  }, []);

  const handleSetUpWebRTC = useCallback(async () => {
    setRemoteJoined(false);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      await localVideoRef.current.play().catch(() => {});
    }
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.onicecandidate = e => e.candidate && sendRTC('candidate', e.candidate);

    pc.ontrack = ev => {
      const [remoteStream] = ev.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setRemoteJoined(true);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendRTC('offer', offer);
  }, [sendRTC]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerConnection.current!;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendRTC('answer', answer);
  }, [sendRTC]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleCandidate = useCallback(async (cand: RTCIceCandidateInit) => {
    peerConnection.current?.addIceCandidate(new RTCIceCandidate(cand));
  }, []);

  const handleStartCall = useCallback(async () => {

    setIsConnecting(true);
    // 1) show the PiP first
    setIsInCall(true);


    try {
      // first send our START_CALL so callee sees popup
      websocketRef.current?.send(JSON.stringify({
        action: SocketAction.START_CALL,
        data: { username: userId, text: '' }
      } as CallStartMessage));
      await connectWebRTC();
      await handleSetUpWebRTC();
      setIsInCall(true);
    } catch (err: any) {
      setConnectionError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [connectWebRTC, handleSetUpWebRTC, userId]);

  const handleStopCall = useCallback(() => {
    websocketRef.current?.send(JSON.stringify({
      action: SocketAction.END_CALL,
      data: { username: userId, text: '' }
    } as CallEndMessage));
    peerConnection.current?.close();
    websocketRef.current?.close();
    setIsInCall(false);
    setTimeout(() => {
      window.close?.();
      navigate(-1);
    }, 5000);
  }, [navigate, userId]);

  // Confirm dialog
  const handleConfirmYes = useCallback(() => {
    setShowConfirm(false);
    handleStartCall();
  }, [handleStartCall]);
  const handleConfirmNo = useCallback(() => {
    setShowConfirm(false);
    navigate(-1);
  }, [navigate]);

  // Incoming call popup (same START/END on ws)
  const handleAcceptCall = handleStartCall;
  const handleDeclineCall = useCallback(() => {
    websocketRef.current?.send(JSON.stringify({
      action: SocketAction.END_CALL,
      data: { username: userId, text: '' }
    } as CallEndMessage));
    setIsCallPopup(false);
  }, [userId]);

  const toggleCamera = () => {
    console.log('🔔 toggleCamera fired, srcObject=', localVideoRef.current?.srcObject);
    // flip the UI state first
    setCameraOn(prev => {
      const newOn = !prev;
      // pull the actual MediaStream from the video element
      const stream = localVideoRef.current?.srcObject as MediaStream|undefined;
      if (stream) {
        stream.getVideoTracks().forEach(t => t.enabled = newOn);
      }
      return newOn;
    });
  };

  const toggleMic = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(fs => !fs);
  }, []);

  

  return {
    isConnecting,
    connectionError,
    isInCall,
    isCallPopup, guestCaller,
    showConfirm,
    isFullScreen,
    cameraOn, micOn,
    callTime,
    remoteJoined,
    localVideoRef, remoteVideoRef, ringtoneRef, localStream,
    handleConfirmYes,
    handleConfirmNo,
    handleAcceptCall,
    handleDeclineCall,
    handleStartCall,
    handleStopCall,
    toggleCamera,
    toggleMic,
    toggleFullScreen,
    formatTime,
  };
}
