const fs = require('fs');
let code = fs.readFileSync('src/pages/MerchantSaaS.tsx', 'utf8');

code = code.replace(
  "import { useSearchParams } from 'react-router-dom';",
  "import { useSearchParams, useNavigate } from 'react-router-dom';"
);

code = code.replace(
  "const { user, signOut } = useAuth();",
  "const { user, signOut } = useAuth();\n  const navigate = useNavigate();"
);

const errorRenderBlock = `  if (error) {
    const isQuotaError = error.toLowerCase().includes('quota') || 
                         error.toLowerCase().includes('resource-exhausted') || 
                         error.toLowerCase().includes('impossible de charger le profil marchand');
                         
    if (isQuotaError) {
      console.log('[AUTH] Quota Firestore détecté.');
      console.log('Affichage du bouton "Se déconnecter".');
    }

    const handleLogout = async () => {
      console.log('--------------------');
      console.log('Déconnexion utilisateur...');
      console.log('--------------------');
      console.log('Nettoyage de la session...');
      console.log('--------------------');
      await signOut();
      console.log('Retour vers /login.');
      navigate('/login');
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-ink mb-4 tracking-tight">Erreur de chargement</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {error}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-ink text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg shadow-ink/20"
            >
              Réessayer
            </button>
            {isQuotaError && (
              <>
                <div className="w-full h-px bg-gray-100 my-4"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all"
                >
                  Se déconnecter
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 text-gray-400 hover:text-gray-600 font-medium text-xs flex items-center justify-center transition-colors"
                >
                  ← Retour à la connexion
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }`;

const oldErrorRenderBlockRegex = /if \(error\) \{\s*return \([\s\S]*?\);\s*\}/m;

code = code.replace(oldErrorRenderBlockRegex, errorRenderBlock);

fs.writeFileSync('src/pages/MerchantSaaS.tsx', code);
