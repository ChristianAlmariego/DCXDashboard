import { useState } from "react";
import { fetchAreaPaths } from "../api/ado";

const DEFAULT_ORG = "EmersonAutomationSolutions";
const DEFAULT_PROJECT = "EMR-DigMod";

export default function LoginPanel({ onConnect, loading, error }) {
  const [pat, setPat] = useState("");
  const [org, setOrg] = useState(DEFAULT_ORG);
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [areaPaths, setAreaPaths] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [step, setStep] = useState(1);

  async function handleFetchPaths() {
    if (!pat.trim() || !org.trim() || !project.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const paths = await fetchAreaPaths(pat.trim(), org.trim(), project.trim());
      setAreaPaths(paths);
      setSelected(new Set());
      setStep(2);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setFetching(false);
    }
  }

  function toggle(p) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  function handleConnect() {
    if (selected.size === 0) return;
    onConnect({ pat: pat.trim(), org: org.trim(), project: project.trim(), areaPaths: [...selected] });
  }

  const filtered = areaPaths.filter((p) => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">📋</div>
        <h1 className="login-title">DCX Team Dashboard</h1>
        <p className="login-sub">Connect to Azure DevOps to get started</p>

        {step === 1 && (
          <>
            <div className="login-field">
              <label className="login-label">Organization</label>
              <input className="login-input" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. EmersonAutomationSolutions" />
            </div>
            <div className="login-field">
              <label className="login-label">Project</label>
              <input className="login-input" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. EMR-DigMod" />
            </div>
            <div className="login-field">
              <label className="login-label">Personal Access Token</label>
              <input
                className="login-input"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="Paste your PAT…"
                onKeyDown={(e) => e.key === "Enter" && !fetching && pat.trim() && handleFetchPaths()}
              />
            </div>
            {fetchError && <div className="login-error">{fetchError}</div>}
            <button className="login-btn" onClick={handleFetchPaths} disabled={fetching || !pat.trim() || !org.trim() || !project.trim()}>
              {fetching ? "Fetching teams…" : "Next →"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="login-field">
              <label className="login-label">
                Select Teams (Area Paths)
                <span className="login-label-hint"> — select one or more</span>
              </label>
              <input
                className="login-search-paths"
                type="search"
                placeholder="Filter paths…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="login-checklist">
                {filtered.length === 0 && <div className="login-check-empty">No paths match</div>}
                {filtered.map((p) => (
                  <label key={p} className={`login-check-row${selected.has(p) ? " selected" : ""}`}>
                    <input type="checkbox" checked={selected.has(p)} onChange={() => toggle(p)} className="login-check-input" />
                    <span className="login-check-label">{p}</span>
                  </label>
                ))}
              </div>
              {selected.size > 0 && (
                <div className="login-selected-area">
                  {selected.size} path{selected.size > 1 ? "s" : ""} selected
                </div>
              )}
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-actions">
              <button className="login-btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="login-btn" onClick={handleConnect} disabled={loading || selected.size === 0}>
                {loading ? "Loading…" : "Connect"}
              </button>
            </div>
          </>
        )}

        <p className="login-note">Your PAT is used only in-memory and never stored or transmitted beyond Azure DevOps.</p>
      </div>
    </div>
  );
}
