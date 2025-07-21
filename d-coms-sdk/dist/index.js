"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  ChatCenter: () => ChatCenter
});
module.exports = __toCommonJS(index_exports);

// src/ChatCenter.tsx
var import_react = require("react");
var import_material = require("@mui/material");
var import_Search = __toESM(require("@mui/icons-material/Search"));
var import_Send = __toESM(require("@mui/icons-material/Send"));
var import_ArrowBack = __toESM(require("@mui/icons-material/ArrowBack"));

// src/constant/index.ts
var SERVER_API_SOCKET_ENDPOINT = "ws://10.166.2.137:8080/";

// src/ChatCenter.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ChatCenter({ userId, onLeave }) {
  const [rooms, setRooms] = (0, import_react.useState)([]);
  const [roomsLoading, setRoomsLoading] = (0, import_react.useState)(true);
  const [roomsError, setRoomsError] = (0, import_react.useState)(null);
  const [selectedRoomId, setSelectedRoomId] = (0, import_react.useState)(null);
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [messageText, setMessageText] = (0, import_react.useState)("");
  const [isLoading, setIsLoading] = (0, import_react.useState)(false);
  const [isConnected, setIsConnected] = (0, import_react.useState)(false);
  const [connectionFailed, setConnectionFailed] = (0, import_react.useState)(false);
  const [isVideoTab, setIsVideoTab] = (0, import_react.useState)(false);
  const [isCallPopup, setIsCallPopup] = (0, import_react.useState)(false);
  const [guestCaller, setGuestCaller] = (0, import_react.useState)(null);
  const socketRef = (0, import_react.useRef)(null);
  const messagesEndRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    setRoomsLoading(true);
    setTimeout(() => {
      setRooms([
        { id: "general", name: "General Chat" },
        { id: "project-x", name: "Project X" },
        { id: "random", name: "Random" }
      ]);
    }, 300);
  }, [userId]);
  (0, import_react.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_material.Paper,
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_material.Box, { sx: { px: 1, pt: 1, bgcolor: "background.default" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            import_material.Tabs,
            {
              value: 0,
              onChange: () => {
              },
              variant: "fullWidth",
              textColor: "inherit",
              indicatorColor: "primary",
              sx: { mb: 1 },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Tab, { label: "All" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Tab, { label: "Unread" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Tab, { label: "Groups" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_material.TextField,
            {
              fullWidth: true,
              size: "small",
              placeholder: "Search...",
              onChange: (e) => {
              },
              InputProps: {
                startAdornment: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.InputAdornment, { position: "start", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Search.default, { fontSize: "small" }) })
              },
              sx: { bgcolor: "background.paper", borderRadius: 1 }
            }
          )
        ] }),
        !selectedRoomId ? (
          // — ROOM LIST —
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Box, { sx: { flex: 1, overflowY: "auto" }, children: roomsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_material.Box,
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
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.CircularProgress, {})
            }
          ) : roomsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Typography, { color: "error", children: roomsError }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.List, { disablePadding: true, children: rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            import_material.ListItemButton,
            {
              selected: room.id === selectedRoomId,
              onClick: () => setSelectedRoomId(room.id),
              sx: { py: 1 },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.ListItemAvatar, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Avatar, { children: room.name[0] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_material.ListItemText,
                  {
                    primary: room.name,
                    secondary: "Last message preview\u2026",
                    primaryTypographyProps: { noWrap: true },
                    secondaryTypographyProps: { noWrap: true, variant: "caption" }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Badge, { badgeContent: 3, color: "primary" }),
                " "
              ]
            },
            room.id
          )) }) })
        ) : (
          // — CHAT VIEW —
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_material.Box, { sx: { flex: 1, display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              import_material.Box,
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
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Typography, { variant: "subtitle1", children: selectedRoomId }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Button, { size: "small", onClick: leaveRoom, startIcon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ArrowBack.default, {}), children: "Back" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_material.Box, { sx: { flex: 1, overflowY: "auto", p: 1 }, children: [
              messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_material.Box,
                {
                  display: "flex",
                  justifyContent: m.isMe ? "flex-end" : "flex-start",
                  mb: 1,
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    import_material.Paper,
                    {
                      sx: {
                        p: 1.5,
                        bgcolor: m.isMe ? "primary.main" : "grey.800",
                        color: m.isMe ? "primary.contrastText" : "common.white",
                        borderRadius: 2,
                        maxWidth: "80%"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Typography, { children: m.text }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.Typography, { variant: "caption", align: "right", display: "block" })
                      ]
                    }
                  )
                },
                i
              )),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: messagesEndRef })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              import_material.Box,
              {
                sx: {
                  p: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_material.TextField,
                    {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Type a message\u2026",
                      value: messageText,
                      onChange: (e) => setMessageText(e.target.value)
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_material.IconButton, { color: "primary", onClick: sendMessage, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Send.default, {}) })
                ]
              }
            )
          ] })
        )
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatCenter
});
