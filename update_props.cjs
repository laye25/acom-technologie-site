const fs = require('fs');
const file = 'src/modules/tailleur/components/TailleurEmbroideryManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `{activeTab === 'learning' && <AeosLearningEngine />}`;
const replacement = `{activeTab === 'learning' && (
        <AeosLearningEngine 
          pendingValidations={pendingValidations} 
          onValidate={(id) => setPendingValidations(prev => prev.filter(v => v.id !== id))}
          onReject={(id) => setPendingValidations(prev => prev.filter(v => v.id !== id))}
        />
      )}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code);
} else {
    console.log('Target not found');
}
