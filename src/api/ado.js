const STORY_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.AssignedTo",
  "System.IterationPath",
  "System.AreaPath",
  "Microsoft.VSTS.Scheduling.StoryPoints",
  "Microsoft.VSTS.Common.Priority",
  "System.Tags",
  "System.WorkItemType",
  "System.Parent",
].join(",");

const FEATURE_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.AssignedTo",
  "System.IterationPath",
  "System.AreaPath",
  "Microsoft.VSTS.Scheduling.StoryPoints",
  "Microsoft.VSTS.Common.Priority",
  "System.WorkItemType",
].join(",");

function headers(pat) {
  return {
    Authorization: `Basic ${btoa(`:${pat}`)}`,
    "Content-Type": "application/json",
  };
}

export async function fetchAreaPaths(pat, org, project) {
  const res = await fetch(
    `https://dev.azure.com/${org}/${project}/_apis/wit/classificationnodes/areas?$depth=10&api-version=7.0`,
    { headers: headers(pat) }
  );
  if (!res.ok) throw new Error(`ADO error ${res.status} fetching area paths`);
  const data = await res.json();
  const paths = [];
  function walk(node, prefix) {
    const full = prefix ? `${prefix}\\${node.name}` : node.name;
    paths.push(full);
    if (node.children) node.children.forEach((c) => walk(c, full));
  }
  walk(data, "");
  return paths;
}

async function batchFetch(pat, org, project, ids, fields) {
  const results = [];
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const r = await fetch(
      `https://dev.azure.com/${org}/${project}/_apis/wit/workitems?ids=${batch.join(",")}&fields=${fields}&api-version=7.0`,
      { headers: headers(pat) }
    );
    if (!r.ok) throw new Error(`Batch fetch error ${r.status}`);
    const d = await r.json();
    results.push(...(d.value ?? []));
  }
  return results;
}

export async function fetchStories(pat, org, project, areaPaths) {
  const paths = Array.isArray(areaPaths) ? areaPaths : [areaPaths];
  const areaClause = paths.map((p) => `[System.AreaPath] UNDER '${p}'`).join(" OR ");
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems
      WHERE [System.TeamProject] = '${project}'
        AND (${areaClause})
        AND [System.WorkItemType] = 'User Story'
        AND [System.State] <> 'Removed'
      ORDER BY [System.ChangedDate] DESC`,
  };

  const wiqlRes = await fetch(
    `https://dev.azure.com/${org}/${project}/_apis/wit/wiql?api-version=7.0`,
    { method: "POST", headers: headers(pat), body: JSON.stringify(wiql) }
  );
  if (!wiqlRes.ok) throw new Error(`WIQL error ${wiqlRes.status}`);
  const { workItems } = await wiqlRes.json();
  if (!workItems?.length) return [];

  const rawItems = await batchFetch(pat, org, project, workItems.map((w) => w.id), STORY_FIELDS);

  const stories = rawItems.map((raw) => {
    const f = raw.fields;
    return {
      id: raw.id,
      title: f["System.Title"] ?? "",
      state: f["System.State"] ?? "Unknown",
      assignee: f["System.AssignedTo"]?.displayName ?? "Unassigned",
      iterationPath: f["System.IterationPath"] ?? "",
      areaPath: f["System.AreaPath"] ?? "",
      storyPoints: f["Microsoft.VSTS.Scheduling.StoryPoints"] ?? null,
      priority: f["Microsoft.VSTS.Common.Priority"] ?? null,
      tags: f["System.Tags"] ?? "",
      workItemType: f["System.WorkItemType"] ?? "",
      parentId: f["System.Parent"] ?? null,
      featureTitle: null,
      url: `https://dev.azure.com/${org}/${project}/_workitems/edit/${raw.id}`,
    };
  });

  // Fetch parent Feature titles
  const parentIds = [...new Set(stories.map((s) => s.parentId).filter(Boolean))];
  if (parentIds.length > 0) {
    try {
      const parents = await batchFetch(pat, org, project, parentIds, "System.Id,System.Title,System.WorkItemType");
      const parentMap = new Map();
      for (const p of parents) {
        if (p.fields["System.WorkItemType"] === "Feature") {
          parentMap.set(p.id, p.fields["System.Title"] ?? "");
        }
      }
      stories.forEach((s) => { if (s.parentId) s.featureTitle = parentMap.get(s.parentId) ?? null; });
    } catch {
      // non-critical
    }
  }

  return stories;
}

export async function fetchFeatures(pat, org, project, areaPaths) {
  const paths = Array.isArray(areaPaths) ? areaPaths : [areaPaths];
  const areaClause = paths.map((p) => `[System.AreaPath] UNDER '${p}'`).join(" OR ");
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems
      WHERE [System.TeamProject] = '${project}'
        AND (${areaClause})
        AND [System.WorkItemType] = 'Feature'
        AND [System.State] <> 'Removed'
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC`,
  };

  const wiqlRes = await fetch(
    `https://dev.azure.com/${org}/${project}/_apis/wit/wiql?api-version=7.0`,
    { method: "POST", headers: headers(pat), body: JSON.stringify(wiql) }
  );
  if (!wiqlRes.ok) throw new Error(`WIQL error ${wiqlRes.status}`);
  const { workItems } = await wiqlRes.json();
  if (!workItems?.length) return [];

  const rawItems = await batchFetch(pat, org, project, workItems.map((w) => w.id), FEATURE_FIELDS);

  return rawItems.map((raw) => {
    const f = raw.fields;
    return {
      id: raw.id,
      title: f["System.Title"] ?? "",
      state: f["System.State"] ?? "Unknown",
      assignee: f["System.AssignedTo"]?.displayName ?? "Unassigned",
      iterationPath: f["System.IterationPath"] ?? "",
      areaPath: f["System.AreaPath"] ?? "",
      storyPoints: f["Microsoft.VSTS.Scheduling.StoryPoints"] ?? null,
      priority: f["Microsoft.VSTS.Common.Priority"] ?? null,
      url: `https://dev.azure.com/${org}/${project}/_workitems/edit/${raw.id}`,
    };
  });
}
