import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SocketAction,
  BaseSocketMessage,
  ChatMessage as SocketChatMessage,
  GetAllMessagesMessage,
} from '../../interface/Message';
import { SERVER_API_SOCKET_ENDPOINT } from '../../constant/index';
import { RoomInfo, ChatMessage } from './ChatCenter.types';

/**
 * Hook encapsulating room-list  chat logic.
 */
export function useChatCenter(userId: string) {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallPopup, setIsCallPopup] = useState(false);
  const [guestCaller, setGuestCaller] = useState<string | null>(null);

  const wsRooms = useRef<WebSocket | null>(null);
  const wsChat  = useRef<WebSocket | null>(null);

  // — Fetch live room list —
  // encapsulate room‐list WebSocket into a callable fetch  retry
  const fetchRooms = useCallback(() => {
    setRoomsLoading(true);
    setRoomsError(null);

    const ws = new WebSocket(`${SERVER_API_SOCKET_ENDPOINT}room-info-endpoint`);
    ws.onopen = () => ws.send(JSON.stringify({ action: SocketAction.GET_ROOM_UPDATE }));
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as BaseSocketMessage & { data: { rooms: RoomInfo[] } };
        if (msg.action === SocketAction.ROOM_UPDATE) {
          setRooms(msg.data.rooms);
          setRoomsLoading(false);
        }
      } catch {
        setRoomsError('Failed to parse room data');
        setRoomsLoading(false);
      }
    };
    ws.onerror = () => {
      setRoomsError('Failed to connect to room service');
      setRoomsLoading(false);
    };
    wsRooms.current = ws;
    return () => {
      try {
        ws.close();
      } catch (err) {
        // ignore “closed before open” in StrictMode dev double-invoke
      }
    };
  }, []);

  // initial fetch  cleanup
  useEffect(() => {
    const cleanup = fetchRooms();
    return () => {
      cleanup();
    };
  }, [fetchRooms]);

  // — Join / switch chat room —
  useEffect(() => {
    if (!selectedRoom) return;
    const ws = new WebSocket(
      `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint?roomId=${selectedRoom}&user=${userId}`
    );
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ action: SocketAction.USER_JOIN, data: { username: userId, text: '' } }));
      ws.send(JSON.stringify({ action: SocketAction.GET_ALL_MESSAGES, data: {} }));
    };

    ws.onmessage = e => {
      const msg = JSON.parse(e.data) as BaseSocketMessage;
      handleSocketMessage(msg);
    }

    ws.onclose = () => setIsConnected(false);
    wsChat.current = ws;
    return () => ws.close();
  }, [selectedRoom, userId]);

  // — Handlers —
    // recursive, typed message processor
  const handleSocketMessage = useCallback((msg: BaseSocketMessage) => {
    if (msg.action === SocketAction.GET_ALL_MESSAGES) {
      // try top-level `datas` first, then `msg.data.datas`
      const rawArr: unknown =
        Array.isArray((msg as any).datas) ? (msg as any).datas :
        null;

      if (Array.isArray(rawArr)) {
        (rawArr as string[]).forEach(raw => {
          try {
            const historic = JSON.parse(raw) as BaseSocketMessage;
            handleSocketMessage(historic);
          } catch {
            // ignore bad JSON
          }
        });
      }
      return;
    }
    // now handle individual live messages
    switch (msg.action) {
      case SocketAction.SEND_MESSAGE: {
        const d = msg as SocketChatMessage;
        setMessages(prev => [
          ...prev,
          {
            username: d.data.username,
            text:     d.data.text,
            avatar:   d.data.avatar ?? '',
            isMe:     d.data.username === userId,
          }
        ]);
        break;
      }
      case SocketAction.USER_JOIN:
        setMessages(prev => [
          ...prev,
          { username: 'System', text: `${msg.data.username} joined`, avatar: '', isSystemMessage: true, isMe: false }
        ]);
        break;
      case SocketAction.USER_LEAVE:
        setMessages(prev => [
          ...prev,
          { username: 'System', text: `${msg.data.username} left`, avatar: '', isSystemMessage: true, isMe: false }
        ]);
        break;
      case SocketAction.START_CALL:
        setMessages(prev => [
          ...prev,
          { username: 'System', text: `${msg.data.username} started a call…`, avatar: '', isSystemMessage: true, isMe: false }
        ]);
        setGuestCaller(msg.data.username);
        setIsCallPopup(true);
        break;
      case SocketAction.END_CALL:
        setIsCallPopup(false);
        break;
      case SocketAction.FULL_CALL_ROOM:
        setMessages(prev => [
          ...prev,
          { username: 'System', text: 'Call room is full', avatar: '', isSystemMessage: true, isMe: false }
        ]);
        setIsCallPopup(false);
        break;
    }
  }, [userId]);

  const selectRoom = useCallback((room: string) => {
    setSelectedRoom(room);
    setMessages([]);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!wsChat.current || !text.trim()) return;
    const payload = { action: SocketAction.SEND_MESSAGE, data: { username: userId, text } } as SocketChatMessage;
    wsChat.current.send(JSON.stringify(payload));
    setMessages(prev => [...prev, { username: userId, text, avatar: '', isMe: true }]);
  }, [userId]);

  const leaveRoom = useCallback(() => {
    if (wsChat.current) {
      wsChat.current.send(JSON.stringify({ action: SocketAction.USER_LEAVE, data: { username: userId, text: '' } }));
      wsChat.current.close();
    }
    setSelectedRoom(null);
  }, [userId]);

  const handleAcceptCall = useCallback(() => {
    wsChat.current?.send(JSON.stringify({ action: SocketAction.START_CALL, data: { username: userId, text: '' } }));
    window.open(`/call?roomId=${selectedRoom}&userId=${userId}`, '_blank');
    setIsCallPopup(false);
  }, [selectedRoom, userId]);

  const handleDeclineCall = useCallback(() => {
    wsChat.current?.send(JSON.stringify({ action: SocketAction.END_CALL, data: { username: userId, text: '' } }));
    setIsCallPopup(false);
  }, [userId]);

  const openCallWindow = useCallback(() => {
    if (!selectedRoom) return;
    wsChat.current?.send(JSON.stringify({
      action: SocketAction.START_CALL,
      data: { username: userId, text: "" }
    }));
    // open in a new tab (_blank) with noopener for security
    window.open(
      `/call?roomId=${selectedRoom}&userId=${userId}`,
      "_blank",
      "noopener,noreferrer"
    );
    console.log("opening call");
  }, [selectedRoom, userId]);

  return {
    rooms,
    roomsLoading,
    roomsError,
    selectedRoom,
    messages,
    isConnected,
    isCallPopup,
    guestCaller,
    selectRoom,
    sendMessage,
    leaveRoom,
    handleAcceptCall,
    handleDeclineCall,
    retryRooms: fetchRooms,
    openCallWindow,
  };
}
