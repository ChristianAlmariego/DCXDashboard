import { shortIteration } from "../utils/grouping";

const STATUS_COLORS = {
  "In Progress Dev":          { bg: "#fff3cd", border: "#f0c040", text: "#7a5700", dot: "#f0c940" },
  "QA Test":                  { bg: "#d1ecf1", border: "#17a2b8", text: "#0c5460", dot: "#17a2b8" },
  "QA Test Failed":           { bg: "#f8d7da", border: "#dc3545", text: "#721c24", dot: "#e74c3c" },
  "Waiting for Stage Deploy": { bg: "#ede0f7", border: "#9b59b6", text: "#5e2a8a", dot: "#9b59b6" },
  "Waiting for Prod Deploy":  { bg: "#e8f4fd", border: "#0078d4", text: "#004e8c", dot: "#0078d4" },
  "Stage Test":               { bg: "#fce4ff", border: "#c678dd", text: "#6a0dad", dot: "#c678dd" },
  "Blocked":                  { bg: "#f8d7da", border: "#dc3545", text: "#721c24", dot: "#e74c3c" },
  "New":                      { bg: "#e9ecef", border: "#adb5bd", text: "#495057", dot: "#adb5bd" },
  "Complete/Done":            { bg: "#d4edda", border: "#28a745", text: "#155724", dot: "#2ecc71" },
  "Closed":                   { bg: "#d4edda", border: "#28a745", text: "#155724", dot: "#2ecc71" },
};

function cfg(state) {
  return STATUS_COLORS[state] || { bg: "#e9ecef", border: "#adb5bd", text: "#495057", dot: "#adb5bd" };
}

export default function AssigneeCard({ name, stories, todayStr }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const totalPts = stories.reduce((s, x) => s + (x.storyPoints ?? 0), 0);

  return (
    <div className="assignee-card">
      <div className="assignee-hdr">
        <div className="assignee-avatar">{initials || "?"}</div>
        <div className="assignee-info">
          <div className="assignee-name">{name}</div>
          <div className="assignee-meta">{stories.length} stories{totalPts > 0 ? ` · ${totalPts} pts` : ""}</div>
        </div>
      </div>
      <div className="assignee-stories">
        {stories.map((s) => {
          const c = cfg(s.state);
          return (
            <div key={s.id} className="story-item" style={{ borderLeftColor: c.dot }}>
              <div className="story-item-top">
                <span className="story-state-badge" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
                  {s.state}
                </span>
                <a href={s.url} target="_blank" rel="noreferrer" className="story-id-link">#{s.id}</a>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="story-title-link">{s.title}</a>
              <div className="story-meta-row">
                <span>{shortIteration(s.iterationPath) || "—"}</span>
                {s.storyPoints != null && <span>{s.storyPoints} pts</span>}
                {s.priority && <span>P{s.priority}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
