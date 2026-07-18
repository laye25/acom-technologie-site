import fs from 'fs';

const file = 'src/modules/tailleur/components/TailleurEmbroideryManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const importAnchor = "import { ObjectDetectionService } from '../services/ObjectDetectionService';";
const importNew = "import { ScientificPassportViewer } from './ScientificPassportViewer';\n" + importAnchor;
if (!content.includes('import { ScientificPassportViewer')) {
  content = content.replace(importAnchor, importNew);
}

const stateAnchor = "  const [showNightResearch, setShowNightResearch] = useState<boolean>(false);";
const stateNew = stateAnchor + "\n  const [showPassportModal, setShowPassportModal] = useState<boolean>(false);";
if (!content.includes('showPassportModal')) {
  content = content.replace(stateAnchor, stateNew);
}

const buttonAnchor = `            <button
              onClick={() => setShowNightResearch(true)}
              className={\`flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer hover:bg-slate-800 text-indigo-400 hover:text-indigo-300\`}
              title="Lancer le laboratoire scientifique nocturne autonome"
            >
              <Moon className="w-3 h-3" />
              <span>NIGHT RESEARCH</span>
            </button>`;

const buttonNew = buttonAnchor + `
            <button
              onClick={() => setShowPassportModal(true)}
              className={\`flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer hover:bg-slate-800 text-emerald-400 hover:text-emerald-300\`}
              title="Consulter le passeport scientifique de l'actif"
            >
              <Fingerprint className="w-3 h-3" />
              <span>PASSEPORT SCIENTIFIQUE</span>
            </button>`;

if (!content.includes('PASSEPORT SCIENTIFIQUE')) {
  content = content.replace(buttonAnchor, buttonNew);
}

const modalAnchor = `{showNightResearch && <NightResearchModal onClose={() => setShowNightResearch(false)} merchantId={merchant.id} />}`;
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
