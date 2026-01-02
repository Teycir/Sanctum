// ============================================================================
// WEBRTC CAPABILITY DETECTION
// ============================================================================

export function isWebRTCSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
}

export function isP2PTAvailable(): boolean {
  return isWebRTCSupported() && typeof WebSocket !== 'undefined';
}
