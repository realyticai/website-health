import useAudit from './hooks/useAudit';
import TopBar from './components/TopBar';
import AuditForm from './components/AuditForm';
import ProgressBar from './components/ProgressBar';
import HealthScore from './components/HealthScore';
import KPICards from './components/KPICards';
import CoreWebVitals from './components/CoreWebVitals';
import IssueSummary from './components/IssueSummary';
import IssuesTable from './components/IssuesTable';
import BrokenLinksTable from './components/BrokenLinksTable';
import PageList from './components/PageList';
import OpportunitiesCard from './components/OpportunitiesCard';
import ExportBar from './components/ExportBar';
import Toast from './components/Toast';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const {
    auditState,
    targetUrl,
    setTargetUrl,
    crawlDepth,
    setCrawlDepth,
    siteName,
    auditResults,
    linkResults,
    pagespeedResults,
    progress,
    error,
    startTime,
    activeSeverityFilter,
    setActiveSeverityFilter,

    filteredIssues,
    issueCounts,
    brokenLinks,
    redirectLinks,
    healthScore,
    totalStats,

    startAudit,
    cancelAudit,
    resetAudit,
    exportCSV,

    toastMessage,
    toastVisible,
    hideToast,
  } = useAudit();

  const isRunning = ['discovering', 'auditing', 'checking-links', 'pagespeed'].includes(auditState);

  return (
    <div className="app">
      <TopBar />

      {/* IDLE — Show audit form */}
      {auditState === 'idle' && (
        <main className="dashboard">
          <AuditForm
            url={targetUrl}
            onUrlChange={setTargetUrl}
            depth={crawlDepth}
            onDepthChange={setCrawlDepth}
            onStart={startAudit}
          />
        </main>
      )}

      {/* ERROR — Show error + retry */}
      {auditState === 'error' && (
        <main className="dashboard">
          <div className="audit-form-wrapper">
            <div className="audit-form" style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--red)', marginBottom: 12 }}>Audit Failed</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>{error}</p>
              <button className="btn btn-primary" onClick={resetAudit}>Try Again</button>
            </div>
          </div>
        </main>
      )}

      {/* RUNNING — Show progress + live results */}
      {isRunning && (
        <main className="dashboard">
          <ProgressBar
            progress={progress}
            state={auditState}
            onCancel={cancelAudit}
            startTime={startTime}
          />
          {auditResults.length > 0 && issueCounts.all > 0 && (
            <IssueSummary
              counts={issueCounts}
              activeFilter={activeSeverityFilter}
              onFilterChange={setActiveSeverityFilter}
            />
          )}
        </main>
      )}

      {/* COMPLETE — Full results dashboard */}
      {auditState === 'complete' && (
        <main className="dashboard">
          <ExportBar
            url={targetUrl}
            siteName={siteName}
            onExportCSV={exportCSV}
            onNewAudit={resetAudit}
          />

          <HealthScore
            score={healthScore}
            issueCounts={issueCounts}
            totalStats={totalStats}
          />

          <KPICards scores={pagespeedResults?.scores} />

          <CoreWebVitals vitals={pagespeedResults?.coreWebVitals} />

          <IssueSummary
            counts={issueCounts}
            activeFilter={activeSeverityFilter}
            onFilterChange={setActiveSeverityFilter}
          />

          <IssuesTable issues={filteredIssues} />

          <BrokenLinksTable
            brokenLinks={brokenLinks}
            redirectLinks={redirectLinks}
          />

          <OpportunitiesCard opportunities={pagespeedResults?.opportunities} />

          <PageList auditResults={auditResults} />
        </main>
      )}

      <Footer />
      <Toast message={toastMessage} visible={toastVisible} onClose={hideToast} />
    </div>
  );
}
