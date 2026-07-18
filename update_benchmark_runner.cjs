const fs = require('fs');

let code = fs.readFileSync('src/core/benchmark/BenchmarkRunner.ts', 'utf8');

code = code.replace(
  '    const globalReport = {\n        total: reportList.length,\n        passed: passedCount,\n        failed: failedCount,\n        averageScore: totalScore / reportList.length,\n        worstCases: reportList.slice(0, 10)\n    };',
  `    const memoryInfo = (performance as any).memory;
    const memoryUsedMB = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
    
    const globalReport = {
        total: reportList.length,
        passed: passedCount,
        failed: failedCount,
        averageScore: totalScore / reportList.length,
        worstCases: reportList.slice(0, 10),
        memoryUsedMB
    };`
);

fs.writeFileSync('src/core/benchmark/BenchmarkRunner.ts', code);
console.log('BenchmarkRunner updated');
