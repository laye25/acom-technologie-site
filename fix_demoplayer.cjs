const fs = require('fs');
const file = 'src/ai-demo/components/DemoPlayerModal.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace DemoStep with TimelineStep
code = code.replace(/import \{ DemoProject, DemoStep \} from '\.\.\/types';/, "import { DemoProject, TimelineStep } from '../types';");
// It might import from types/index.ts or types/sai.ts
code = code.replace(/import \{ DemoProject, DemoStep \}/, "import { DemoProject, TimelineStep }");

code = code.replace(/const steps = project\.scenario\?\.steps \|\| \[\];/g, "const steps = project.timelineSteps || [];");
code = code.replace(/const p = \{ \.\.\.project \};\s+if \(\!p\.scenario\) return;\s+p\.scenario\.steps = UIAnalyzer\.optimizePedagogy\(p\.scenario\.steps\);\s+p\.scenario\.steps = UIAnalyzer\.identifyDeadTimes\(p\.scenario\.steps\);\s+setProject\(p\);/, "const p = AiEngine.autoOptimizeProject(project);\n    setProject(p);");

// Ensure AiEngine is imported
if (!code.includes('import { AiEngine }')) {
    code = code.replace(/import \{ UIAnalyzer \} from '\.\.\/engines\/UIAnalyzer';/, "import { UIAnalyzer } from '../engines/UIAnalyzer';\nimport { AiEngine } from '../engines/AiEngine';");
}

fs.writeFileSync(file, code);
