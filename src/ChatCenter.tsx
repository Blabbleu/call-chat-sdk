// import React, { JSX, useEffect, useRef, useState, ChangeEvent } from "react";
// import {
//   Container,
//   Typography,
//   Paper,
//   CircularProgress,
//   Button,
//   List,
//   ListItem,
//   ListItemAvatar,
//   Avatar,
//   ListItemText,
//   TextField,
//   Switch,
//   Box,
//   ListItemButton,
//   Badge,
//   IconButton,
//   InputAdornment,
//   Tabs,
//   Tab,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
  
// } from "@mui/material";
// import VideoCallIcon from "@mui/icons-material/VideoCall";
// import SearchIcon from "@mui/icons-material/Search";
// import SendIcon from "@mui/icons-material/Send";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { useTheme } from "@mui/material/styles";
// import {
//   BaseSocketMessage,
//   ChatMessage,
//   CallStartMessage,
//   CallEndMessage,
//   FullCallRoomMessage,
//   UserJoinMessage,
//   UserLeaveMessage,
//   Message,
//   SocketAction,
// } from "./interface/Message";
// import { SERVER_API_SOCKET_ENDPOINT } from "./constant/index";

// export interface ChatCenterProps {
//   userId: string;
//   onLeave?: () => void;
// }

// export function ChatCenter({ userId, onLeave }: ChatCenterProps): JSX.Element {
//   // Room list state
//   interface RoomInfo { room: string; users: string[] }
//   const [rooms, setRooms] = useState<RoomInfo[]>([]);
//   const [roomsLoading, setRoomsLoading] = useState(true);
//   const [roomsError, setRoomsError] = useState<string | null>(null);
//   const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

//   // Chat state
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [messageText, setMessageText] = useState<string>("");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [isConnected, setIsConnected] = useState<boolean>(false);
//   const [connectionFailed, setConnectionFailed] = useState<boolean>(false);



//   const [isCallPopup, setIsCallPopup] = useState<boolean>(false);
//   const [guestCaller, setGuestCaller] = useState<string | null>(null);
  
//   // Refs
//   const socketRef = useRef<WebSocket | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
  

//   // Fetch rooms for this user
//   useEffect(() => {
//     const ws = new WebSocket(
//       `${SERVER_API_SOCKET_ENDPOINT}room-info-endpoint`
//     );

//     ws.onopen = () => {
//       // ask server to send the current rooms
//       ws.send(JSON.stringify({ action: SocketAction.GET_ROOM_UPDATE }));
//     };

//     ws.onmessage = (evt) => {
//       try {
//         const msg = JSON.parse(evt.data) as BaseSocketMessage & {
//           data: { rooms: RoomInfo[] };
//         };
//         if (
//           msg.action === SocketAction.ROOM_UPDATE &&
//           Array.isArray(msg.data.rooms)
//         ) {
//           setRooms(msg.data.rooms);
//           setRoomsLoading(false);
//           setRoomsError(null);
//         }
//       } catch {
//         setRoomsError("Failed to parse room data");
//         setRoomsLoading(false);
//       }
//     };

//     ws.onerror = () => {
//       setRoomsError("WebSocket error");
//       setRoomsLoading(false);
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);
  

//   // Auto-scroll on new message
//   useEffect(() => {
//     const container = messagesEndRef.current;
//     if (container) {
//       container.scrollTop = container.scrollHeight;
//     }
//   }, [selectedRoomId, messages]);

//   // Connect to selected room
//   useEffect(() => {
//     if (!selectedRoomId) return;

//     const ws = new WebSocket(
//       `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint?roomId=${selectedRoomId}&user=${userId}`
//     );
//     socketRef.current = ws;

//     let openTimeout = window.setTimeout(() => {
//       console.error("WebSocket open timeout");
//       ws.close();
//     }, 5000);

//     ws.onopen = () => {
//       clearTimeout(openTimeout);
//       console.log("💬 Chat socket opened");
//       setIsConnected(true);
//       // announce yourself
//       ws.send(JSON.stringify({
//         action: SocketAction.USER_JOIN,
//         data: { username: userId, text: "" }
//       }));
//       ws.send(JSON.stringify({
//       action: SocketAction.GET_ALL_MESSAGES,
//       data: {}
//     }));
//     };

//     ws.onmessage = (e) => {
//       try {
//         const msg = JSON.parse(e.data) as BaseSocketMessage & any;
//         messageDataProcess(msg);
//       } catch (err) {
//         console.error("Invalid WS message", err);
//       }
//     };
//     ws.onclose = () => {
//       console.log("Chat socket closed");
//       setIsConnected(false);
//     };

//     return () => {
//       clearTimeout(openTimeout);
//       ws.close();
//     };
//   }, [selectedRoomId, userId]);

// function messageDataProcess(message: BaseSocketMessage & any) {
//   switch (message.action) {
//     case SocketAction.GET_ALL_MESSAGES:
//       if (Array.isArray(message.datas)) {
//         // each entry is a JSON‐string of a BaseSocketMessage
//         message.datas.forEach((raw: string) => {
//           const historic = JSON.parse(raw) as BaseSocketMessage & any;
//           messageDataProcess(historic);
//         });
//       }
//       break;

//     case SocketAction.SEND_MESSAGE:
//       setMessages(prev => [...prev, 
//         {
//           ...message.data,
//           avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${userId}`,
//           isMe: message.data.username === userId
//         }
//       ]);
//       break;

//     case SocketAction.USER_JOIN:
//       setMessages(prev => [
//         ...prev,
//         { 
//           username: "System", 
//           avatar: "",
//           text: `${message.data.username} joined`, 
//           isSystemMessage: true }
//       ]);
//       break;

//     case SocketAction.USER_LEAVE:
//       setMessages(prev => [
//         ...prev,
//         { username: "System", avatar: "", text: `${message.data.username} left`, isSystemMessage: true }
//       ]);
//       break;

//     case SocketAction.START_CALL:
//       setGuestCaller(message.data.username);
//       setIsCallPopup(true);
//       break;

//     case SocketAction.END_CALL:
//       setIsCallPopup(false);
//       break;

//     case SocketAction.FULL_CALL_ROOM:
//       setMessages(prev => [
//         ...prev,
//         { username: "System", text: "Call room is full", isSystemMessage: true }
//       ]);
//       setIsCallPopup(false);
//       break;

//     default:
//       console.warn("Unhandled socket action:", message.action);
//   }
// }

//   function sendMessage() {
//     console.log("Trying to send:", messageText, socketRef.current);
//     if (!messageText.trim() || !socketRef.current) return;

//     const payload: ChatMessage = {
//       action: SocketAction.SEND_MESSAGE,
//       data: { username: userId, text: messageText },
//     };
//     socketRef.current.send(JSON.stringify(payload));
//     setMessages(prev => [...prev, { ...payload.data, isMe: true }]);
//     setMessageText("");
//   }

//   function leaveRoom() {
//     if (socketRef.current) {
//       const leaveMsg: UserLeaveMessage = {
//         action: SocketAction.USER_LEAVE,
//         data: { username: userId, text: "" },
//       };
//       socketRef.current.send(JSON.stringify(leaveMsg));
//       socketRef.current.close();
//     }
//     setSelectedRoomId(null);
//   }

//   const handleAcceptCall = () => {
//     // tell server you’ve picked up
//     const startMsg: CallStartMessage = {
//       action: SocketAction.START_CALL,
//       data: { username: userId, text: "" },
//     };
//     socketRef.current?.send(JSON.stringify(startMsg));

//     // open the same call page
//     window.open(
//       `/call?roomId=${selectedRoomId}&userId=${userId}`,
//       "_blank"
//     );
//     setIsCallPopup(false);
//   };

//   const handleDeclineCall = () => {
//     // let the caller know you declined
//     const endMsg: CallEndMessage = {
//       action: SocketAction.END_CALL,
//       data: { username: userId, text: "" },
//     };
//     socketRef.current?.send(JSON.stringify(endMsg));
//     setIsCallPopup(false);
//   };


  
//   const openCallWindow = () => {
//     if (!selectedRoomId) return;
//     // 1) notify others you’re calling
//     const startMsg: CallStartMessage = {
//       action: SocketAction.START_CALL,
//       data: { username: userId, text: "" },
//     };
//     socketRef.current?.send(JSON.stringify(startMsg));

//     // 2) open the dedicated CallCenter page
//     window.open(
//       `/call?roomId=${selectedRoomId}&userId=${userId}`,
//       "_blank"
//     );
//   };


//   // Chat UI view
//   return (
//     <>
//       {/* — Incoming Call Popup — */}
//       <Dialog open={isCallPopup} disableEscapeKeyDown>
//         <DialogTitle>Incoming Call</DialogTitle>
//         <DialogContent>
//           <Typography>{guestCaller} is calling you…</Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleDeclineCall}>Decline</Button>
//           <Button variant="contained" onClick={handleAcceptCall}>
//             Accept
//           </Button>
//         </DialogActions>
//       </Dialog>
//       <Paper
//         elevation={8}
//         sx={{
//           position: "fixed",
//           bottom: 24,
//           right: 24,
//           width: 300,
//           height: 500,
//           borderRadius: 2,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//           bgcolor: "background.paper",
//         }}
//       >
//         {/* …header, tabs, list, footer… */}
//         {/* Header: Tabs  Search */}
//         {!selectedRoomId && (
//           <Box sx={{ px: 1, pt: 1, bgcolor: "background.default" }}>
//             <TextField
//               fullWidth
//               size="small"
//               placeholder="Search..."
//               onChange={(e) => {
//                 /* filter your rooms/messages here */
//               }}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon fontSize="small" />
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{ bgcolor: "background.paper", borderRadius: 1 }}
//             />
//             <Tabs
//               value={0}
//               onChange={() => {}}
//               variant="fullWidth"
//               textColor="inherit"
//               indicatorColor="primary"
//               sx={{ mb: 1 }}
//             >
//               <Tab label="All" />
//               <Tab label="Unread" />
//               <Tab label="Groups" />
//             </Tabs>
//           </Box>
//         )}
//         {/* Body */}
//         {!selectedRoomId ? (
//           // — ROOM LIST (live via WebSocket) —
//           <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
//             {roomsLoading ? (
//               <Box
//                 sx={{
//                   height: "100%",
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                 }}
//               >
//                 <CircularProgress />
//               </Box>
//             ) : roomsError ? (
//               <Typography color="error" sx={{ p: 2 }}>
//                 {roomsError}
//               </Typography>
//             ) : (
//               <List disablePadding>
//                 {rooms.map(({ room, users }) => (
//                   <ListItemButton
//                     key={room}
//                     onClick={() => setSelectedRoomId(room)}
//                     sx={{ py: 1 }}
//                   >
//                     <ListItemAvatar>
//                       <Avatar>{room.charAt(0).toUpperCase()}</Avatar>
//                     </ListItemAvatar>
//                     <ListItemText
//                       primary={room}
//                       secondary={`${users.length} user${users.length !== 1 ? "s" : ""}`}
//                     />
//                   </ListItemButton>
//                 ))}
//               </List>
//             )}
//           </Box>
//         ) : (
//           // — CHAT VIEW —
//           <Box sx={{
//                 flex: 1, display: "flex", flexDirection: "column", minHeight: 0
//               }}>
//             {/* Chat header */}
//             <Box
//               sx={{
//                 p: 1,
//                 borderBottom: 1,
//                 borderColor: "divider",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Button size="small" onClick={leaveRoom} startIcon={<ArrowBackIcon />}>
//                 Back
//               </Button>
//               <Typography variant="subtitle1">{selectedRoomId}</Typography>
//               {/* — or — an icon-only button */}
//               <IconButton onClick={openCallWindow} size="small" color="primary">
//                 <VideoCallIcon />
//               </IconButton>
//             </Box>
//             {/* Messages scroll area */}
//             <Box ref={messagesEndRef} sx={{ flex: 1, overflowY: "auto", p: 1 }}>
//               {messages.map((m, i) =>
//                 m.isSystemMessage ? (
//                   // — plain system text —
//                   <Box key={i} sx={{ width: "100%", textAlign: "center", mb: 1 }}>
//                     <Typography
//                       variant="caption"
//                       color="textSecondary"
//                       sx={{ fontStyle: "italic" }}
//                     >
//                       {m.text}
//                     </Typography>
//                   </Box>
//                 ) : (
//                   // — normal user bubble —
//                   <Box
//                     key={i}
//                     display="flex"
//                     alignItems="flex-start"
//                     justifyContent={m.isMe ? "flex-end" : "flex-start"}
//                     mb={1}
//                   >
//                     {!m.isMe && (
//                       <Avatar
//                         src={m.avatar}
//                         alt={m.username}
//                         sx={{ width: 32, height: 32, mr: 1 }}
//                       />
//                     )}
//                     <Box maxWidth="80%">
//                       <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
//                         {m.isMe ? "You" : m.username}
//                       </Typography>
//                       <Paper
//                         sx={{
//                           p: 1.5,
//                           bgcolor: m.isMe ? "primary.main" : "grey.800",
//                           color: m.isMe ? "primary.contrastText" : "common.white",
//                           borderRadius: 2,
//                         }}
//                       >
//                         <Typography>{m.text}</Typography>
//                         <Typography variant="caption" align="right" display="block">
//                           {/* timestamp */}
//                         </Typography>
//                       </Paper>
//                     </Box>
//                     {m.isMe && (
//                       <Avatar
//                         src={m.avatar}
//                         alt={m.username}
//                         sx={{ width: 32, height: 32, ml: 1 }}
//                       />
//                     )}
//                   </Box>
//                 )
//               )}
//             </Box>
//             {/* Input bar */}
//             <Box
//               sx={{
//                 p: 1,
//                 borderTop: 1,
//                 borderColor: "divider",
//                 display: "flex",
//                 alignItems: "center",
//               }}
//             >
//               <TextField
//                 fullWidth
//                 size="small"
//                 placeholder="Type a message…"
//                 value={messageText}
//                 onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                   setMessageText(e.target.value)
//                 }
//               />
//               <IconButton
//                 color="primary"
//                 onClick={sendMessage}      // ← not a stale function reference!
//                 disabled={!isConnected}    // optional: grey out until ready
//               >
//                 <SendIcon />
//               </IconButton>
//             </Box>
//           </Box>
//         )}
//       </Paper>
//     </>
//   );
// }
