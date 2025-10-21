"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  isMuted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  hideControls?: boolean;
}

export default function VideoPlayer({ streamUrl, title, isMuted: muteState, onMuteChange, hideControls = false }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [localMuted, setLocalMuted] = useState(true); // Local state for when not controlled
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Use controlled state if provided, otherwise use local state
  const isMuted = muteState !== undefined ? muteState : localMuted;
  
  // Store stream URL globally for YouTube viewer count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { currentStreamUrl?: string }).currentStreamUrl = streamUrl;
    }
  }, [streamUrl]);

  useEffect(() => {
    // Listen for YouTube player messages (for debugging)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('youtube.com') && event.data) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.event === 'infoDelivery' && data.info) {
            console.log('YouTube Player Info:', data.info);
          }
        } catch {
          // Ignore non-JSON messages
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Try to play video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.log("Autoplay failed, user interaction may be required:", e);
      });
    }
    
    // Enhanced YouTube autoplay for Base app
    if (iframeRef.current && streamUrl.includes('youtube')) {
      let attempts = 0;
      const maxAttempts = 10;
      
      const forceYouTubePlay = () => {
        if (attempts >= maxAttempts) return;
        attempts++;
        
        if (iframeRef.current?.contentWindow) {
          // Always start muted for autoplay compliance
          const commands = [
            '{"event":"command","func":"mute","args":""}',
            '{"event":"command","func":"playVideo","args":""}'
          ];
          
          commands.forEach((cmd, i) => {
            setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage(cmd, '*');
            }, i * 200);
          });
          
          // Retry after delay
          if (attempts < maxAttempts) {
            setTimeout(forceYouTubePlay, 2000);
          }
        }
      };
      
      // Start attempts after iframe loads
      setTimeout(forceYouTubePlay, 1000);
      
      // Also try on iframe load
      if (iframeRef.current) {
        iframeRef.current.onload = () => {
          setTimeout(forceYouTubePlay, 500);
        };
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [streamUrl]); // Remove isMuted to prevent reloading on toggle

  // Handle unmute after user preference changes
  useEffect(() => {
    if (!isMuted && iframeRef.current?.contentWindow) {
      // User wants sound, unmute the player
      setTimeout(() => {
        console.log('🔊 Auto-unmuting based on user preference...');
        const unmuteCommand = '{"event":"command","func":"unMute","args":""}';
        const volumeCommand = '{"event":"command","func":"setVolume","args":[100]}';
        
        iframeRef.current?.contentWindow?.postMessage(unmuteCommand, '*');
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(volumeCommand, '*');
        }, 200);
      }, 2000); // Wait for player to be ready
    }
  }, [isMuted]);

  // Check if it's a YouTube URL and convert to embed format
  const toggleMute = () => {
    const newMutedState = !isMuted;
    
    if (iframeRef.current?.contentWindow) {
      // More robust unmute/mute approach
      if (isMuted) {
        // Unmuting - try multiple approaches
        console.log('🔊 Attempting to unmute YouTube player...');
        
        // First, set volume to ensure it's not 0
        const volumeCommand = '{"event":"command","func":"setVolume","args":[100]}';
        iframeRef.current.contentWindow.postMessage(volumeCommand, '*');
        
        // Then unmute
        const unmuteCommand = '{"event":"command","func":"unMute","args":""}';
        
        // Send commands multiple times with delays
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(unmuteCommand, '*');
        }, 50);
        
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(volumeCommand, '*');
          iframeRef.current?.contentWindow?.postMessage(unmuteCommand, '*');
        }, 150);
        
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(unmuteCommand, '*');
        }, 300);
        
        // Final attempt with volume
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(volumeCommand, '*');
          iframeRef.current?.contentWindow?.postMessage(unmuteCommand, '*');
        }, 500);
        
      } else {
        // Muting
        console.log('🔇 Muting YouTube player...');
        const muteCommand = '{"event":"command","func":"mute","args":""}';
        
        iframeRef.current.contentWindow.postMessage(muteCommand, '*');
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(muteCommand, '*');
        }, 100);
      }
    }
    
    // Update state
    if (onMuteChange) {
      onMuteChange(newMutedState);
    } else {
      setLocalMuted(newMutedState);
    }
  };

  const getEmbedUrl = (url: string) => {
    // Already an embed URL
    if (url.includes("embed")) return url;
    
    // Convert YouTube watch URLs to embed
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    // Convert YouTube live URLs to embed
    if (url.includes("youtube.com/live")) {
      const videoId = url.split("/live/")[1]?.split("?")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    // Convert youtu.be URLs to embed
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(streamUrl);
  const isYouTube = embedUrl.includes("youtube.com/embed");
  const isTwitch = embedUrl.includes("twitch.tv");

  // For non-iframe compatible streams, show video element
  if (error && !isYouTube && !isTwitch) {
    return (
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.videoPlayer}
          controls
          autoPlay
          muted
          playsInline
          loop
          onError={() => setError(true)}
        >
          <source src={streamUrl} type="video/mp4" />
          <source src={streamUrl} type="video/webm" />
          <source src={streamUrl} type="application/x-mpegURL" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className={styles.videoWrapper}>
      <iframe
        ref={iframeRef}
        src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&loop=1&enablejsapi=1&cc_load_policy=0&autohide=1&playerapiid=ytplayer&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        className={styles.streamPlayer}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        title={title}
        loading="eager"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
      />
      <div className={styles.clickBlocker} aria-hidden="true" />
      {!hideControls && (
        <button 
          className={styles.muteButton}
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          title={isMuted ? "Click to unmute" : "Click to mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}
    </div>
  );
}
