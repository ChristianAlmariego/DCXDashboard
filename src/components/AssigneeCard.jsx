import { useState } from "react";

const S_CFG = {
  "In Progress Dev":          { cls: "s-prog", badge: "pill-prog", icon: "🔄", label: "In Progress Dev" },
  "QA Test":                  { cls: "s-test", badge: "pill-test", icon: "🧪", label: "QA Test" },
  "QA Test Failed":           { cls: "s-fail", badge: "pill-fail", icon: "❌", label: "QA Test Failed" },
  "Waiting for Stage Deploy": { cls: "s-wait", badge: "pill-wait", icon: "⏸", label: "Waiting for Stage Deploy" },
  "Waiting for Prod Deploy":  { cls: "s-wait", badge: "pill-wait", icon: "⏸", label: "Waiting for Prod Deploy" },
  "Stage Test":               { cls: "s-wait", badge: "pill-wait", icon: "🧪", label: "Stage Test" },
  "Blocked":                  { cls: "s-blk",  badge: "pill-blk",  icon: "🚫", label: "Blocked" },
  "New":                      { cls: "s-new",  badge: "pill-new",  icon: "⬜", label: "New" },
  "Complete/Done":            { cls: "s-done", badge: "pill-done", icon: "✅", label: "Complete/Done" },
  "Closed":                   { cls: "s-done", badge: "pill-done", icon: "✅", label: "Closed" },
};

const STATUS_COLORS = {
  "In Progress Dev": "#856404", "QA Test": "#0c5460", "QA Test Failed": "#721c24",
  "Waiting for Stage Deploy": "#6a1b9a", "Waiting for Prod Deploy": "#004e8c",
  "Stage Test": "#6a0dad", "Blocked": "#721c24", "New": "#495057",
  "Complete/Done": "#155724", "Closed": "#155724",
};

function sc(s) { return S_CFG[s] || { cls: "s-new", badge: "pill-new", icon: "⬜", label: s }; }

export default function AssigneeCard({ name, stories, todayStr, teamLabel }) {
  const [openIds, setOpenIds] = useState(new Set());

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const counts = {};
  stories.forEach((s) => { counts[s.state] = (counts[s.state] || 0) + 1; });

  const sumEntries = [
    ["Total", stories.length, "#003865"],
    ...Object.entries(counts).map(([st, n]) => [
      st === "Waiting for Stage Deploy" ? "Waiting Stage"
        : st === "Waiting for Prod Deploy" ? "Waiting Prod"
        : st,
      n,
      STATUS_COLORS[st] || "#495057",
    ]),
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-name">{name}</div>
          <div className="card-meta">{teamLabel || "QA"} · {todayStr}</div>
        </div>
        <div className="pills">
          {Object.entries(counts).map(([st, n]) => {
            const c = sc(st);
            return <span key={st} className={`pill ${c.badge}`}>{n} {c.label}</span>;
          })}
        </div>
      </div>

      <div className="card-body">
        <div className="summary-bar">
          {sumEntries.map(([lbl, n, col]) => (
            <div key={lbl} className="sbar-item">
              <div className="snum" style={{ color: col }}>{n}</div>
              <div className="slbl">{lbl}</div>
            </div>
          ))}
        </div>

        <div className="section-label">📖 USER STORIES</div>

        {stories.map((story) => {
          const c = sc(story.state);
          const sub = ["#" + story.id, story.priority ? `P${story.priority}` : null, story.storyPoints ? `${story.storyPoints} pts` : null].filter(Boolean).join(" · ");

          return (
            <div key={story.id} className={`story-block ${c.cls}`}>
              <div className="story-row">
                <a href={story.url} target="_blank" rel="noreferrer" className="story-link" title="Open in Azure DevOps">
                  <span className="story-icon">{c.icon}</span>
                  <div className="story-text">
                    <div className="s-title">{story.title}</div>
                    <div className="s-subtitle">{sub}</div>
                  </div>
                </a>
                <span className={`story-badge ${c.badge}`}>{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
