import fs from 'fs';

const file = 'src/modules/tailleur/components/TailleurEmbroideryManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const importAnchor = "import { ObjectDetectionService } from '../services/ObjectDetectionService';";
const importNew = "import { ScientificPassportViewer } from './ScientificPassportViewer';\n" + importAnchor;
if (!content.includes('import { ScientificPassportViewer')) {
  content = content.replace(importAnchor, importNew);
}

const stateAnchor = "  const [showNightResearch, setShowNightResearch] = useState(false);";
const stateNew = stateAnchor + "\n  const [showPassportModal, setShowPassportModal] = useState(false);";
if (!content.includes('showPassportModal')) {
  content = content.replace(stateAnchor, stateNew);
}

const buttonAnchor = `<button
            onClick={() => setShowNightResearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm transition-colors font-medium border border-indigo-500/20"
          >
            <Moon className="w-4 h-4" /> Night Research
          </button>`;
const buttonNew = buttonAnchor + `\n          <button
            onClick={() => setShowPassportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm transition-colors font-medium border border-emerald-500/20"
          >
            <Fingerprint className="w-4 h-4" /> Scientific Passport
          </button>`;
if (!content.includes('Scientific Passport')) {
  content = content.replace(buttonAnchor, buttonNew);
}

const modalAnchor = `{showNightResearch && (
        <NightResearchModal onClose={() => setShowNightResearch(false)} />
      )}`;
const modalNew = modalAnchor + `\n      {showPassportModal && (
        <ScientificPassportViewer 
          passportId={scientificAsset?.latestCertifiedRevisionId ? "PPT-" + scientificAsset.latestCertifiedRevisionId : "PPT-DEMO"} 
          onClose={() => setShowPassportModal(false)} 
        />
      )}`;
if (!content.includes('<ScientificPassportViewer')) {
  content = content.replace(modalAnchor, modalNew);
}

fs.writeFileSync(file, content);
