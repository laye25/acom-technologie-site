import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "placeholder-key" });

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  return modelName;
};

export const analyzeOrder = async (order: any, service: any) => {
  try {
    const prompt = `En tant qu'expert en analyse commerciale pour Acom Technologie, analyse cette commande et fournis des informations stratégiques.
    
    Détails de la commande:
    - Service: ${service?.name || 'Inconnu'}
    - Catégorie: ${service?.category || 'Inconnue'}
    - Prix Total: ${order.totalPrice} FCFA
    - Statut: ${order.status}
    - Détails du projet: ${JSON.stringify(order.details)}
    - Options personnalisées: ${JSON.stringify(order.customOptions)}
    
    Fournis une analyse structurée en JSON avec les champs suivants:
    - summary: Un résumé concis du besoin client (max 2 phrases).
    - risks: Liste des risques potentiels (délais, complexité, etc.).
    - upsell: Suggestions de services complémentaires à proposer.
    - advice: Conseils pour l'équipe technique pour réussir ce projet.
    - priority: Niveau de priorité (Basse, Moyenne, Haute) avec justification.
    
    Réponds uniquement en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Error analyzing order:', error);
    return null;
  }
};

export const analyzePlatformPerformance = async (orders: any[], services: any[], expenses: any[]) => {
  try {
    const prompt = `Analyse la performance globale de la plateforme Acom Technologie sur la base des données suivantes:
    
    - Nombre total de commandes: ${orders.length}
    - Chiffre d'affaires total: ${orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0)} FCFA
    - Dépenses totales: ${expenses.reduce((acc, e) => acc + (e.amount || 0), 0)} FCFA
    - Top services: ${services.slice(0, 3).map(s => s.name).join(', ')}
    
    Fournis une analyse stratégique en JSON avec:
    - overview: Résumé de la santé financière.
    - trends: Tendances observées (croissance, baisse).
    - recommendations: 3 actions concrètes pour booster le CA.
    - sentiment: Sentiment général du marché (basé sur le volume).
    
    Réponds uniquement en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Error analyzing platform:', error);
    return null;
  }
};

export const translateText = async (text: string, targetLang: string, context: string = "Site web d'agence digitale Acom Technologie") => {
  try {
    const prompt = `Traduisez le texte suivant en ${targetLang}. 
    Contexte: ${context}. 
    Gardez le ton professionnel, moderne et accueillant de l'agence.
    Si c'est du Wolof, utilisez une orthographe standard et compréhensible.
    
    Texte à traduire: "${text}"
    
    Répondez uniquement avec la traduction, sans guillemets ni explications.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error('Error translating text:', error);
    return text;
  }
};

export const generateDesign = async (prompt: string, image?: string) => {
  try {
    const contents: any[] = [{ text: `Génère un design pour une carte de visite basé sur le prompt suivant: "${prompt}".
      
      Retourne uniquement un tableau JSON d'objets CanvasElement.
      Chaque objet doit avoir les champs nécessaires pour être rendu sur le canvas.
      
      Structure d'un CanvasElement:
      {
        id: string;
        type: 'text' | 'image' | 'shape' | 'path' | 'circle';
        x: number;
        y: number;
        width?: number;
        height?: number;
        text?: string;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
      }
      
      Assure-toi que les coordonnées x et y sont dans la plage 0-600 pour x et 0-350 pour y.
      
      Réponds uniquement en JSON.` }];

    if (image) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(',')[1] || image,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error('Error generating design:', error);
    return [];
  }
};

export const analyzeSEO = async (type: 'service' | 'blog', content: any) => {
  try {
    const prompt = `En tant qu'expert SEO spécialisé dans le marché sénégalais et international, analysez le contenu suivant (${type}) et suggérez des optimisations pour Google.
    
    Contenu à analyser:
    ${JSON.stringify(content)}
    
    Fournissez une réponse structurée en JSON avec les champs suivants:
    - titleTag: Un titre optimisé (max 60 caractères)
    - metaDescription: Une méta-description percutante (max 160 caractères)
    - primaryKeywords: Liste de 5 mots-clés principaux
    - secondaryKeywords: Liste de 5 mots-clés secondaires
    - localOptimization: Conseils spécifiques pour le référencement au Sénégal (Dakar, Touba, etc.)
    - contentSuggestions: 3 suggestions pour améliorer le contenu textuel
    
    Répondez uniquement en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    return null;
  }
};

export const generateOrderDraft = async (orderData: any, service: any) => {
  try {
    const prompt = `En tant qu'expert technique et chef de projet chez Acom Technologie, analysez ce besoin client et générez un premier brouillon de cahier des charges et une estimation de complexité.
    
    Service sélectionné: ${service?.name || 'Inconnu'}
    Détails du projet: ${JSON.stringify(orderData.details)}
    Budget indicatif: ${orderData.totalPrice} FCFA
    
    Fournissez une réponse structurée en JSON avec les champs suivants:
    - title: Un titre professionnel pour le projet.
    - objectives: Liste des objectifs principaux du projet.
    - specifications: Liste des spécifications techniques recommandées.
    - complexity: Estimation de la complexité (Faible, Modérée, Élevée, Très Élevée).
    - duration: Durée estimée de réalisation (ex: 2-3 semaines).
    - phases: Liste des phases du projet (ex: Design, Développement, Tests, Déploiement).
    - recommendations: Liste de 2-3 conseils stratégiques pour le client.
    
    Répondez uniquement en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Error generating order draft:', error);
    return null;
  }
};
