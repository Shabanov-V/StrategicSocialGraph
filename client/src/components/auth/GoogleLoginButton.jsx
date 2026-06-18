import React, { useEffect, useRef, useState } from 'react';

export default function GoogleLoginButton({ onCredential, clientId }) {
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(!!window.google?.accounts);

  useEffect(() => {
    if (gsiReady) return;
    const interval = setInterval(() => {
      if (window.google?.accounts) {
        setGsiReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gsiReady]);

  useEffect(() => {
    if (!clientId || !gsiReady) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        onCredential(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
    });
  }, [clientId, onCredential, gsiReady]);

  return <div ref={buttonRef} />;
}
