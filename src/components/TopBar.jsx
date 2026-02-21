import { Activity, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function TopBar({ viewMode, siteName, onBack }) {
  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <div className="logo-section">
          <Activity size={24} className="logo-icon" />
          <div>
            <div className="logo-title">Website Health Dashboard</div>
            <div className="logo-subtitle">Visibility Engine</div>
          </div>
        </div>

        {viewMode === 'site' && (
          <div className="top-bar-right">
            {siteName && <span className="top-bar-site-name">{siteName}</span>}
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <LayoutDashboard size={14} /> All Sites
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
