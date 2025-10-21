"use client";
import { useState, useEffect, useRef, memo } from "react";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  isMuted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  hideControls?: boolean;
}

function VideoPlayer({ streamUrl, title, isMuted: muteState, onMuteChange, hideControls = false }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [localMuted, setLocalMuted] = useState(true); // Local state for when not controlled
  const [showSplash, setShowSplash] = useState(true);
  const [isChangingMute, setIsChangingMute] = useState(false); // Visual feedback
  const [playerReady, setPlayerReady] = useState(false); // Track if player is ready
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const splashVideoRef = useRef<HTMLVideoElement>(null);
  
  // Use controlled state if provided, otherwise use local state
  const isMuted = muteState !== undefined ? muteState : localMuted;
  
  // Store stream URL globally for YouTube viewer count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { currentStreamUrl?: string }).currentStreamUrl = streamUrl;
    }
  }, [streamUrl]);

  // Force play splash video on mobile and Base app
  useEffect(() => {
    if (showSplash && splashVideoRef.current) {
      const playVideo = async () => {
        try {
          if (!splashVideoRef.current) return;
          
          // Reset video to ensure clean state
          splashVideoRef.current.pause();
          splashVideoRef.current.currentTime = 0;
          
          // Set all required attributes for mobile/miniapp
          splashVideoRef.current.setAttribute('playsinline', 'true');
          splashVideoRef.current.setAttribute('webkit-playsinline', 'true');
          splashVideoRef.current.setAttribute('x5-playsinline', 'true');
          splashVideoRef.current.setAttribute('x5-video-player-type', 'h5');
          splashVideoRef.current.setAttribute('x5-video-player-fullscreen', 'false');
          splashVideoRef.current.muted = true;
          splashVideoRef.current.defaultMuted = true;
          splashVideoRef.current.volume = 0;
          splashVideoRef.current.autoplay = true;
          
          // Load the video first
          splashVideoRef.current.load();
          
          // Try multiple play attempts
          const attemptPlay = async () => {
            try {
              if (!splashVideoRef.current) return;
              const playPromise = splashVideoRef.current.play();
              if (playPromise !== undefined) {
                await playPromise;
                console.log('Splash video playing successfully');
              }
            } catch (error) {
              console.log('Play attempt failed:', error);
              // Try again after a short delay
              setTimeout(attemptPlay, 500);
            }
          };
          
          // Start play attempts
          attemptPlay();
        } catch (error) {
          console.log('Splash video error:', error);
        }
      };
      
      // Multiple initialization attempts for better compatibility
      playVideo();
      setTimeout(playVideo, 200);
      setTimeout(playVideo, 500);
      
      // Also handle video events
      if (splashVideoRef.current) {
        splashVideoRef.current.onloadedmetadata = playVideo;
        splashVideoRef.current.oncanplay = playVideo;
        
        // For iOS/Safari - sometimes needs user interaction simulation
        const touchHandler = () => {
          if (splashVideoRef.current && splashVideoRef.current.paused) {
            splashVideoRef.current.play().catch(() => {});
          }
        };
        
        document.addEventListener('touchstart', touchHandler, { once: true });
        document.addEventListener('click', touchHandler, { once: true });
        
        return () => {
          document.removeEventListener('touchstart', touchHandler);
          document.removeEventListener('click', touchHandler);
        };
      }
    }
  }, [showSplash]);

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
          console.log('📺 iframe loaded, marking player as ready');
          setPlayerReady(true);
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

  // Attempt #8: Fix actual sound state sync issues
  const toggleMute = () => {
    // Show visual feedback
    setIsChangingMute(true);
    
    if (iframeRef.current?.contentWindow) {
      // IMPORTANT: YouTube player is ALWAYS muted on load (mute=1 in URL)
      // So actual state might be out of sync with our UI state
      
      if (!playerReady) {
        console.log('⚠️ Player not ready yet, queuing toggle');
        // If player not ready, just update UI state
        const newMutedState = !isMuted;
        if (onMuteChange) {
          onMuteChange(newMutedState);
        } else {
          setLocalMuted(newMutedState);
        }
        setIsChangingMute(false);
        return;
      }
      
      // For first click when no sound (but UI shows unmuted), we need to actually unmute
      const shouldUnmute = isMuted || !playerReady;
      const newMutedState = !isMuted;
      
      console.log(`🎵 [Attempt #8] Toggle: UI shows ${isMuted ? 'muted' : 'unmuted'}, action: ${shouldUnmute ? 'unmute' : 'mute'}`);
      
      // Create a function to send commands reliably
      const sendCommand = (command: string, retries = 5, delay = 100) => {
        let attempt = 0;
        const send = () => {
          if (attempt < retries && iframeRef.current?.contentWindow) {
            console.log(`🎵 Sending command (attempt ${attempt + 1}/${retries}):`, command);
            iframeRef.current.contentWindow.postMessage(command, '*');
            attempt++;
            if (attempt < retries) {
              setTimeout(send, delay);
            }
          }
        };
        send();
      };
      
      if (shouldUnmute) {
        // Unmuting - Attempt #8 with proper state handling
        console.log('🔊 [Attempt #8] Unmuting YouTube player...');
        
        // First, ensure player is playing
        sendCommand('{"event":"command","func":"playVideo","args":""}', 2, 50);
        
        // Then unmute with multiple retries
        setTimeout(() => {
          sendCommand('{"event":"command","func":"unMute","args":""}', 5, 150);
        }, 100);
        
        // Set volume to max after unmuting
        setTimeout(() => {
          sendCommand('{"event":"command","func":"setVolume","args":[100]}', 3, 100);
        }, 500);
        
        // Final unmute attempt
        setTimeout(() => {
          sendCommand('{"event":"command","func":"unMute","args":""}', 2, 100);
        }, 1000);
        
      } else {
        // Muting - need to actually send mute command
        console.log('🔇 [Attempt #8] Muting YouTube player...');
        // Send mute command multiple times to ensure it works
        sendCommand('{"event":"command","func":"mute","args":""}', 5, 100);
        
        // Also try setting volume to 0 as backup
        setTimeout(() => {
          sendCommand('{"event":"command","func":"setVolume","args":[0]}', 3, 100);
        }, 300);
      }
      
      // Update state immediately for UI responsiveness
      if (onMuteChange) {
        onMuteChange(newMutedState);
      } else {
        setLocalMuted(newMutedState);
      }
      
      // Save preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('streamMuted', String(newMutedState));
      }
      
      // Hide feedback after commands are sent
      setTimeout(() => {
        setIsChangingMute(false);
      }, 1500);
    } else {
      console.warn('🚫 iframe not ready for mute toggle');
      setIsChangingMute(false);
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
    
    // Facebook Live support
    if (url.includes("facebook.com") && url.includes("/videos/")) {
      // If it's already a plugin URL, return as is
      if (url.includes("/plugins/video.php")) return url;
      
      // Convert regular Facebook video URL to embed
      const encodedUrl = encodeURIComponent(url);
      return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=1280`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(streamUrl);
  const isYouTube = embedUrl.includes("youtube.com/embed");
  const isTwitch = embedUrl.includes("twitch.tv");
  const isFacebook = embedUrl.includes("facebook.com/plugins/video.php");

  // For non-iframe compatible streams, show video element
  if (error && !isYouTube && !isTwitch && !isFacebook) {
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

  const handleSplashClick = () => {
    setShowSplash(false);
  };

  return (
    <div className={styles.videoWrapper}>
      {showSplash ? (
        <div className={styles.splashContainer} onClick={handleSplashClick}>
          <video
            ref={splashVideoRef}
            className={styles.splashVideo}
            autoPlay={true}
            muted={true}
            loop={true}
            playsInline={true}
            controls={false}
            poster="/clicknpray-preview.png"
            preload="auto"
            {...({'webkit-playsinline': 'true'} as React.VideoHTMLAttributes<HTMLVideoElement>)}
          >
            <source src="/splash.mp4" type="video/mp4" />
          </video>
          <div className={styles.splashOverlay} style={{
            backgroundImage: 'url(/clicknpray-preview.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: splashVideoRef.current?.readyState === 4 ? 0 : 1,
            transition: 'opacity 0.3s'
          }} />
          <div className={styles.playPrompt}>Tap to start stream</div>
        </div>
      ) : (
        <>
          <iframe
            ref={iframeRef}
            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&loop=1&enablejsapi=1&cc_load_policy=0&autohide=1&widget_referrer=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            className={styles.streamPlayer}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title={title}
            loading="eager"
            style={{ visibility: showSplash ? 'hidden' : 'visible' }}
          />
          <div className={styles.clickBlocker} aria-hidden="true" />
        </>
      )}
      {!hideControls && !showSplash && (
        <button 
          className={`${styles.muteButton} ${isChangingMute ? styles.changing : ''}`}
          onClick={toggleMute}
          disabled={isChangingMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          title={isChangingMute ? "Changing..." : (isMuted ? "Click to unmute" : "Click to mute")}
        >
          {isChangingMute ? '⏳' : (isMuted ? '🔇' : '🔊')}
        </button>
      )}
    </div>
  );
}

export default memo(VideoPlayer);
