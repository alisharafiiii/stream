"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
}

export default function VideoPlayer({ streamUrl, title }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Store stream URL globally for YouTube viewer count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { currentStreamUrl?: string }).currentStreamUrl = streamUrl;
    }
  }, [streamUrl]);

  useEffect(() => {
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
          // Send a sequence of commands to ensure autoplay
          const commands = [
            '{"event":"command","func":"mute","args":""}',
            '{"event":"command","func":"playVideo","args":""}',
            '{"event":"command","func":"unMute","args":""}',
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
  }, [streamUrl]);

  // Check if it's a YouTube URL and convert to embed format
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
        style={{ aspectRatio: '16/9' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
      />
      <div className={styles.clickBlocker} aria-hidden="true" />
    </div>
  );
}
