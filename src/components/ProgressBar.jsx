import { useState, useEffect } from 'react';
import { Loader, X } from 'lucide-react';

export default function ProgressBar({ progress, state, onCancel, startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="progress-section">
      <div className="progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span className="progress-phase">{progress.phase}</span>
        </div>
        <div className="progress-stats">
          <span>{formatTime(elapsed)}</span>
          {progress.total > 0 && <span>{Math.round(pct)}%</span>}
          <button className="btn-cancel" onClick={onCancel}>
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-current-url">{progress.currentUrl}</div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
