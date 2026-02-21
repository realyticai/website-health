import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'wh_sites';

function loadSites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSites(sites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export default function useSites() {
  const [sites, setSites] = useState(loadSites);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard | site | auditing

  // Persist to localStorage whenever sites change
  useEffect(() => {
    saveSites(sites);
  }, [sites]);

  // Check URL params on mount for direct site links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site');
    if (siteId) {
      const found = sites.find((s) => s.id === siteId);
      if (found) {
        setSelectedSiteId(siteId);
        setViewMode('site');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null;

  const addSite = useCallback((siteData) => {
    // siteData: { url, name, scores, auditData, pagespeedResults, linkResults, auditResults }
    const id = crypto.randomUUID();
    const newSite = {
      id,
      url: siteData.url,
      name: siteData.name || new URL(siteData.url).hostname,
      lastAudit: new Date().toISOString(),
      scores: siteData.scores || null,
      crawlDepth: siteData.crawlDepth || 10,
      auditData: {
        auditResults: siteData.auditResults || [],
        linkResults: siteData.linkResults || [],
        pagespeedResults: siteData.pagespeedResults || null,
      },
    };
    setSites((prev) => [newSite, ...prev]);
    setSelectedSiteId(id);
    setViewMode('site');
    return id;
  }, []);

  const updateSite = useCallback((id, siteData) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              lastAudit: new Date().toISOString(),
              scores: siteData.scores || s.scores,
              auditData: {
                auditResults: siteData.auditResults || s.auditData?.auditResults || [],
                linkResults: siteData.linkResults || s.auditData?.linkResults || [],
                pagespeedResults: siteData.pagespeedResults || s.auditData?.pagespeedResults || null,
              },
            }
          : s
      )
    );
  }, []);

  const removeSite = useCallback((id) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    if (selectedSiteId === id) {
      setSelectedSiteId(null);
      setViewMode('dashboard');
    }
  }, [selectedSiteId]);

  const selectSite = useCallback((id) => {
    setSelectedSiteId(id);
    setViewMode('site');
  }, []);

  const goToDashboard = useCallback(() => {
    setSelectedSiteId(null);
    setViewMode('dashboard');
  }, []);

  return {
    sites,
    selectedSite,
    selectedSiteId,
    viewMode,
    setViewMode,
    addSite,
    updateSite,
    removeSite,
    selectSite,
    goToDashboard,
  };
}
