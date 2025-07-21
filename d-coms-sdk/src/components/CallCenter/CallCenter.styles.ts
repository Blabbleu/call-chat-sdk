import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export const Container = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.grey[900],
  overflow: 'hidden',
  zIndex: 1300,
}));

export const Header = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 2,
}));

export const VideoContainer = styled(Box)(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const PiPVideo = styled('video')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(10),
  right: theme.spacing(2),
  width: 120,
  height: 120,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
  objectFit: 'cover',
  zIndex: 3,
}));

export const ControlsBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1),
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  zIndex: 2,
}));
