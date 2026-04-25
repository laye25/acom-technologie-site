#!/bin/bash
echo "🚀 Démarrage de la compilation complète Acom Studio Desktop..."

# 1. Installation des dépendances
echo "📦 Installation des modules..."
npm install

# 2. Nettoyage des anciens builds
echo "🧹 Nettoyage..."
rm -rf dist release

# 3. Build de l'application Web (React + Vite)
echo "🏗️  Build de l'interface Web..."
npm run build

# 4. Packaging Electron
echo "📦 Création de l'exécutable (Electron Builder)..."
# On cible le format portable pour Windows par défaut pour plus de simplicité
npx electron-builder --win portable

echo "✅ Compilation terminée ! Le fichier se trouve dans le dossier /release"
