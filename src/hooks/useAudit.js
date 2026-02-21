import { useState, useMemo, useCallback, useRef } from 'react';
import { LINKS_PER_BATCH } from '../config';
import { computeHealthScore } from '../utils/scoring';
import { exportIssuesCSV } from '../utils/export';

export default function useAudit() {
  const [auditState, setAuditState] = useState('idle');
  // States: idle | discovering | auditing | checking-links | pagespeed | complete | error

  const [targetUrl, setTargetUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState(10);
  const [siteName, setSiteName] = useState('');
  const [pages, setPages] = useState([]);
  const [auditResults, setAuditResults] = useState([]);
  const [linkResults, setLinkResults] = useState([]);
  const [pagespeedResults, setPagespeedResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentUrl: '', phase: '' });
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('all');

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const cancelledRef = useRef(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const startAudit = useCallback(async (url, depth) => {
    cancelledRef.current = false;
    setError(null);
    setAuditResults([]);
    setLinkResults([]);
    setPagespeedResults(null);
    setPages([]);
    setSiteName('');
    setStartTime(Date.now());

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    setTargetUrl(normalizedUrl);

    try {
      // Phase 1: Discover pages
      setAuditState('discovering');
      setProgress({ current: 0, total: 0, currentUrl: normalizedUrl, phase: 'Discovering pages...' });

      const discoverRes = await fetch('/.netlify/functions/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const discovery = await discoverRes.json();

      if (discovery.error && !discovery.pages?.length) {
        throw new Error(discovery.error);
      }

      setSiteName(discovery.siteName || new URL(normalizedUrl).hostname);

      let allPages = discovery.pages || [normalizedUrl];

      // Recursive discovery: if we haven't found enough pages and depth is higher,
      // follow links on discovered pages to find deeper pages
      if (allPages.length < depth && allPages.length > 1 && !cancelledRef.current) {
        setProgress({ current: 0, total: 0, currentUrl: '', phase: `Found ${allPages.length} pages, discovering more...` });

        // Pick up to 10 pages to crawl for more links (skip the first — already crawled)
        const pagesToFollow = allPages.slice(1, 11);
        try {
          const deepRes = await fetch('/.netlify/functions/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizedUrl, followUrls: pagesToFollow }),
          });
          const deepDiscovery = await deepRes.json();
          if (deepDiscovery.pages?.length) {
            const combined = new Set(allPages);
            for (const p of deepDiscovery.pages) combined.add(p);
            allPages = [...combined].sort();
          }
        } catch {
          // Deep discovery failed, continue with what we have
        }
      }

      // Cap pages at requested depth
      const pagesToAudit = allPages.slice(0, depth);
      setPages(pagesToAudit);

      if (cancelledRef.current) return;

      // Phase 2: Audit each page
      setAuditState('auditing');
      const results = [];

      for (let i = 0; i < pagesToAudit.length; i++) {
        if (cancelledRef.current) return;

        setProgress({
          current: i + 1,
          total: pagesToAudit.length,
          currentUrl: pagesToAudit[i],
          phase: `Auditing page ${i + 1} of ${pagesToAudit.length}`,
        });

        try {
          const auditRes = await fetch('/.netlify/functions/audit-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: pagesToAudit[i] }),
          });
          const result = await auditRes.json();
          results.push(result);
          setAuditResults([...results]);
        } catch (pageErr) {
          results.push({
            url: pagesToAudit[i],
            error: pageErr.message,
            issues: [],
            links: [],
            stats: {},
          });
          setAuditResults([...results]);
        }
      }

      if (cancelledRef.current) return;

      // Phase 3: Check links
      setAuditState('checking-links');
      const allLinks = [...new Set(results.flatMap((r) => r.links || []))];
      const allLinkResults = [];

      const batches = [];
      for (let i = 0; i < allLinks.length; i += LINKS_PER_BATCH) {
        batches.push(allLinks.slice(i, i + LINKS_PER_BATCH));
      }

      for (let i = 0; i < batches.length; i++) {
        if (cancelledRef.current) return;

        setProgress({
          current: i + 1,
          total: batches.length,
          currentUrl: `Batch ${i + 1} of ${batches.length} (${allLinks.length} total links)`,
          phase: `Checking links...`,
        });

        try {
          const linkRes = await fetch('/.netlify/functions/check-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: batches[i] }),
          });
          const linkData = await linkRes.json();
          allLinkResults.push(...(linkData.results || []));
          setLinkResults([...allLinkResults]);
        } catch {
          // Skip failed batches
        }
      }

      if (cancelledRef.current) return;

      // Phase 4: PageSpeed
      setAuditState('pagespeed');
      setProgress({ current: 1, total: 1, currentUrl: normalizedUrl, phase: 'Running PageSpeed analysis...' });

      try {
        const psRes = await fetch('/.netlify/functions/pagespeed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl, strategy: 'mobile' }),
        });
        const psData = await psRes.json();
        if (!psData.error) {
          setPagespeedResults(psData);
        }
      } catch {
        // PageSpeed is optional
      }

      setAuditState('complete');
      showToast('Audit complete!');
    } catch (err) {
      setError(err.message);
      setAuditState('error');
      showToast('Audit failed: ' + err.message);
    }
  }, []);

  const cancelAudit = useCallback(() => {
    cancelledRef.current = true;
    setAuditState('idle');
    showToast('Audit cancelled');
  }, []);

  const resetAudit = useCallback(() => {
    cancelledRef.current = true;
    setAuditState('idle');
    setAuditResults([]);
    setLinkResults([]);
    setPagespeedResults(null);
    setPages([]);
    setError(null);
    setActiveSeverityFilter('all');
  }, []);

  // Computed values
  const allIssues = useMemo(() => {
    return auditResults.flatMap((r) =>
      (r.issues || []).map((issue) => ({ ...issue, pageUrl: r.url }))
    );
  }, [auditResults]);

  const filteredIssues = useMemo(() => {
    if (activeSeverityFilter === 'all') return allIssues;
    return allIssues.filter((i) => i.severity === activeSeverityFilter);
  }, [allIssues, activeSeverityFilter]);

  const issueCounts = useMemo(() => {
    const counts = { all: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const issue of allIssues) {
      counts.all++;
      if (counts[issue.severity] !== undefined) counts[issue.severity]++;
    }
    return counts;
  }, [allIssues]);

  const brokenLinks = useMemo(() => {
    return linkResults.filter((l) => !l.ok && !l.error?.includes('timeout') && l.status !== 301 && l.status !== 302);
  }, [linkResults]);

  const redirectLinks = useMemo(() => {
    return linkResults.filter((l) => l.status === 301 || l.status === 302 || l.redirect);
  }, [linkResults]);

  const healthScore = useMemo(() => {
    if (auditState !== 'complete') return null;
    return computeHealthScore(auditResults, linkResults, pagespeedResults?.scores);
  }, [auditState, auditResults, linkResults, pagespeedResults]);

  const totalStats = useMemo(() => {
    const stats = { pages: auditResults.length, images: 0, links: 0, words: 0 };
    for (const r of auditResults) {
      if (r.stats) {
        stats.images += r.stats.imgCount || 0;
        stats.links += r.stats.linkCount || 0;
        stats.words += r.stats.wordCount || 0;
      }
    }
    return stats;
  }, [auditResults]);

  const exportCSV = useCallback(() => {
    exportIssuesCSV(auditResults, linkResults, siteName);
  }, [auditResults, linkResults, siteName]);

  const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

  return {
    auditState,
    targetUrl,
    setTargetUrl,
    crawlDepth,
    setCrawlDepth,
    siteName,
    pages,
    auditResults,
    linkResults,
    pagespeedResults,
    progress,
    error,
    elapsed,
    startTime,
    activeSeverityFilter,
    setActiveSeverityFilter,

    allIssues,
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
    hideToast: () => setToastVisible(false),
    showToast,
  };
}
