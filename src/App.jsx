import { useState, useMemo } from "react";
import { useAdoData } from "./hooks/useAdoData";
import { shortIteration } from "./utils/grouping";
import LoginPanel from "./components/LoginPanel";
import AssigneeCard from "./components/AssigneeCard";
import VelocityTab from "./components/VelocityTab";
import "./App.css";

const STATUS_ORDER = [
  "QA Test Failed","Blocked","In Progress Dev","Waiting for Stage Deploy",
  "Waiting for Prod Deploy","Stage Test","QA Test","New","Complete/Done","Closed",
];

const STATUS_COLORS = {
  "In Progress Dev":          { bg: "#fff3cd", border: "#f0c040", text: "#7a5700" },
  "QA Test":                  { bg: "#d1ecf1", border: "#17a2b8", text: "#0c5460" },
  "QA Test Failed":           { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
  "Waiting for Stage Deploy": { bg: "#ede0f7", border: "#9b59b6", text: "#5e2a8a" },
  "Waiting for Prod Deploy":  { bg: "#e8f4fd", border: "#0078d4", text: "#004e8c" },
  "Stage Test":               { bg: "#fce4ff", border: "#c678dd", text: "#6a0dad" },
  "Blocked":                  { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
  "New":                      { bg: "#e9ecef", border: "#adb5bd", text: "#495057" },
  "Complete/Done":            { bg: "#d4edda", border: "#28a745", text: "#155724" },
  "Closed":                   { bg: "#d4edda", border: "#28a745", text: "#155724" },
};

const FEATURE_STATUS_ORDER = [
  "Blocked","In Progress","Implementing","QA Test Failed","QA Test",
  "New","Feature Backlog","Complete","Closed",
];

const FEATURE_STATUS_COLORS = {
  "Blocked":        { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
  "In Progress":    { bg: "#fff3cd", border: "#f0c040", text: "#7a5700" },
  "Implementing":   { bg: "#fff3cd", border: "#f0c040", text: "#7a5700" },
  "QA Test Failed": { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
  "QA Test":        { bg: "#d1ecf1", border: "#17a2b8", text: "#0c5460" },
  "New":            { bg: "#e9ecef", border: "#adb5bd", text: "#495057" },
  "Feature Backlog":{ bg: "#e9ecef", border: "#adb5bd", text: "#495057" },
  "Complete":       { bg: "#d4edda", border: "#28a745", text: "#155724" },
  "Closed":         { bg: "#d4edda", border: "#28a745", text: "#155724" },
};

const PRIORITY_COLORS = {
  1: { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
  2: { bg: "#fff3cd", border: "#f0c040", text: "#7a5700" },
  3: { bg: "#d1ecf1", border: "#17a2b8", text: "#0c5460" },
  4: { bg: "#e9ecef", border: "#adb5bd", text: "#495057" },
};

function toSprintGroup(it) {
  const pi = it.match(/^PI\s+(\d+\.\d+)/i);
  if (pi) return pi[1];
  const m = it.match(/^(\d+\.\d+)/);
  if (m) return m[1];
  return it;
}

export default function App() {
  const [conn, setConn] = useState(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [iterationFilter, setIterationFilter] = useState("All");
  const [featureIterFilter, setFeatureIterFilter] = useState("All");
  const [tab, setTab] = useState("dashboard");
  const [summarySubTab, setSummarySubTab] = useState("stories");

  const { stories, features, loading, error, lastRefresh, load } = useAdoData();

  function handleConnect(cfg) {
    setConn(cfg);
    load(cfg.pat, cfg.org, cfg.project, cfg.areaPaths);
  }
  function handleRefresh() { if (conn) load(conn.pat, conn.org, conn.project, conn.areaPaths); }
  function handleDisconnect() { setConn(null); }

  const teamLabel = useMemo(() => {
    if (!conn) return "";
    return conn.areaPaths.map((p) => p.split("\\").pop()).join(", ");
  }, [conn]);

  const iterations = useMemo(() => {
    const set = new Set(stories.map((s) => shortIteration(s.iterationPath)).filter(Boolean));
    return [...set].sort();
  }, [stories]);

  const sprintGroups = useMemo(() => {
    const all = [
      ...stories.map((s) => shortIteration(s.iterationPath)),
      ...features.map((f) => shortIteration(f.iterationPath)),
    ].filter(Boolean);
    const set = new Set(all.map(toSprintGroup));
    return [...set].sort();
  }, [stories, features]);

  const filtered = useMemo(() => {
    let r = stories;
    if (iterationFilter !== "All") r = r.filter((s) => shortIteration(s.iterationPath) === iterationFilter);
    if (stateFilter !== "All") r = r.filter((s) => s.state === stateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.assignee.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        s.tags.toLowerCase().includes(q)
      );
    }
    return r;
  }, [stories, stateFilter, iterationFilter, search]);

  const velocityStories = useMemo(() => {
    let r = stories;
    if (iterationFilter !== "All") r = r.filter((s) => shortIteration(s.iterationPath) === iterationFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.assignee.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        s.tags.toLowerCase().includes(q)
      );
    }
    return r;
  }, [stories, iterationFilter, search]);

  const assigneeGroups = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const key = s.assignee || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const statusGroups = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const key = s.state || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = STATUS_ORDER.indexOf(a); const bi = STATUS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filtered]);

  const filteredFeatures = useMemo(() => {
    if (featureIterFilter === "All") return features;
    const g = featureIterFilter;
    return features.filter((f) => {
      const it = shortIteration(f.iterationPath);
      return it === g || it.startsWith(g + ".") || it === `PI ${g}` || it.startsWith(`PI ${g}.`);
    });
  }, [features, featureIterFilter]);

  // KPI tiles by status
  const featureStatusCounts = useMemo(() => {
    const map = new Map();
    for (const f of filteredFeatures) {
      const key = f.state || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = FEATURE_STATUS_ORDER.indexOf(a); const bi = FEATURE_STATUS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filteredFeatures]);

  // Table rows grouped by status
  const featureStatusGroups = useMemo(() => {
    const map = new Map();
    for (const f of filteredFeatures) {
      const key = f.state || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    // Within each status group sort by priority asc
    for (const [, items] of map) {
      items.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = FEATURE_STATUS_ORDER.indexOf(a); const bi = FEATURE_STATUS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filteredFeatures]);

  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (!conn) return <LoginPanel onConnect={handleConnect} loading={loading} error={error} />;

  const activeIterDropdown = summarySubTab === "features" ? featureIterFilter : iterationFilter;
  const activeIterOptions = summarySubTab === "features" ? sprintGroups : iterations;
  const setActiveIter = summarySubTab === "features" ? setFeatureIterFilter : setIterationFilter;

  return (
    <div className="app">
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="dash-title">📋 {teamLabel} Team Daily Dashboard — User Stories</div>
          <div className="dash-sub">{teamLabel} · {iterationFilter !== "All" ? iterationFilter : "All Iterations"}</div>
        </div>
        <div className="dash-header-right">
          <div className="dash-date">📅 {todayStr}</div>
          <div className="dash-controls">
            <select className="dash-select" value={tab === "summary" ? activeIterDropdown : iterationFilter}
              onChange={(e) => tab === "summary" ? setActiveIter(e.target.value) : setIterationFilter(e.target.value)}>
              <option value="All">All Iterations</option>
              {(tab === "summary" ? activeIterOptions : iterations).map((it) => <option key={it} value={it}>{it}</option>)}
            </select>
            {tab !== "summary" && (
              <select className="dash-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                {["All","New","Active","Resolved","Closed"].map((s) => <option key={s} value={s}>{s === "All" ? "All States" : s}</option>)}
              </select>
            )}
            <input className="dash-search" type="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="dash-btn" onClick={handleRefresh} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
            <button className="dash-btn dash-btn-danger" onClick={handleDisconnect}>Disconnect</button>
          </div>
        </div>
      </header>

      <div className="dash-legend">
        {[{color:"#f0c940",label:"In Progress Dev"},{color:"#17a2b8",label:"QA Test"},{color:"#e74c3c",label:"QA Test Failed / Blocked"},{color:"#9b59b6",label:"Waiting for Stage Deploy"},{color:"#adb5bd",label:"New"},{color:"#2ecc71",label:"Complete/Done"}].map((l) => (
          <span key={l.label} className="legend-item"><span className="legend-dot" style={{ background: l.color }} />{l.label}</span>
        ))}
        {lastRefresh && <span className="legend-item" style={{ marginLeft: "auto", color: "#aaa" }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === "dashboard" ? " active" : ""}`} onClick={() => setTab("dashboard")}>📋 Dashboard</button>
        <button className={`tab-btn${tab === "summary" ? " active" : ""}`} onClick={() => setTab("summary")}>📊 Summary by Status</button>
        <button className={`tab-btn${tab === "velocity" ? " active" : ""}`} onClick={() => setTab("velocity")}>⚡ Velocity</button>
      </div>

      <main className="dash-main">
        {loading && <div className="loading-state"><div className="spinner" /><span>Fetching from Azure DevOps…</span></div>}
        {!loading && error && <div className="error-state"><strong>Error:</strong> {error}<button className="dash-btn" onClick={handleRefresh} style={{marginTop:12}}>Retry</button></div>}
        {!loading && !error && stories.length === 0 && <div className="empty-state">No user stories found under the selected area path.</div>}

        {!loading && !error && stories.length > 0 && tab === "dashboard" && (
          assigneeGroups.length === 0 ? <div className="empty-state">No stories match your filters.</div>
            : <div className="dash-grid">{assigneeGroups.map(([name, items]) => <AssigneeCard key={name} name={name} stories={items} todayStr={todayStr} teamLabel={teamLabel} />)}</div>
        )}

        {!loading && !error && stories.length > 0 && tab === "summary" && (
          <div className="summary-view">
            <div className="sum-subtab-bar">
              <button className={`sum-subtab-btn${summarySubTab === "stories" ? " active" : ""}`} onClick={() => setSummarySubTab("stories")}>
                📋 User Story Status
              </button>
              <button className={`sum-subtab-btn${summarySubTab === "features" ? " active" : ""}`} onClick={() => setSummarySubTab("features")}>
                🗂 Feature Status
              </button>
            </div>

            {summarySubTab === "stories" && (
              <>
                <div className="summary-totals">
                  <div className="sum-total-tile"><div className="sum-total-num">{filtered.length}</div><div className="sum-total-lbl">Total Stories</div></div>
                  {statusGroups.map(([status, items]) => {
                    const col = STATUS_COLORS[status] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057" };
                    const pct = filtered.length > 0 ? Math.round((items.length / filtered.length) * 100) : 0;
                    return (
                      <div key={status} className="sum-total-tile" style={{ borderTopColor: col.border }}>
                        <div className="sum-total-num" style={{ color: col.text }}>{items.length}</div>
                        <div className="sum-total-pct" style={{ color: col.text }}>{pct}%</div>
                        <div className="sum-total-lbl">{status}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="sum-table-wrap">
                  <table className="sum-table">
                    <colgroup><col style={{width:"100px"}}/><col/><col style={{width:"220px"}}/><col style={{width:"90px"}}/><col style={{width:"50px"}}/><col style={{width:"70px"}}/><col/></colgroup>
                    <thead><tr><th>ID</th><th>Title</th><th>Assignee</th><th>Sprint</th><th>Pts</th><th>Priority</th><th>Parent Feature</th></tr></thead>
                    <tbody>
                      {statusGroups.map(([status, items]) => {
                        const col = STATUS_COLORS[status] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057" };
                        return [
                          <tr key={`hdr-${status}`} className="sum-group-row"><td colSpan={7}><span className="sum-group-label" style={{color:col.text,borderLeftColor:col.border,background:col.bg}}>{status}</span><span className="sum-group-count">{items.length} {items.length===1?"story":"stories"}</span></td></tr>,
                          ...items.map((s) => (
                            <tr key={s.id} className="sum-story-row">
                              <td><a href={s.url} target="_blank" rel="noreferrer" className="sum-id-link">#{s.id}</a></td>
                              <td><a href={s.url} target="_blank" rel="noreferrer" className="sum-title-link">{s.title}</a></td>
                              <td>{s.assignee}</td>
                              <td>{shortIteration(s.iterationPath)}</td>
                              <td>{s.storyPoints ?? "—"}</td>
                              <td>{s.priority ? `P${s.priority}` : "—"}</td>
                              <td className="sum-feature-cell">{s.featureTitle ? <span className="sum-feature-link">{s.featureTitle}</span> : <span className="sum-feature-none">—</span>}</td>
                            </tr>
                          )),
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {summarySubTab === "features" && (
              <>
                <div className="summary-totals">
                  <div className="sum-total-tile"><div className="sum-total-num">{filteredFeatures.length}</div><div className="sum-total-lbl">Total Features</div></div>
                  {featureStatusCounts.map(([status, count]) => {
                    const col = FEATURE_STATUS_COLORS[status] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057" };
                    const pct = filteredFeatures.length > 0 ? Math.round((count / filteredFeatures.length) * 100) : 0;
                    return (
                      <div key={status} className="sum-total-tile" style={{ borderTopColor: col.border }}>
                        <div className="sum-total-num" style={{ color: col.text }}>{count}</div>
                        <div className="sum-total-pct" style={{ color: col.text }}>{pct}%</div>
                        <div className="sum-total-lbl">{status}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="sum-table-wrap">
                  <table className="sum-table">
                    <colgroup><col style={{width:"100px"}}/><col/><col style={{width:"180px"}}/><col style={{width:"90px"}}/><col style={{width:"70px"}}/><col style={{width:"50px"}}/></colgroup>
                    <thead>
                      <tr><th>ID</th><th>Title</th><th>Assignee</th><th>Sprint</th><th>Priority</th><th>Pts</th></tr>
                    </thead>
                    <tbody>
                      {featureStatusGroups.map(([status, items]) => {
                        const col = FEATURE_STATUS_COLORS[status] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057" };
                        return [
                          <tr key={`hdr-${status}`} className="sum-group-row">
                            <td colSpan={6}>
                              <span className="sum-group-label" style={{color:col.text,borderLeftColor:col.border,background:col.bg}}>{status}</span>
                              <span className="sum-group-count">{items.length} {items.length===1?"feature":"features"}</span>
                            </td>
                          </tr>,
                          ...items.map((f) => {
                            const pc = PRIORITY_COLORS[f.priority] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057" };
                            return (
                              <tr key={f.id} className="sum-story-row">
                                <td><a href={f.url} target="_blank" rel="noreferrer" className="sum-id-link">#{f.id}</a></td>
                                <td><a href={f.url} target="_blank" rel="noreferrer" className="sum-title-link">{f.title}</a></td>
                                <td>{f.assignee}</td>
                                <td>{shortIteration(f.iterationPath)}</td>
                                <td>
                                  {f.priority
                                    ? <span className="feat-priority-badge" style={{background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`}}>P{f.priority}</span>
                                    : "—"}
                                </td>
                                <td>{f.storyPoints ?? "—"}</td>
                              </tr>
                            );
                          }),
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {!loading && !error && tab === "velocity" && <VelocityTab stories={velocityStories} />}
      </main>

      <footer className="dash-footer">
        <span>QA Team Dashboard · {teamLabel} · {iterationFilter !== "All" ? iterationFilter : "All Iterations"}</span>
        <span>Draft for human review — verify figures before sharing</span>
      </footer>
    </div>
  );
}
