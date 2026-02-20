import { Download, Plus, Printer } from 'lucide-react';

export default function ExportBar({ url, siteName, onExportCSV, onNewAudit }) {
  return (
    <div className="export-bar">
      <div className="export-info">
        <span className="export-url">{siteName || url}</span>
        <span className="export-meta">
          Audited {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </span>
      </div>
      <div className="export-actions">
        <button className="btn btn-ghost" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </button>
        <button className="btn btn-secondary" onClick={onExportCSV}>
          <Download size={14} /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={onNewAudit}>
          <Plus size={14} /> New Audit
        </button>
      </div>
    </div>
  );
}
