'use client';

// The web stand-in for mymatcher's showAlert action sheet: one host mounted
// in Providers, opened from anywhere with showAlert().
import { useEffect, useState } from 'react';
import { Modal } from './ui';

export type AlertButton = { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void | Promise<void> };
type Alert = { title: string; message?: string; buttons: AlertButton[] };

let open: ((a: Alert | null) => void) | null = null;

export function showAlert(title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) {
  open?.({ title, message, buttons });
}

export function DialogHost() {
  const [alert, setAlert] = useState<Alert | null>(null);
  useEffect(() => {
    open = setAlert;
    return () => { open = null; };
  }, []);
  if (!alert) return null;
  const close = () => setAlert(null);
  return (
    <Modal title={alert.title} onClose={close}>
      {alert.message && <p className="muted" style={{ marginBottom: 12 }}>{alert.message}</p>}
      <div className="menu">
        {alert.buttons.map((b) => (
          <button
            key={b.text}
            className={b.style === 'destructive' ? 'danger-text' : b.style === 'cancel' ? 'muted' : undefined}
            onClick={() => {
              // Close first: a handler may open the next dialog.
              close();
              b.onPress?.();
            }}
          >
            {b.text}
          </button>
        ))}
      </div>
    </Modal>
  );
}
