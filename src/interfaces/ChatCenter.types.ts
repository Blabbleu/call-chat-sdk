// Props and domain types for ChatCenter
export interface ChatCenterProps {
  userId: string;
  onLeave?: () => void;
}

export interface RoomInfo {
  room: string;
  users: string[];
}

export interface ChatMessage {
  username: string;
  text: string;
  avatar: string;
  isMe: boolean;
  isSystemMessage?: boolean;
}
