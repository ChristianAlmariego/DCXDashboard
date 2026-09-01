import { useState } from "react";
import { fetchAreaPaths } from "../api/ado";

const DEFAULT_ORG = "EmersonAutomationSolutions";
const DEFAULT_PROJECT = "EMR-DigMod";

export default function LoginPanel({ onConnect, loading, error }) {
  const [pat, setPat] = useState("");
  const [org, setOrg] = useState(DEFAULT_ORG);
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [areaPaths, setAreaPaths] = useState([]);
  const [areaPath, setAreaPath] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [step, setStep] = useState(1); // 1 = credentials, 2 = area path

  async function handleFetchPaths() {
    if (!pat.trim() || !org.trim() || !project.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const paths = await fetchAreaPaths(pat.trim(), org.trim(), project.trim());
      setAreaPaths(paths);
      setAreaPath(paths[0] || "");
      setStep(2);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setFetching(false);
    }
  }

  function handleConnect() {
    if (!areaPath) return;
    onConnect({ pat: pat.trim(), org: org.trim(), project: project.trim(), areaPath });
  }

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
              <input
                className="login-input"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. EmersonAutomationSolutions"
              />
            </div>
            <div className="login-field">
              <label className="login-label">Project</label>
              <input
                className="login-input"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. EMR-DigMod"
              />
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
            <button
              className="login-btn"
              onClick={handleFetchPaths}
              disabled={fetching || !pat.trim() || !org.trim() || !project.trim()}
            >
              {fetching ? "Fetching teams…" : "Next →"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="login-field">
              <label className="login-label">Select Team (Area Path)</label>
              <select
                className="login-input login-select"
                value={areaPath}
                onChange={(e) => setAreaPath(e.target.value)}
                size={Math.min(areaPaths.length, 10)}
              >
                {areaPaths.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="login-selected-area">
              Selected: <strong>{areaPath}</strong>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-actions">
              <button className="login-btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="login-btn"
                onClick={handleConnect}
                disabled={loading || !areaPath}
              >
                {loading ? "Loading…" : "Connect"}
              </button>
            </div>
          </>
        )}

        <p className="login-note">
          Your PAT is used only in-memory and never stored or transmitted beyond Azure DevOps.
        </p>
      </div>
    </div>
  );
}
