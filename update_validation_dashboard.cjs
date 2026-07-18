const fs = require('fs');

let code = fs.readFileSync('src/core/validation/ValidationLab/ValidationDashboard.tsx', 'utf8');

// Add benchmark time state and measurement
code = code.replace(
  '  const [isBenchmarking, setIsBenchmarking] = useState(false);',
  `  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkTimeMs, setBenchmarkTimeMs] = useState<number>(0);`
);

code = code.replace(
  /      setTimeout\(\(\) => \{\n        const benchData = BenchmarkRunner\.runGoldenBenchmark\(\{\}, \{\}\);\n        setBenchmarkResults\(benchData\);\n        setIsBenchmarking\(false\);\n      \}, 500\);/g,
  `      const start = performance.now();
      setTimeout(() => {
        const benchData = BenchmarkRunner.runGoldenBenchmark({}, {});
        const end = performance.now();
        setBenchmarkTimeMs(end - start);
        benchData.globalReport.totalTimeMs = end - start;
        setBenchmarkResults(benchData);
        setIsBenchmarking(false);
      }, 50);`
);

fs.writeFileSync('src/core/validation/ValidationLab/ValidationDashboard.tsx', code);
console.log('ValidationDashboard updated');
