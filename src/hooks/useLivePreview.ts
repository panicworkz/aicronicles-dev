'use client';
import { useEffect, useState } from 'react';

export function useLivePreview<T>({ initialData }: { initialData: T }): { data: T } {
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'payload-live-preview'
      ) {
        if (event.data.data) {
          setData(event.data.data);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'payload-live-preview', ready: true }, '*');
      }
    } catch (_) {}

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { data };
}
