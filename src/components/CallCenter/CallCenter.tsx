import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Typography, Avatar, Box, CircularProgress, FormControlLabel, Switch
} from '@mui/material';
import {
  Fullscreen, FullscreenExit, Settings, Videocam, VideocamOff,
  Mic, MicOff, CallEnd, Group
} from '@mui/icons-material';
import * as S from './CallCenter.styles';
import { useCallCenter } from '../../hooks/CallCenter.hooks';

export default function CallCenter() {
  const {
    isConnecting, connectionError, isInCall,
    isCallPopup, guestCaller, showConfirm,
    isFullScreen, cameraOn, micOn, callTime, remoteJoined,
    localVideoRef, remoteVideoRef, ringtoneRef, localStream,
    handleConfirmYes, handleConfirmNo,
    handleAcceptCall, handleDeclineCall,
    handleStopCall, toggleCamera, toggleMic, toggleFullScreen,
    formatTime,
  } = useCallCenter();

    useEffect(() => {
    const vid = localVideoRef.current;
    if (vid && localStream && isInCall) {
      vid.srcObject = localStream;
      vid.play().catch(() => {});
    }
  }, [localStream, isInCall]);

  if (connectionError) {
    return (
      <S.Container elevation={2}>
        <Typography color="error">{connectionError}</Typography>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </S.Container>
    );
  }

  return (
    <>
      {/* Ringtone */}
      <audio ref={ringtoneRef} src="/ringtone.mp3" loop preload="auto" style={{ display:'none' }}/>

      {/* Confirm start */}
      <Dialog open={showConfirm} disableEscapeKeyDown>
        <DialogTitle>Start Call</DialogTitle>
        <DialogContent>
          <Typography>Do you want to start the call?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmNo}>No</Button>
          <Button variant="contained" onClick={handleConfirmYes}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* Incoming popup */}
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

      <S.Container>
        {/* Fullscreen toggle */}
        <S.Header>
          <IconButton onClick={toggleFullScreen} sx={{ color:'common.white' }}>
            {isFullScreen ? <FullscreenExit/> : <Fullscreen/>}
          </IconButton>
        </S.Header>

        {/* Main video or placeholders */}
        <S.VideoContainer>
          {!isInCall ? (
            <Button variant="contained" color="primary" onClick={handleConfirmYes}>
              {isConnecting ? <CircularProgress size={20} color="inherit"/> : 'Start Call'}
            </Button>
          ) : (
            remoteJoined
              ? <video ref={remoteVideoRef} autoPlay playsInline muted={!micOn} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <Avatar sx={{width:100,height:100,bgcolor:'grey.700'}}/>
          )}
        </S.VideoContainer>

        {/* PiP local */}
        {isInCall && (
          <S.PiPVideo
            ref={localVideoRef}
            autoPlay muted playsInline
            style={{ opacity: cameraOn ? 1 : 0 }}
          />
        )}

        {/* Controls */}
        <S.ControlsBar>
          <IconButton sx={{color:'common.white'}}><Settings/></IconButton>

          <Box>
            <IconButton onClick={() => { console.log('BTN click'); toggleCamera(); }} sx={{ color:'common.white' }}>
              {cameraOn ? <Videocam/> : <VideocamOff/>}
            </IconButton>
            <IconButton onClick={toggleMic} sx={{ color:'common.white' }}>
              {micOn ? <Mic/> : <MicOff/>}
            </IconButton>
            <IconButton onClick={handleStopCall} sx={{ color:'error.main', bgcolor:'common.white', mx:1 }}>
              <CallEnd/>
            </IconButton>
          </Box>

          <IconButton sx={{color:'common.white'}}><Group/></IconButton>
        </S.ControlsBar>
      </S.Container>
    </>
  );
}
