'use client';

import { useEffect, useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let listeners: ((toast: Toast) => void)[] = [];

export function toast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2);
  listeners.forEach((fn) => fn({ id, type, message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'i',
  };

  const colors = {
    success: 'border-l-4 border-l-green-600',
    error: 'border-l-4 border-l-red-600',
    info: 'border-l-4 border-l-black',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-up pointer-events-auto flex items-center gap-3 bg-white border border-neutral-200 shadow-lg rounded px-4 py-3 min-w-[260px] max-w-[360px] ${colors[t.type]}`}
        >
          <span
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'error'
                ? 'bg-red-600'
                : 'bg-black'
            }`}
          >
            {icons[t.type]}
          </span>
          <p className="text-sm text-neutral-800 font-medium leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
