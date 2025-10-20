"use client";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading test page...</div>;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>Mini App Test Page</h1>
      <p>If you can see this, the app is loading!</p>
      <div style={{ marginTop: '20px' }}>
        <iframe
          width="560"
          height="315"
          src="https://youtube.com/embed/QHDKlPYvfHU?autoplay=1&mute=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}


