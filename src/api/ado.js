const FIELDS = [
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

export async function fetchStories(pat, org, project, areaPath) {
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems
      WHERE [System.TeamProject] = '${project}'
        AND [System.AreaPath] UNDER '${areaPath}'
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

  const ids = workItems.map((w) => w.id);
  const results = [];
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const r = await fetch(
      `https://dev.azure.com/${org}/${project}/_apis/wit/workitems?ids=${batch.join(",")}&fields=${FIELDS}&api-version=7.0`,
      { headers: headers(pat) }
    );
    if (!r.ok) throw new Error(`Batch fetch error ${r.status}`);
    const d = await r.json();
    results.push(...(d.value ?? []));
  }

  return results.map((raw) => {
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
      url: `https://dev.azure.com/${org}/${project}/_workitems/edit/${raw.id}`,
    };
  });
}
