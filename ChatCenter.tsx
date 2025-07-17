import React, { JSX, useEffect, useRef, useState, ChangeEvent } from "react";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Switch,
  Box,
  ListItemButton,
  Badge,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import {
  BaseSocketMessage,
  ChatMessage,
  CallStartMessage,
  CallEndMessage,
  FullCallRoomMessage,
  UserJoinMessage,
  UserLeaveMessage,
  Message,
  SocketAction,
} from "../interface/Message";
import { SERVER_API_SOCKET_ENDPOINT } from "../constant/index";

export interface ChatCenterProps {
  userId: string;
  onLeave?: () => void;
}

export function ChatCenter({ userId, onLeave }: ChatCenterProps): JSX.Element {
  // Room list state
  interface RoomInfo { room: string; users: string[] }
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionFailed, setConnectionFailed] = useState<boolean>(false);
  const [isVideoTab, setIsVideoTab] = useState<boolean>(false);
  const [isCallPopup, setIsCallPopup] = useState<boolean>(false);
  const [guestCaller, setGuestCaller] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch rooms for this user
  useEffect(() => {
    const ws = new WebSocket(
      `${SERVER_API_SOCKET_ENDPOINT}room-info-endpoint`
    );

    ws.onopen = () => {
      // ask server to send the current rooms
      ws.send(JSON.stringify({ action: SocketAction.GET_ROOM_UPDATE }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as BaseSocketMessage & {
          data: { rooms: RoomInfo[] };
        };
        if (
          msg.action === SocketAction.ROOM_UPDATE &&
          Array.isArray(msg.data.rooms)
        ) {
          setRooms(msg.data.rooms);
          setRoomsLoading(false);
          setRoomsError(null);
        }
      } catch {
        setRoomsError("Failed to parse room data");
        setRoomsLoading(false);
      }
    };

    ws.onerror = () => {
      setRoomsError("WebSocket error");
      setRoomsLoading(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect to selected room
  useEffect(() => {
  if (!selectedRoomId) return;

  const ws = new WebSocket(
    `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint?roomId=${selectedRoomId}&user=${userId}`
  );
  socketRef.current = ws;

  let openTimeout = window.setTimeout(() => {
    console.error("WebSocket open timeout");
    ws.close();
  }, 5000);

  ws.onopen = () => {
    clearTimeout(openTimeout);
    console.log("💬 Chat socket opened");
    setIsConnected(true);
    // announce yourself
    ws.send(JSON.stringify({
      action: SocketAction.USER_JOIN,
      data: { username: userId, text: "" }
    }));
  };

  ws.onmessage = (e) => {
    console.log("← chat message", e.data);
    const msg: BaseSocketMessage = JSON.parse(e.data);
    handleSocketMessage(msg);
  };

  ws.onclose = () => {
    console.log("Chat socket closed");
    setIsConnected(false);
  };

  return () => {
    clearTimeout(openTimeout);
    ws.close();
  };
}, [selectedRoomId, userId]);

  function handleSocketMessage(msg: BaseSocketMessage) {
    switch (msg.action) {
      case SocketAction.SEND_MESSAGE:
        setMessages((prev) => [...prev, msg.data]);
        break;
      case SocketAction.USER_JOIN:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: `${msg.data.username} joined`, isSystemMessage: true } as Message,
        ]);
        break;
      case SocketAction.USER_LEAVE:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: `${msg.data.username} left`, isSystemMessage: true } as Message,
        ]);
        break;
      case SocketAction.START_CALL:
        setGuestCaller(msg.data.username);
        setIsCallPopup(true);
        break;
      case SocketAction.END_CALL:
        setIsVideoTab(false);
        setIsCallPopup(false);
        break;
      case SocketAction.FULL_CALL_ROOM:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: "Call room is full", isSystemMessage: true } as Message,
        ]);
        setIsCallPopup(false);
        break;
    }
  }

  function sendMessage() {
    console.log("Trying to send:", messageText, socketRef.current);
    if (!messageText.trim() || !socketRef.current) return;

    const payload: ChatMessage = {
      action: SocketAction.SEND_MESSAGE,
      data: { username: userId, text: messageText },
    };
    socketRef.current.send(JSON.stringify(payload));
    setMessages(prev => [...prev, { ...payload.data, isMe: true }]);
    setMessageText("");
  }

  function leaveRoom() {
    if (socketRef.current) {
      const leaveMsg: UserLeaveMessage = {
        action: SocketAction.USER_LEAVE,
        data: { username: userId, text: "" },
      };
      socketRef.current.send(JSON.stringify(leaveMsg));
      socketRef.current.close();
    }
    setSelectedRoomId(null);
  }

  function handleAccept() {
    setIsCallPopup(false);
    setIsVideoTab(true);
    // Implement call setup...
  }

  function handleDecline() {
    setIsCallPopup(false);
  }


  // Chat UI view
  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 300,
        height: 500,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* …header, tabs, list, footer… */}
    {/* Header: Tabs + Search */}
      <Box sx={{ px: 1, pt: 1, bgcolor: "background.default" }}>
        <Tabs
          value={0}                   // you can wire this up to state if you support filtering
          onChange={() => {}}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="primary"
          sx={{ mb: 1 }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
          <Tab label="Groups" />
        </Tabs>

        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          onChange={(e) => {
            /* filter your rooms/messages here */
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "background.paper", borderRadius: 1 }}
        />
      </Box>

    {/* Body */}
    {!selectedRoomId ? (
      // — ROOM LIST (live via WebSocket) —
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {roomsLoading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : roomsError ? (
          <Typography color="error" sx={{ p: 2 }}>
            {roomsError}
          </Typography>
        ) : (
          <List disablePadding>
            {rooms.map(({ room, users }) => (
              <ListItemButton
                key={room}
                onClick={() => setSelectedRoomId(room)}
                sx={{ py: 1 }}
              >
                <ListItemAvatar>
                  <Avatar>{room.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={room}
                  secondary={`${users.length} user${users.length !== 1 ? "s" : ""}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    ) : (
      // — CHAT VIEW —
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Chat header */}
        <Box
          sx={{
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">{selectedRoomId}</Typography>
          <Button size="small" onClick={leaveRoom} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </Box>

        {/* Messages scroll area */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
          {messages.map((m, i) => (
            <Box
              key={i}
              display="flex"
              justifyContent={m.isMe ? "flex-end" : "flex-start"}
              mb={1}
            >
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: m.isMe ? "primary.main" : "grey.800",
                  color: m.isMe ? "primary.contrastText" : "common.white",
                  borderRadius: 2,
                  maxWidth: "80%",
                }}
              >
                <Typography>{m.text}</Typography>
                <Typography variant="caption" align="right" display="block">
                  {/* you can wire in a timestamp here */}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input bar */}
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message…"
            value={messageText}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMessageText(e.target.value)
            }
          />
          <IconButton
            color="primary"
            onClick={sendMessage}      // ← not a stale function reference!
            disabled={!isConnected}    // optional: grey out until ready
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    )}



    </Paper>

  );
}
