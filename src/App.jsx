import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import useAudit from './hooks/useAudit';
import useSites from './hooks/useSites';
import { ISSUE_TO_CATEGORY } from './config';
import { exportIssuesCSV } from './utils/export';
import TopBar from './components/TopBar';
import AuditForm from './components/AuditForm';
import ProgressBar from './components/ProgressBar';
import SiteDashboard from './components/SiteDashboard';
import ScoreCircles from './components/ScoreCircles';
import CategoryDrilldown from './components/CategoryDrilldown';
import ExportBar from './components/ExportBar';
import IssueSummary from './components/IssueSummary';
import PageList from './components/PageList';
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
    issueCounts,
    startAudit,
    cancelAudit,
    resetAudit,
    toastMessage,
    toastVisible,
    hideToast,
  } = useAudit();

  const {
    sites,
    selectedSite,
    viewMode,
    setViewMode,
    addSite,
    updateSite,
    removeSite,
    selectSite,
    goToDashboard,
  } = useSites();

  const [showAddForm, setShowAddForm] = useState(false);
  const rerunSiteIdRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const prevAuditStateRef = useRef(auditState);

  const isRunning = ['discovering', 'auditing', 'checking-links', 'pagespeed'].includes(auditState);

  // When audit completes, save results to site store
  useEffect(() => {
    if (auditState === 'complete' && prevAuditStateRef.current !== 'complete') {
      const siteData = {
        url: targetUrl,
        name: siteName,
        crawlDepth,
        scores: pagespeedResults?.scores || null,
        auditResults,
        linkResults,
        pagespeedResults,
      };

      if (rerunSiteIdRef.current) {
        updateSite(rerunSiteIdRef.current, siteData);
        selectSite(rerunSiteIdRef.current);
        rerunSiteIdRef.current = null;
      } else {
        addSite(siteData);
      }
      setShowAddForm(false);
    }
    prevAuditStateRef.current = auditState;
  }, [auditState, targetUrl, siteName, crawlDepth, pagespeedResults, auditResults, linkResults, updateSite, addSite, selectSite]);

  // Get data for the currently selected site
  const siteData = useMemo(() => {
    if (!selectedSite?.auditData) return null;
    return selectedSite.auditData;
  }, [selectedSite]);

  // Categorize issues into the 4 PageSpeed categories
  const categorizedIssues = useMemo(() => {
    if (!siteData) return { performance: [], accessibility: [], bestPractices: [], seo: [] };

    const allIssues = (siteData.auditResults || []).flatMap((r) =>
      (r.issues || []).map((issue) => ({ ...issue, pageUrl: r.url }))
    );

    const buckets = { performance: [], accessibility: [], bestPractices: [], seo: [] };
    for (const issue of allIssues) {
      const cat = ISSUE_TO_CATEGORY[issue.type] || 'seo';
      if (buckets[cat]) buckets[cat].push(issue);
    }
    return buckets;
  }, [siteData]);

  const siteBrokenLinks = useMemo(() => {
    if (!siteData?.linkResults) return [];
    return siteData.linkResults.filter((l) => !l.ok && !l.error?.includes('timeout') && l.status !== 301 && l.status !== 302);
  }, [siteData]);

  const siteRedirectLinks = useMemo(() => {
    if (!siteData?.linkResults) return [];
    return siteData.linkResults.filter((l) => l.status === 301 || l.status === 302 || l.redirect);
  }, [siteData]);

  const handleAddSite = () => {
    setShowAddForm(true);
    rerunSiteIdRef.current = null;
    resetAudit();
    setViewMode('auditing');
  };

  const handleRerunSite = (id) => {
    const site = sites.find((s) => s.id === id);
    if (!site) return;
    rerunSiteIdRef.current = id;
    setShowAddForm(true);
    resetAudit();
    setViewMode('auditing');
    setTimeout(() => startAudit(site.url, site.crawlDepth || 10), 100);
  };

  const handleRerunFromSiteView = () => {
    if (!selectedSite) return;
    handleRerunSite(selectedSite.id);
  };

  const handleBack = () => {
    if (isRunning) cancelAudit();
    setShowAddForm(false);
    rerunSiteIdRef.current = null;
    setActiveCategory(null);
    goToDashboard();
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  const handleExportCSV = useCallback(() => {
    if (!siteData) return;
    exportIssuesCSV(siteData.auditResults || [], siteData.linkResults || [], selectedSite?.name || '');
  }, [siteData, selectedSite]);

  const currentViewMode = showAddForm ? 'auditing' : viewMode;

  return (
    <div className="app">
      <TopBar
        viewMode={currentViewMode === 'dashboard' ? 'dashboard' : 'site'}
        siteName={currentViewMode === 'site' ? selectedSite?.name : null}
        onBack={handleBack}
      />

      {/* DASHBOARD — Show all sites */}
      {currentViewMode === 'dashboard' && (
        <main className="dashboard">
          <SiteDashboard
            sites={sites}
            onSelectSite={selectSite}
            onAddSite={handleAddSite}
            onRemoveSite={removeSite}
            onRerunSite={handleRerunSite}
          />
        </main>
      )}

      {/* AUDITING — Audit form / progress */}
      {currentViewMode === 'auditing' && (
        <main className="dashboard">
          {auditState === 'idle' && (
            <AuditForm
              url={targetUrl}
              onUrlChange={setTargetUrl}
              depth={crawlDepth}
              onDepthChange={setCrawlDepth}
              onStart={startAudit}
            />
          )}

          {auditState === 'error' && (
            <div className="audit-form-wrapper">
              <div className="audit-form" style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--red)', marginBottom: 12 }}>Audit Failed</h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>{error}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn btn-ghost" onClick={handleBack}>Back to Dashboard</button>
                  <button className="btn btn-primary" onClick={resetAudit}>Try Again</button>
                </div>
              </div>
            </div>
          )}

          {isRunning && (
            <ProgressBar
              progress={progress}
              state={auditState}
              onCancel={handleBack}
              startTime={startTime}
            />
          )}

          {isRunning && auditResults.length > 0 && issueCounts.all > 0 && (
            <IssueSummary
              counts={issueCounts}
              activeFilter={activeSeverityFilter}
              onFilterChange={setActiveSeverityFilter}
            />
          )}
        </main>
      )}

      {/* SITE VIEW — Full PageSpeed-style report */}
      {currentViewMode === 'site' && selectedSite && (
        <main className="dashboard">
          <ExportBar
            siteName={selectedSite.name}
            url={selectedSite.url}
            lastAudit={selectedSite.lastAudit}
            onExportCSV={handleExportCSV}
            onRerun={handleRerunFromSiteView}
          />

          <ScoreCircles
            scores={selectedSite.scores}
            categorizedIssues={categorizedIssues}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />

          {['performance', 'accessibility', 'bestPractices', 'seo'].map((cat) => (
            <CategoryDrilldown
              key={cat}
              category={cat}
              score={selectedSite.scores?.[cat]}
              issues={categorizedIssues[cat]}
              pagespeedResults={siteData?.pagespeedResults}
              brokenLinks={siteBrokenLinks}
              redirectLinks={siteRedirectLinks}
              auditResults={siteData?.auditResults}
              defaultOpen={activeCategory === cat}
            />
          ))}

          <PageList auditResults={siteData?.auditResults || []} />
        </main>
      )}

      <Footer />
      <Toast message={toastMessage} visible={toastVisible} onClose={hideToast} />
    </div>
  );
}
