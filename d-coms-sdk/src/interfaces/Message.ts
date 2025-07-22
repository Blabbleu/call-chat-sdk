export interface Message {
  username: string;
  text: string;
  avatar?: string;
  isMe?: boolean;
  isSystemMessage?: boolean;
}

export interface BaseSocketMessage {
  action: SocketAction;
  data: Message;
  datas?: string[];
  a: ()=>string;
}

export interface UserJoinMessage extends BaseSocketMessage {
  action: SocketAction.USER_JOIN;
}

export interface UserLeaveMessage extends BaseSocketMessage {
  action: SocketAction.USER_LEAVE;
}

export interface FullCallRoomMessage extends BaseSocketMessage {
  action: SocketAction.FULL_CALL_ROOM;
}

export interface GetAllMessagesMessage extends BaseSocketMessage {
  action: SocketAction.GET_ALL_MESSAGES;
  /** each entry is a JSON‐string of a prior BaseSocketMessage */
  datas: string[];
}

export interface ChatMessage extends BaseSocketMessage {
  text: string;
  avatar: string;
  username: string;
  action: SocketAction.SEND_MESSAGE;
}

export interface CallStartMessage extends BaseSocketMessage {
  action: SocketAction.START_CALL;
}

export interface CallEndMessage extends BaseSocketMessage {
  action: SocketAction.END_CALL;
}

export enum SocketAction {
  USER_JOIN = "USER_JOIN",
  USER_LEAVE = "USER_LEAVE",
  SEND_MESSAGE = "SEND_MESSAGE",
  START_CALL = "START_CALL",
  END_CALL = "END_CALL",
  ROOM_UPDATE = "ROOM_UPDATE",
  GET_ROOM_UPDATE = "GET_ROOM_UPDATE",
  GET_ALL_MESSAGES = "GET_ALL_MESSAGES",
  FULL_CALL_ROOM = "FULL_CALL_ROOM",
}
