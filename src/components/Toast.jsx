import { useEffect } from 'react';

export default function Toast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div className={`toast ${visible ? 'visible' : ''}`}>
      {message}
    </div>
  );
}
