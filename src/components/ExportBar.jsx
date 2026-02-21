import { Download, Printer, RefreshCw } from 'lucide-react';

export default function ExportBar({ siteName, url, lastAudit, onExportCSV, onRerun }) {
  const auditDate = lastAudit
    ? new Date(lastAudit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString();
  const auditTime = lastAudit
    ? new Date(lastAudit).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : new Date().toLocaleTimeString();

  return (
    <div className="export-bar">
      <div className="export-info">
        <span className="export-url">{siteName || url}</span>
        <span className="export-meta">Audited {auditDate} at {auditTime}</span>
      </div>
      <div className="export-actions">
        <button className="btn btn-ghost" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </button>
        <button className="btn btn-secondary" onClick={onExportCSV}>
          <Download size={14} /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={onRerun}>
          <RefreshCw size={14} /> Re-run Audit
        </button>
      </div>
    </div>
  );
}
