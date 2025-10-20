"use client";

export default function SimplePage() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0,
      padding: 0,
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <iframe
        src="https://youtube.com/embed/QHDKlPYvfHU?autoplay=1&mute=1&playsinline=1&controls=1"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}


