const fs = require('fs');

let code = fs.readFileSync('src/core/benchmark/BenchmarkRunner.ts', 'utf8');

// We want to calculate the total time for each pass
code = code.replace(
  '    let failedCount = 0;',
  `    let failedCount = 0;
    const aggregatedPerformance = {
      GeometryPass: 0,
      TopologyPass: 0,
      RibbonPass: 0,
      TatamiPass: 0,
      SatinPass: 0,
      TravelPass: 0
    };`
);

code = code.replace(
  '      results[motif.name] = {',
  `      if (compiledIR.metadata.performance && compiledIR.metadata.performance.passes) {
        const p = compiledIR.metadata.performance.passes;
        if (p.GeometryPass) aggregatedPerformance.GeometryPass += p.GeometryPass;
        if (p.TopologyPass) aggregatedPerformance.TopologyPass += p.TopologyPass;
        if (p.RibbonPass) aggregatedPerformance.RibbonPass += p.RibbonPass;
        if (p.TatamiPass) aggregatedPerformance.TatamiPass += p.TatamiPass;
        if (p.SatinPass) aggregatedPerformance.SatinPass += p.SatinPass;
        if (p.TravelPass) aggregatedPerformance.TravelPass += p.TravelPass;
      }
      results[motif.name] = {`
);

// We also need to add the mock performance data to the aggregate
code = code.replace(
  '        reportList.push(mockItem);',
  `        const p = mockItem.performance.passes;
        if (p.GeometryPass) aggregatedPerformance.GeometryPass += p.GeometryPass;
        if (p.TopologyPass) aggregatedPerformance.TopologyPass += p.TopologyPass;
        if (p.RibbonPass) aggregatedPerformance.RibbonPass += p.RibbonPass;
        if (p.TatamiPass) aggregatedPerformance.TatamiPass += p.TatamiPass;
        if (p.SatinPass) aggregatedPerformance.SatinPass += p.SatinPass;
        if (p.TravelPass) aggregatedPerformance.TravelPass += p.TravelPass;
        reportList.push(mockItem);`
);

code = code.replace(
  '        totalTimeMs: 0',
  `        totalTimeMs: 0,
        aggregatedPerformance`
);

fs.writeFileSync('src/core/benchmark/BenchmarkRunner.ts', code);
console.log('BenchmarkRunner updated with performance aggregation');
