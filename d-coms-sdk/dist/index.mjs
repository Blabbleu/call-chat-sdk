// src/ChatCenter.tsx
import { useEffect, useRef, useState } from "react";
import {
  Typography,
  Paper,
  CircularProgress,
  Button,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Box,
  ListItemButton,
  Badge,
  IconButton,
  InputAdornment,
  Tabs,
  Tab
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// src/constant/index.ts
var SERVER_API_SOCKET_ENDPOINT = "ws://10.166.2.137:8080/";

// src/ChatCenter.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function ChatCenter({ userId, onLeave }) {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [isVideoTab, setIsVideoTab] = useState(false);
  const [isCallPopup, setIsCallPopup] = useState(false);
  const [guestCaller, setGuestCaller] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    setRoomsLoading(true);
    setTimeout(() => {
      setRooms([
        { id: "general", name: "General Chat" },
        { id: "project-x", name: "Project X" },
        { id: "random", name: "Random" }
      ]);
    }, 300);
  }, [userId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!selectedRoomId) return;
    setIsLoading(true);
    const ws = new WebSocket(
      `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint?roomId=${selectedRoomId}&user=${userId}`
    );
    let timeout = window.setTimeout(() => {
      ws.close();
      setConnectionFailed(true);
      setIsLoading(false);
    }, 5e3);
    ws.onopen = () => {
      clearTimeout(timeout);
      setIsConnected(true);
      setIsLoading(false);
      const joinMsg = {
        action: "USER_JOIN" /* USER_JOIN */,
        data: { username: userId, text: "" }
      };
      ws.send(JSON.stringify(joinMsg));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleSocketMessage(msg);
    };
    ws.onclose = () => {
      setIsConnected(false);
    };
    socketRef.current = ws;
    return () => {
      ws.close();
    };
  }, [selectedRoomId, userId]);
  function handleSocketMessage(msg) {
    switch (msg.action) {
      case "SEND_MESSAGE" /* SEND_MESSAGE */:
        setMessages((prev) => [...prev, msg.data]);
        break;
      case "USER_JOIN" /* USER_JOIN */:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: `${msg.data.username} joined`, isSystemMessage: true }
        ]);
        break;
      case "USER_LEAVE" /* USER_LEAVE */:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: `${msg.data.username} left`, isSystemMessage: true }
        ]);
        break;
      case "START_CALL" /* START_CALL */:
        setGuestCaller(msg.data.username);
        setIsCallPopup(true);
        break;
      case "END_CALL" /* END_CALL */:
        setIsVideoTab(false);
        setIsCallPopup(false);
        break;
      case "FULL_CALL_ROOM" /* FULL_CALL_ROOM */:
        setMessages((prev) => [
          ...prev,
          { username: "System", text: "Call room is full", isSystemMessage: true }
        ]);
        setIsCallPopup(false);
        break;
    }
  }
  function sendMessage() {
    if (!messageText.trim() || !socketRef.current) return;
    const chatMsg = {
      action: "SEND_MESSAGE" /* SEND_MESSAGE */,
      data: { username: userId, text: messageText }
    };
    socketRef.current.send(JSON.stringify(chatMsg));
    setMessages((prev) => [...prev, { ...chatMsg.data, isMe: true }]);
    setMessageText("");
  }
  function leaveRoom() {
    if (socketRef.current) {
      const leaveMsg = {
        action: "USER_LEAVE" /* USER_LEAVE */,
        data: { username: userId, text: "" }
      };
      socketRef.current.send(JSON.stringify(leaveMsg));
      socketRef.current.close();
    }
    setSelectedRoomId(null);
  }
  function handleAccept() {
    setIsCallPopup(false);
    setIsVideoTab(true);
  }
  function handleDecline() {
    setIsCallPopup(false);
  }
  return /* @__PURE__ */ jsxs(
    Paper,
    {
      elevation: 8,
      sx: {
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 300,
        height: 500,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.paper"
      },
      children: [
        /* @__PURE__ */ jsxs(Box, { sx: { px: 1, pt: 1, bgcolor: "background.default" }, children: [
          /* @__PURE__ */ jsxs(
            Tabs,
            {
              value: 0,
              onChange: () => {
              },
              variant: "fullWidth",
              textColor: "inherit",
              indicatorColor: "primary",
              sx: { mb: 1 },
              children: [
                /* @__PURE__ */ jsx(Tab, { label: "All" }),
                /* @__PURE__ */ jsx(Tab, { label: "Unread" }),
                /* @__PURE__ */ jsx(Tab, { label: "Groups" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              fullWidth: true,
              size: "small",
              placeholder: "Search...",
              onChange: (e) => {
              },
              InputProps: {
                startAdornment: /* @__PURE__ */ jsx(InputAdornment, { position: "start", children: /* @__PURE__ */ jsx(SearchIcon, { fontSize: "small" }) })
              },
              sx: { bgcolor: "background.paper", borderRadius: 1 }
            }
          )
        ] }),
        !selectedRoomId ? (
          // — ROOM LIST —
          /* @__PURE__ */ jsx(Box, { sx: { flex: 1, overflowY: "auto" }, children: roomsLoading ? /* @__PURE__ */ jsx(
            Box,
            {
              sx: {
                flex: 1,
                // take up available space
                display: "flex",
                justifyContent: "center",
                // horizontal center
                alignItems: "center"
                // vertical center
              },
              children: /* @__PURE__ */ jsx(CircularProgress, {})
            }
          ) : roomsError ? /* @__PURE__ */ jsx(Typography, { color: "error", children: roomsError }) : /* @__PURE__ */ jsx(List, { disablePadding: true, children: rooms.map((room) => /* @__PURE__ */ jsxs(
            ListItemButton,
            {
              selected: room.id === selectedRoomId,
              onClick: () => setSelectedRoomId(room.id),
              sx: { py: 1 },
              children: [
                /* @__PURE__ */ jsx(ListItemAvatar, { children: /* @__PURE__ */ jsx(Avatar, { children: room.name[0] }) }),
                /* @__PURE__ */ jsx(
                  ListItemText,
                  {
                    primary: room.name,
                    secondary: "Last message preview\u2026",
                    primaryTypographyProps: { noWrap: true },
                    secondaryTypographyProps: { noWrap: true, variant: "caption" }
                  }
                ),
                /* @__PURE__ */ jsx(Badge, { badgeContent: 3, color: "primary" }),
                " "
              ]
            },
            room.id
          )) }) })
        ) : (
          // — CHAT VIEW —
          /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsxs(
              Box,
              {
                sx: {
                  p: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                },
                children: [
                  /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", children: selectedRoomId }),
                  /* @__PURE__ */ jsx(Button, { size: "small", onClick: leaveRoom, startIcon: /* @__PURE__ */ jsx(ArrowBackIcon, {}), children: "Back" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, overflowY: "auto", p: 1 }, children: [
              messages.map((m, i) => /* @__PURE__ */ jsx(
                Box,
                {
                  display: "flex",
                  justifyContent: m.isMe ? "flex-end" : "flex-start",
                  mb: 1,
                  children: /* @__PURE__ */ jsxs(
                    Paper,
                    {
                      sx: {
                        p: 1.5,
                        bgcolor: m.isMe ? "primary.main" : "grey.800",
                        color: m.isMe ? "primary.contrastText" : "common.white",
                        borderRadius: 2,
                        maxWidth: "80%"
                      },
                      children: [
                        /* @__PURE__ */ jsx(Typography, { children: m.text }),
                        /* @__PURE__ */ jsx(Typography, { variant: "caption", align: "right", display: "block" })
                      ]
                    }
                  )
                },
                i
              )),
              /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
            ] }),
            /* @__PURE__ */ jsxs(
              Box,
              {
                sx: {
                  p: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center"
                },
                children: [
                  /* @__PURE__ */ jsx(
                    TextField,
                    {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Type a message\u2026",
                      value: messageText,
                      onChange: (e) => setMessageText(e.target.value)
                    }
                  ),
                  /* @__PURE__ */ jsx(IconButton, { color: "primary", onClick: sendMessage, children: /* @__PURE__ */ jsx(SendIcon, {}) })
                ]
              }
            )
          ] })
        )
      ]
    }
  );
}
export {
  ChatCenter
};
