import React, {JSX, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { SERVER_API_SOCKET_ENDPOINT } from "./constant/index";
import {
  CallStartMessage,
  CallEndMessage,
  FullCallRoomMessage,
  SocketAction,
} from "./interface/Message"
import { CallEnd, Fullscreen, FullscreenExit, Group, Mic, MicOff, Settings, Videocam, VideocamOff } from "@mui/icons-material";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CallCenter(): JSX.Element{
    const query = useQuery();
    const roomId = query.get("roomId") || undefined;
    const userId = query.get("userId") || undefined;
    const navigate = useNavigate();

     // WebRTC state
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    // WebSocket for signaling
    const socketRTC = useRef<WebSocket | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isInCall, setIsInCall] = useState(false);

    // — UI state —
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [callTime, setCallTime] = useState(0);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [showConfirm, setShowConfirm] = useState(true);

    // assign streams to video elements
    useEffect(() => {
        const vid = localVideoRef.current;
        if (vid && localStream && isInCall && cameraOn) {
            vid.srcObject = localStream;
            vid.play().catch(() => {/* ignore autoplay block */});
        }
    }, [localStream, isInCall]);

    // start call timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        if (isInCall) {
            timer = setInterval(() => setCallTime((t) => t + 1), 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isInCall]);

    const formatTime = (secs: number) => {
        const m = String(Math.floor(secs / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    //------------------------------------------------------------------------
    // WebRTC Set up
    //------------------------------------------------------------------------

    const connectWebRTC = (): Promise<WebSocket> => new Promise((res, rej) => {
        if (!roomId) return rej(new Error('No room'));
        const ws = new WebSocket(`${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint?roomId=${roomId}`);
        ws.onopen = () => { ws.onmessage = webRTCOnMessage; res(ws); };
            ws.onerror = e => rej(e);
            socketRTC.current = ws;
    });

    const sendRTCMessage = (event: string, data: any) => {
        socketRTC.current?.send(JSON.stringify({ event, roomId: roomId, username: userId, data }));
    };

    const webRTCOnMessage = (e: MessageEvent) => {
        const msg = JSON.parse(e.data);
        switch (msg.event) {
        case 'offer': 
            handleOffer(msg.data); 
            break;
        case 'answer': 
            handleAnswer(msg.data); 
            break;
        case 'candidate':  
            handleCandidate(msg.data); 
            break;
        }
    };

    const handleSetUpWebRTC = async () => {
        const constraints = { audio: true, video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerConnection.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.onicecandidate = (e) => e.candidate && sendRTCMessage("candidate", e.candidate);
        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (e) => e.streams[0].getTracks().forEach((t) => remote.addTrack(t));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendRTCMessage("offer", offer);
    };
     const handleStartCall = async () => {
        setIsConnecting(true);
        try {
        await connectWebRTC();
        await handleSetUpWebRTC();
        setIsInCall(true);
        } catch (err) {
        setConnectionError(String(err));
        } finally {
        setIsConnecting(false);
        }
    };

    const handleStopCall = () => {
        const endMsg: CallEndMessage = {
        action: SocketAction.END_CALL,
        data: { username: userId!, text: "" },
        };
        socketRTC.current?.send(JSON.stringify(endMsg));
        peerConnection.current?.close();
        socketRTC.current?.close();
        setIsInCall(false);
        setTimeout(() => {
            window.close?.();
            navigate(-1);
        }, 5000);
    };
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        sendRTCMessage("answer", answer);
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleCandidate = async (candidate: RTCIceCandidateInit) => {
        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    };



    const toggleCamera = () => {
        if (!localStream || !peerConnection.current) return;
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !cameraOn;
        peerConnection.current.getSenders().forEach(sender => {
            if (sender.track === videoTrack) {
                sender.replaceTrack(videoTrack);
            }
        });
        setCameraOn(on => !on);
    };
    const toggleMic = () => {
        if (!localStream || !peerConnection.current) return;
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !cameraOn;
        peerConnection.current.getSenders().forEach(sender =>{
            if (sender.track === audioTrack) {
                sender.replaceTrack(audioTrack);
            }
        });
        setMicOn(on => !on);
    };

    if (connectionError) {
        return (
        <Paper sx={{ p: 2 }}>
            <Typography color="error">{connectionError}</Typography>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Paper>
        );
    }

    return (
        <>
        {/* initial prompt */}
        <Dialog open={showConfirm} disableEscapeKeyDown>
            <DialogTitle>Start Call</DialogTitle>
            <DialogContent>
            <Typography>Do you want to start the video call?</Typography>
            </DialogContent>
            <DialogActions>
            <Button
                onClick={() => {
                setShowConfirm(false);
                navigate(-1);
                }}
            >
                No
            </Button>
            <Button
                variant="contained"
                onClick={() => {
                setShowConfirm(false);
                handleStartCall();
                }}
            >
                Yes
            </Button>
            </DialogActions>
        </Dialog>
        <Box
        sx={{
            position: "relative",
            width: isFullScreen ? "100vw" : 600,
            height: isFullScreen ? "100vh" : 360,
            bgcolor: "grey.900",
            borderRadius: 2,
            overflow: "hidden",
            mx: "auto",
            my: 4,
        }}
        >
        {/* Header: Fullscreen Toggle */}
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
            <IconButton
            onClick={() => setIsFullScreen((f) => !f)}
            sx={{ color: "common.white" }}
            >
            {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
        </Box>

        {/* Main Video / Avatar */}
        <Box
            sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            }}
        >
            {cameraOn ? (
              <video
                ref={(el) => { if (el) el.srcObject = remoteStream; }}
                autoPlay
                playsInline
                // mute/unmute incoming audio:
                muted={!micOn}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: "black"
                }}
              >
                <Typography color="grey.500">Camera Off</Typography>
              </Box>
            )}
        </Box>

        {/* — Personal camera PiP — */}
        {isInCall && localStream && cameraOn && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{
              position: 'absolute',
              bottom: 80,      // leave room for the control bar
              right: 16,
              width: 120,      // square box
              height: 120,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              objectFit: 'cover',
              zIndex: 3,       // above remote video but below controls
            }}
          />
        )}


        {/* Bottom Control Bar */}
        <Box
            sx={{
            position: "absolute",
            bottom: 8,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            zIndex: 2,
            }}
        >
            {/* Settings */}
            <IconButton sx={{ color: "common.white" }}>
            <Settings />
            </IconButton>

            {/* Center Controls */}
            <Box>
            <IconButton
                onClick={toggleCamera}
                sx={{ color: "common.white", mx: 1 }}
            >
                {cameraOn ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <IconButton
                onClick={toggleMic}
                sx={{ color: "common.white", mx: 1 }}
            >
                {micOn ? <Mic /> : <MicOff />}
            </IconButton>
            <IconButton
                onClick={handleStopCall}
                sx={{
                color: "error.main",
                bgcolor: "common.white",
                mx: 1,
                }}
            >
                <CallEnd />
            </IconButton>
            </Box>

            {/* Participants */}
            <IconButton sx={{ color: "common.white" }}>
            <Group />
            </IconButton>
        </Box>
        </Box>
        </>
    );
}