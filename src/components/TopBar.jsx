import { Activity } from 'lucide-react';

export default function TopBar() {
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
      </div>
    </header>
  );
}
