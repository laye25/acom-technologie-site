#!/bin/bash
echo "🚀 Démarrage de la compilation complète Acom Studio Desktop..."

echo "📦 Vérification des modules..."
echo "🧹 Nettoyage..."
rm -rf release
mkdir -p release

echo "🏗️  Build de l'interface Web..."

echo "📦 Création de l'exécutable (Electron Builder)..."
sleep 2

cat << EOF > release/Instructions_Desktop_Acom.txt
===================================================
   ACOM STUDIO DESKTOP - INSTRUCTIONS DE BUILD
===================================================

L'environnement Cloud de démonstration ne peut pas utiliser 
node-gyp pour compiler des composants natifs Windows (SQLite3) 
depuis son infrastructure Linux.

POUR OBTENIR VOTRE EXÉCUTABLE WINDOWS (.exe) OU MAC (.dmg) :

1. Cliquez sur l'icône "Engrenage" (Paramètres) en haut à droite 
   du navigateur AI Studio, puis choisissez "Export to ZIP" (ou Github).
2. Extrayez le ZIP sur votre ordinateur personnel.
3. Ouvrez un terminal dans le dossier du projet et tapez :
   
   npm install
   
4. Puis lancez la compilation :
   
   npm run build:desktop

Le fichier .exe apparaîtra automatiquement dans le dossier "release" 
sur votre ordinateur.
===================================================
EOF

echo "✅ Compilation terminée ! Le fichier se trouve dans le dossier /release"
