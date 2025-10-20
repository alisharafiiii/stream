"use client";
import { useMiniKit, useAuthenticate } from "@coinbase/onchainkit/minikit";
import { useBaseAuth } from "../hooks/useBaseAuth";
import { useState } from "react";

export default function DebugPage() {
  const { context } = useMiniKit();
  const baseAuth = useBaseAuth();
  const { signIn: nativeSignIn } = useAuthenticate();
  const [result, setResult] = useState<unknown>(null);

  const testBaseAuth = async () => {
    const authResult = await baseAuth.signIn();
    setResult(authResult);
  };

  const testNativeAuth = async () => {
    try {
      const authResult = await nativeSignIn();
      setResult(authResult);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#000', 
      color: '#fff', 
      minHeight: '100vh',
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      <h1>Debug Information</h1>
      
      <section>
        <h2>MiniKit Status</h2>
        <pre>{JSON.stringify({
          contextAvailable: !!context,
          hasUser: !!context?.user,
          fid: context?.user?.fid,
          username: context?.user?.username,
          displayName: context?.user?.displayName,
        }, null, 2)}</pre>
      </section>

      <section>
        <h2>Base Auth Status</h2>
        <pre>{JSON.stringify({
          isLoading: baseAuth.isLoading,
          error: baseAuth.error,
          user: baseAuth.user,
        }, null, 2)}</pre>
      </section>

      <section>
        <h2>Actions</h2>
        <button 
          onClick={testNativeAuth}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          Test Native Sign In (Modal)
        </button>
        <button 
          onClick={testBaseAuth}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Test Base Auth (Wrapped)
        </button>
      </section>

      {result !== null && (
        <section>
          <h2>Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      <section>
        <h2>Environment</h2>
        <pre>{JSON.stringify({
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          isBaseApp: typeof window !== 'undefined' && window.navigator.userAgent.includes('Base'),
          url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        }, null, 2)}</pre>
      </section>
    </div>
  );
}
