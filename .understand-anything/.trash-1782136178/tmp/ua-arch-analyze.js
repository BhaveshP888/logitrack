const fs = require('fs');
const path = require('path');

// Read CLI arguments
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Usage: node ua-arch-analyze.js <input-path> <output-path>");
  process.exit(1);
}

try {
  const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const fileNodes = inputData.fileNodes || [];
  const importEdges = inputData.importEdges || [];

  // Helper to extract directory from path
  const getDir = (filePath) => {
    const dir = path.dirname(filePath);
    return dir === '.' ? '' : dir.replace(/\\/g, '/');
  };

  // 1. Directory Groups
  const directoryGroups = {};
  fileNodes.forEach(node => {
    const dir = getDir(node.filePath);
    if (!directoryGroups[dir]) directoryGroups[dir] = [];
    directoryGroups[dir].push(node.id);
  });

  // 2. Node Type Groups
  const nodeTypeGroups = {};
  fileNodes.forEach(node => {
    const type = node.type;
    if (!nodeTypeGroups[type]) nodeTypeGroups[type] = [];
    nodeTypeGroups[type].push(node.id);
  });

  // 3. Import Adjacency Matrix (adjacency list as map)
  const fileNodesMap = new Map(fileNodes.map(node => [node.id, node]));
  const adjacencyList = {};
  fileNodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  importEdges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].push(edge.target);
    }
  });

  // 4. File Fan-in and Fan-out
  const fileFanIn = {};
  const fileFanOut = {};
  fileNodes.forEach(node => {
    fileFanIn[node.id] = 0;
    fileFanOut[node.id] = 0;
  });
  importEdges.forEach(edge => {
    if (fileFanOut[edge.source] !== undefined) fileFanOut[edge.source]++;
    if (fileFanIn[edge.target] !== undefined) fileFanIn[edge.target]++;
  });

  // 5. Inter-Group Imports & Intra-Group Density
  // Map node.id to its directory group
  const nodeGroupMap = {};
  fileNodes.forEach(node => {
    nodeGroupMap[node.id] = getDir(node.filePath);
  });

  const interGroupImportsMap = {};
  const intraGroupCounts = {}; // dir -> actual internal imports
  
  Object.keys(directoryGroups).forEach(dir => {
    intraGroupCounts[dir] = 0;
  });

  importEdges.forEach(edge => {
    const sourceGroup = nodeGroupMap[edge.source];
    const targetGroup = nodeGroupMap[edge.target];
    if (sourceGroup !== undefined && targetGroup !== undefined) {
      if (sourceGroup === targetGroup) {
        intraGroupCounts[sourceGroup]++;
      } else {
        const key = `${sourceGroup} -> ${targetGroup}`;
        interGroupImportsMap[key] = (interGroupImportsMap[key] || 0) + 1;
      }
    }
  });

  const interGroupImports = Object.entries(interGroupImportsMap).map(([key, count]) => {
    const [source, target] = key.split(' -> ');
    return { source, target, count };
  });

  const intraGroupDensity = {};
  Object.entries(directoryGroups).forEach(([dir, nodes]) => {
    const n = nodes.length;
    const maxPossible = n * (n - 1);
    const actual = intraGroupCounts[dir] || 0;
    intraGroupDensity[dir] = maxPossible > 0 ? actual / maxPossible : 0;
  });

  // 6. Cross-Category Dependency Analysis (by node types)
  const crossCategoryEdges = [];
  importEdges.forEach(edge => {
    const sourceNode = fileNodesMap.get(edge.source);
    const targetNode = fileNodesMap.get(edge.target);
    if (sourceNode && targetNode && sourceNode.type !== targetNode.type) {
      crossCategoryEdges.push({
        source: edge.source,
        sourceType: sourceNode.type,
        target: edge.target,
        targetType: targetNode.type
      });
    }
  });

  // 7. Directory Pattern Matching
  const patternMatches = {
    api: [],
    service: [],
    data: [],
    ui: [],
    middleware: [],
    utility: [],
    config: [],
    test: [],
    types: [],
    hooks: [],
    state: []
  };

  fileNodes.forEach(node => {
    const fp = node.filePath.toLowerCase();
    if (fp.includes('route') || fp.includes('controller') || fp.includes('api/')) {
      patternMatches.api.push(node.id);
    }
    if (fp.includes('service')) {
      patternMatches.service.push(node.id);
    }
    if (fp.includes('db') || fp.includes('database') || fp.includes('model') || fp.includes('schema') || fp.includes('migration') || fp.includes('seed')) {
      patternMatches.data.push(node.id);
    }
    if (fp.includes('component') || fp.includes('view') || fp.includes('page') || fp.includes('layout') || fp.endsWith('.tsx') || fp.endsWith('.html') || fp.endsWith('.css')) {
      patternMatches.ui.push(node.id);
    }
    if (fp.includes('middleware')) {
      patternMatches.middleware.push(node.id);
    }
    if (fp.includes('util') || fp.includes('helper')) {
      patternMatches.utility.push(node.id);
    }
    if (fp.includes('config') || fp.includes('tsconfig') || fp.includes('package.json') || fp.includes('.env') || fp.endsWith('.config.ts') || fp.endsWith('.config.js') || fp.endsWith('.json')) {
      patternMatches.config.push(node.id);
    }
    if (fp.includes('test') || fp.includes('spec') || fp.includes('__tests__')) {
      patternMatches.test.push(node.id);
    }
    if (fp.includes('type') || fp.endsWith('.d.ts')) {
      patternMatches.types.push(node.id);
    }
    if (fp.includes('hook') || fp.includes('use')) {
      patternMatches.hooks.push(node.id);
    }
    if (fp.includes('store') || fp.includes('slice') || fp.includes('context') || fp.includes('state')) {
      patternMatches.state.push(node.id);
    }
  });

  // 8. Deployment Topology Detection
  const deploymentTopology = {
    docker: [],
    vercel: [],
    nginx: [],
    ci_cd: []
  };
  fileNodes.forEach(node => {
    const fp = node.filePath.toLowerCase();
    if (fp.includes('docker')) deploymentTopology.docker.push(node.id);
    if (fp.includes('vercel')) deploymentTopology.vercel.push(node.id);
    if (fp.includes('nginx')) deploymentTopology.nginx.push(node.id);
    if (fp.includes('.github/workflows')) deploymentTopology.ci_cd.push(node.id);
  });

  // 9. Data Pipeline Detection
  const dataPipeline = {
    schemas: [],
    migrations: [],
    seeds: [],
    pipelines: []
  };
  fileNodes.forEach(node => {
    const fp = node.filePath.toLowerCase();
    if (fp.endsWith('.prisma') || fp.includes('schema')) dataPipeline.schemas.push(node.id);
    if (fp.includes('migration')) dataPipeline.migrations.push(node.id);
    if (fp.includes('seed')) dataPipeline.seeds.push(node.id);
    if (node.type === 'pipeline') dataPipeline.pipelines.push(node.id);
  });

  // 10. Documentation Coverage
  const docCoverage = {
    documented: [],
    undocumented: []
  };
  fileNodes.forEach(node => {
    if (node.summary && node.summary !== "No summary available" && node.summary.trim().length > 0) {
      docCoverage.documented.push(node.id);
    } else {
      docCoverage.undocumented.push(node.id);
    }
  });

  // 11. Dependency Direction
  const dependencyDirection = [];
  interGroupImports.forEach(edge => {
    const reverseKey = `${edge.target} -> ${edge.source}`;
    const hasReverse = interGroupImportsMap[reverseKey] !== undefined;
    dependencyDirection.push({
      from: edge.source,
      to: edge.target,
      count: edge.count,
      hasCycle: hasReverse
    });
  });

  // 12. File Stats
  const fileStats = {
    totalFiles: fileNodes.length,
    totalImports: importEdges.length,
    totalDirectories: Object.keys(directoryGroups).length,
    nodeTypeCounts: {}
  };
  fileNodes.forEach(node => {
    fileStats.nodeTypeCounts[node.type] = (fileStats.nodeTypeCounts[node.type] || 0) + 1;
  });

  const results = {
    scriptCompleted: true,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats,
    fileFanIn,
    fileFanOut
  };

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log("Analysis results written successfully.");
  process.exit(0);
} catch (err) {
  console.error("Fatal error during analysis:", err);
  process.exit(1);
}
