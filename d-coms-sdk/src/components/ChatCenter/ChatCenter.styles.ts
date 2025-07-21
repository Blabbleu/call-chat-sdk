import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

export const Container = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  width: 300,
  height:500,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

export const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const LoadingContainer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

export const ErrorContainer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const RoomsList = styled(List)(() => ({
  overflowY: 'auto',
  flex: 1,
}));

export const ChatContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

export const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

export const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: 8,
}));

export const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
}));

export const MessageRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
}));

export const MessageBubble = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '100%',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
}));

export const SystemMessage = styled(Typography)(({ theme }) => ({
  display: 'block', 
  width: '100%',                
  textAlign: 'center',             
  fontStyle: 'italic',
  margin: `${theme.spacing(1)} 0`,
}));
