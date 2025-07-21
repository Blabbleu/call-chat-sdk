import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Typography,
  DialogContent,
} from "@mui/material";
import { Call, CallEnd } from "@mui/icons-material";

interface CallPopupProps {
  open: boolean;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const CallPopup: React.FC<CallPopupProps> = ({ open, callerName, onAccept, onDecline }) => {
  return (
    <Dialog open={open} onClose={onDecline} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold" align="center">
          Incoming Call
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" align="center">
          {callerName} is calling...
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button variant="contained" color="success" startIcon={<Call />} onClick={onAccept}>
          Accept
        </Button>
        <Button variant="contained" color="error" startIcon={<CallEnd />} onClick={onDecline}>
          Decline
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CallPopup;
