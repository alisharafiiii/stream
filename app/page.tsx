"use client";
import { useEffect } from "react";

export default function Home() {
  // Redirect to V2
  useEffect(() => {
    window.location.href = '/v2';
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      Redirecting to V2...
    </div>
  );
}
