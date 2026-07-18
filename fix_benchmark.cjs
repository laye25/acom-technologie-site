const fs = require('fs');
let code = fs.readFileSync('src/core/benchmark/BenchmarkRunner.ts', 'utf8');

code = code.replace('const memoryUsedMB, totalTimeMs: 0 = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;', 'const memoryUsedMB = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;');
fs.writeFileSync('src/core/benchmark/BenchmarkRunner.ts', code);
