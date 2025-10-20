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
        src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=0&playsinline=1&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&loop=1`}
        className={styles.streamPlayer}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={title}
        loading="eager"
        sandbox="allow-same-origin allow-scripts allow-presentation"
        style={{ aspectRatio: '16/9' }}
      />
    </div>
  );
}
