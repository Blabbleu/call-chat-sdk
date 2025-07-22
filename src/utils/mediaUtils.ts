/**
 * Formats time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Checks if the browser supports WebRTC
 * @returns Boolean indicating WebRTC support
 */
export const isWebRTCSupported = (): boolean => {
  return !!(
    window.RTCPeerConnection &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

/**
 * Gets available media devices
 * @returns Promise resolving to available devices
 */
export const getAvailableDevices = async (): Promise<MediaDeviceInfo[]> => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error('Media devices enumeration not supported');
  }
  
  return navigator.mediaDevices.enumerateDevices();
};

/**
 * Gets user media with error handling
 * @param constraints - Media constraints
 * @returns Promise resolving to media stream
 */
export const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Failed to get user media:', error);
    throw new Error(`Media access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Stops all tracks in a media stream
 * @param stream - Media stream to stop
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

/**
 * Toggles a specific track type in a media stream
 * @param stream - Media stream
 * @param trackType - Type of track to toggle ('video' or 'audio')
 * @returns New enabled state
 */
export const toggleTrack = (stream: MediaStream | null, trackType: 'video' | 'audio'): boolean => {
  if (!stream) return false;

  const tracks = trackType === 'video' 
    ? stream.getVideoTracks()
    : stream.getAudioTracks();

  if (tracks.length > 0) {
    const track = tracks[0];
    track.enabled = !track.enabled;
    return track.enabled;
  }

  return false;
};

/**
 * Checks if a track type is enabled in a media stream
 * @param stream - Media stream
 * @param trackType - Type of track to check ('video' or 'audio')
 * @returns Boolean indicating if track is enabled
 */
export const isTrackEnabled = (stream: MediaStream | null, trackType: 'video' | 'audio'): boolean => {
  if (!stream) return false;

  const tracks = trackType === 'video' 
    ? stream.getVideoTracks()
    : stream.getAudioTracks();

  return tracks.length > 0 && tracks[0].enabled;
};

/**
 * Creates a default media constraints object
 * @param video - Enable video
 * @param audio - Enable audio
 * @returns Media constraints
 */
export const createMediaConstraints = (
  video: boolean | MediaTrackConstraints = true,
  audio: boolean | MediaTrackConstraints = true
): MediaStreamConstraints => {
  return { video, audio };
};

/**
 * Handles fullscreen functionality
 */
export const toggleFullscreen = async (): Promise<boolean> => {
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  } else {
    try {
      await document.exitFullscreen();
      return false;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      return true;
    }
  }
};
