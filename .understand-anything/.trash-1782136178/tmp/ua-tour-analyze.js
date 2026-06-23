const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node ua-tour-analyze.js <input-path> <output-path>');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  let data;
  try {
    const raw = fs.readFileSync(inputPath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read/parse input file: ${err.message}`);
    process.exit(1);
  }

  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const layers = data.layers || [];

  // 1. Build adjacency list and compute degrees
  const adj = {};
  const revAdj = {};
  const fanIn = {};
  const fanOut = {};

  for (const node of nodes) {
    adj[node.id] = [];
    revAdj[node.id] = [];
    fanIn[node.id] = 0;
    fanOut[node.id] = 0;
  }

  for (const edge of edges) {
    const u = edge.source;
    const v = edge.target;
    if (adj[u] && adj[v]) {
      adj[u].push(v);
      revAdj[v].push(u);
      fanOut[u]++;
      fanIn[v]++;
    }
  }

  // 2. Fan-in and Fan-out rankings
  const fanInRanking = Object.keys(fanIn)
    .map(id => ({ id, count: fanIn[id] }))
    .sort((a, b) => b.count - a.count);

  const fanOutRanking = Object.keys(fanOut)
    .map(id => ({ id, count: fanOut[id] }))
    .sort((a, b) => b.count - a.count);

  // 3. Entry point candidates
  // Let's check files with 0 or low in-degree, or explicitly tagged "entry-point", or known entry paths.
  const entryPointCandidates = [];
  for (const node of nodes) {
    if (node.type === 'document' && node.name.toLowerCase() === 'readme.md') {
      entryPointCandidates.push(node.id);
    } else if (
      node.filePath === 'frontend/src/main.tsx' ||
      node.filePath === 'backend/src/server.ts' ||
      (node.tags && node.tags.includes('entry-point'))
    ) {
      entryPointCandidates.push(node.id);
    }
  }
  // Add other 0 in-degree files
  for (const node of nodes) {
    if (node.type === 'file' && fanIn[node.id] === 0 && !entryPointCandidates.includes(node.id)) {
      entryPointCandidates.push(node.id);
    }
  }

  // 4. BFS Traversal from entry points
  const bfsTraversal = {};
  for (const entryId of entryPointCandidates) {
    if (!adj[entryId]) continue;
    const visited = [];
    const depths = {};
    const queue = [entryId];
    depths[entryId] = 0;
    const visitedSet = new Set([entryId]);

    while (queue.length > 0) {
      const curr = queue.shift();
      visited.push(curr);
      const currDepth = depths[curr];

      for (const neighbor of adj[curr]) {
        if (!visitedSet.has(neighbor)) {
          visitedSet.add(neighbor);
          depths[neighbor] = currDepth + 1;
          queue.push(neighbor);
        }
      }
    }
    bfsTraversal[entryId] = {
      visitedNodeIds: visited,
      depths
    };
  }

  // 5. Non-code files
  const nonCodeFiles = {};
  const nonCodeExtensions = ['.md', '.json', '.yml', '.yaml', '.dockerignore', 'dockerfile', '.conf', '.toml', '.sql'];
  for (const node of nodes) {
    const ext = path.extname(node.filePath || '').toLowerCase();
    const isNonCodeType = ['document', 'config', 'service', 'pipeline', 'table', 'schema'].includes(node.type);
    const isNonCodeExt = nonCodeExtensions.includes(ext) || node.name.toLowerCase() === 'dockerfile';
    if (isNonCodeType || isNonCodeExt) {
      nonCodeFiles[node.id] = {
        name: node.name,
        type: node.type,
        filePath: node.filePath,
        summary: node.summary
      };
    }
  }

  // 6. Tightly Coupled Clusters
  // Simple clustering by folder prefix or strongly connected components.
  // Let's do simple folder-based clusters first.
  const folderClusters = {};
  for (const node of nodes) {
    if (!node.filePath) continue;
    const dir = path.dirname(node.filePath).replace(/\\/g, '/');
    if (!folderClusters[dir]) {
      folderClusters[dir] = [];
    }
    folderClusters[dir].push(node.id);
  }
  const clusters = Object.keys(folderClusters).map(dir => ({
    name: dir,
    nodeIds: folderClusters[dir]
  }));

  // 7. Layers map
  const layersMap = {};
  for (const layer of layers) {
    layersMap[layer.id] = {
      name: layer.name,
      description: layer.description,
      nodeIds: layer.nodeIds
    };
  }

  // 8. Node summary index
  const nodeSummaryIndex = {};
  for (const node of nodes) {
    nodeSummaryIndex[node.id] = node.summary || 'No summary available';
  }

  const results = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal,
    nonCodeFiles,
    clusters,
    layers: layersMap,
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Successfully wrote results to ${outputPath}`);
  } catch (err) {
    console.error(`Failed to write output file: ${err.message}`);
    process.exit(1);
  }
}

main();
