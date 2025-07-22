import React, { ChangeEvent, JSX, useEffect, useRef, useState } from 'react';
import {
  Tabs, Tab, TextField, IconButton, Button,
  List, ListItem, ListItemAvatar, Avatar,
  ListItemText, Typography, Box, Dialog,
  DialogTitle, DialogContent, DialogActions, CircularProgress,
  ListItemButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import * as S from './ChatCenter.styles';
import { useChatCenter } from '../../hooks/ChatCenter.hooks';
import { ChatCenterProps } from '../../interfaces/ChatCenter.types';

export function ChatCenter({ userId, onLeave }: ChatCenterProps): JSX.Element {
  const {
    rooms, roomsLoading, roomsError, selectedRoom,
    messages, isConnected, isCallPopup, guestCaller,retryRooms,
    selectRoom, sendMessage, leaveRoom,
    handleAcceptCall, handleDeclineCall, openCallWindow,
  } = useChatCenter(userId);

  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState('');
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  return (
    <>
      <Dialog open={isCallPopup} disableEscapeKeyDown>
        <DialogTitle>Incoming Call</DialogTitle>
        <DialogContent>
          <Typography>{guestCaller} is calling…</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeclineCall}>Decline</Button>
          <Button variant="contained" onClick={handleAcceptCall}>Accept</Button>
        </DialogActions>
      </Dialog>

      <S.Container elevation={8}>
        { !selectedRoom ? (
          <>
            <S.SearchContainer>
              <TextField
                fullWidth size="small" placeholder="Search..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon fontSize="small" /> }}
              />
              <Tabs value={tab} onChange={(_, i) => setTab(i)} variant="fullWidth" sx={{ mb:1 }}>
                <Tab label="All" />
                <Tab label="Unread" />
                <Tab label="Groups" />
              </Tabs>
            </S.SearchContainer>

          {roomsLoading && (
            <S.LoadingContainer>
              <CircularProgress />
            </S.LoadingContainer>
          )}

          {roomsError && !roomsLoading && (
            <S.ErrorContainer>
              <Typography color="error" sx={{ mb:1 }}>{roomsError}</Typography>
              <Button variant="outlined" onClick={retryRooms}>Retry</Button>
            </S.ErrorContainer>
          )}

          {!roomsLoading && !roomsError && (
            <S.RoomsList disablePadding>
              {rooms
                .filter(r => r.room.toLowerCase().includes(filter.toLowerCase()))
                .map(({room, users}) => (
                  <ListItemButton key={room} onClick={() => selectRoom(room)}>
                    <ListItemAvatar>
                      <Avatar>{room[0].toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={room}
                      secondary={`${users.length} user${users.length !== 1 ? 's':''}`}
                    />
                  </ListItemButton>
                ))
              }
            </S.RoomsList>
          )}
          </>
        ) : (
          <S.ChatContainer>
            <S.Header>
              <Button size="small" onClick={leaveRoom} startIcon={<ArrowBackIcon/>}>
                Back
              </Button>
              <Typography variant="subtitle1">{selectedRoom}</Typography>
              <IconButton onClick={openCallWindow} color="primary">
                <VideoCallIcon />
              </IconButton>
            </S.Header>

            <S.MessagesContainer>
              {messages.map((m,i) =>
                m.isSystemMessage ? (
                  <S.SystemMessage key={i} variant="caption" color="textSecondary">
                    {m.text}
                  </S.SystemMessage>
                ) : (
                  <S.MessageRow key={i} justifyContent={m.isMe ? 'flex-end':'flex-start'}>
                    {!m.isMe && <Avatar src={m.avatar} sx={{ mr:1, width:32, height:32 }}/>}
                    <Box>
                      <Typography variant="subtitle2">
                        {m.isMe ? 'You' : m.username}
                      </Typography>
                      <S.MessageBubble sx={{ bgcolor: m.isMe ? 'primary.main':'grey.800',
                                                color: m.isMe ? 'primary.contrastText':'common.white' }}>
                        {m.text}
                      </S.MessageBubble>
                    </Box>
                    {m.isMe && <Avatar src={m.avatar} sx={{ ml:1, width:32, height:32 }}/>}
                  </S.MessageRow>
                )
              )}
            </S.MessagesContainer>

            <S.InputContainer>
              <TextField
                fullWidth size="small" placeholder="Type a message…"
                value={text}
                onChange={(e: ChangeEvent<HTMLInputElement>)=>setText(e.target.value)}
              />
              <IconButton onClick={()=>{ sendMessage(text); setText(''); }} disabled={!isConnected} color="primary">
                <SendIcon />
              </IconButton>
            </S.InputContainer>
          </S.ChatContainer>
        )}
      </S.Container>
    </>
  );
}
