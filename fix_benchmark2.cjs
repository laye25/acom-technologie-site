const fs = require('fs');
let code = fs.readFileSync('src/core/benchmark/BenchmarkRunner.ts', 'utf8');

code = code.replace(
  '        memoryUsedMB, totalTimeMs: 0',
  '        memoryUsedMB,\n        totalTimeMs: 0'
);

fs.writeFileSync('src/core/benchmark/BenchmarkRunner.ts', code);
