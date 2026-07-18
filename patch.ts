import { ekleDb } from './src/modules/tailleur/services/EKLEService.ts';

export const getEkleKnowledgeString = async () => {
    const components = await ekleDb.components.toArray();
    if (components.length === 0) return "";
    
    let result = "Composants appris par l'IA (EKLE) :\n";
    components.forEach(comp => {
        result += `- ID: ${comp.id}, Catégorie: ${comp.category}, Forme(aspectRatio: ${comp.shapeSignature.aspectRatio.toFixed(2)}, solidité: ${comp.shapeSignature.solidity.toFixed(2)})\n`;
    });
    return result;
};
