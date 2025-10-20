"use client";
import styles from "./OfflineVideo.module.css";

export default function OfflineVideo() {
  // Use a public domain video or your own fallback video
  const fallbackVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
  
  return (
    <div className={styles.offlineWrapper}>
      <div className={styles.blurOverlay}>
        <video
          className={styles.blurredVideo}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={fallbackVideoUrl} type="video/mp4" />
        </video>
      </div>
      <div className={styles.offlineContent}>
        <div className={styles.offlineIcon}>📺</div>
        <h2 className={styles.offlineTitle}>Stream Offline</h2>
        <p className={styles.offlineText}>
          The stream is currently offline. Check back later!
        </p>
      </div>
    </div>
  );
}
