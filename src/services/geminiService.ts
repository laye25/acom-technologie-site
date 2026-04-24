import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface LayoutSuggestion {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize?: number;
  fill?: string;
}

export const geminiService = {
  generateText: async (prompt: string): Promise<string> => {
    try {
      const ai = getAiClient();
      if (!ai) return "L'assistant IA n'est pas configuré (Clé API manquante).";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "";
    } catch (e) {
      console.error("Failed to generate text with Gemini", e);
      return "";
    }
  },

  improveLayout: async (elements: any[], canvasWidth: number, canvasHeight: number): Promise<LayoutSuggestion[]> => {
    const prompt = `
      Tu es un expert en design graphique. Analyse les éléments suivants d'un design de carte de visite (${canvasWidth}x${canvasHeight}px) et suggère des positions et styles améliorés pour créer une mise en page professionnelle, équilibrée et esthétique.
      
      Éléments actuels :
      ${JSON.stringify(elements.map(el => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        text: el.text,
        fontSize: el.fontSize,
        rotation: el.rotation
      })), null, 2)}
      
      Règles :
      1. Garde les identifiants (id) inchangés.
      2. Optimise l'alignement (centrage, grille) et la hiérarchie visuelle.
      3. Assure-toi que les textes importants (nom, titre) sont mis en avant.
      4. Respecte les dimensions du canevas.
      5. Retourne uniquement un tableau JSON d'objets avec les propriétés modifiées.
    `;

    const ai = getAiClient();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              rotation: { type: Type.NUMBER },
              fontSize: { type: Type.NUMBER },
              fill: { type: Type.STRING }
            },
            required: ["id", "x", "y"]
          }
        }
      }
    });

    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return [];
    }
  },

  chatBusinessPerformance: async (orders: any[], expenses: any[], newMessage: string, chatSessionId: string): Promise<string> => {
    try {
      const ai = getAiClient();
      if (!ai) return "L'assistant IA n'est pas configuré.";

      // In a real app, you'd manage chat sessions in memory or storage
      // For this implementation, we initialize a chat session if it doesn't exist
      // Since ai.chats is not imported in the current structure, I'll use a functional approach as per SKILL.md
      
      const promptContext = `
        Tu es un analyste financier expert pour Acom Technologie. Utilise les données suivantes comme base de connaissance pour répondre aux questions de l'administrateur.
        
        Commandes (historique complet) :
        ${JSON.stringify(orders.slice(-50), null, 2)}

        Dépenses (historique complet) :
        ${JSON.stringify(expenses.slice(-50), null, 2)}

        Réponds de manière concise, professionnelle et orientée action.
      `;

      // Simplified chat approach:
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
            { role: 'user', parts: [{ text: `CONTEXT:\n${promptContext}\n\nUSER MESSAGE:\n${newMessage}` }] }
        ],
      });

      return response.text || "Impossible de générer la réponse.";
    } catch (e) {
      console.error("Failed to chat with business data", e);
      return "Une erreur est survenue lors de la conversation.";
    }
  },

  adjustElementProperty: async (elements: any[], targetElementId: string, instruction: string): Promise<LayoutSuggestion[]> => {
    try {
      const ai = getAiClient();
      if (!ai) return [];

      const prompt = `
        Tu es un co-pilote AI expert en design dans une application de création graphique.
        Analyse la scène et l'instruction demandée, et ajuste uniquement la propriété de l'élément cible nécessaire.
        
        Scène : ${JSON.stringify(elements)}
        Élément cible : ${targetElementId}
        Instruction utilisateur : "${instruction}"
        
        Retourne un JSON avec les modifications nécessaires. Si aucune modification n'est nécessaire, retourne [].
        Format attendu : [{ "id": "${targetElementId}", "property": "value" }]
        Exemple : [{ "id": "text-1", "fontSize": 24 }]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to adjust element property", e);
      return [];
    }
  },

  analyzeBusinessPerformance: async (orders: any[], expenses: any[], tenantId: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders, expenses, tenantId })
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'analyse');
      
      const data = await response.json();
      return data.analysis;
    } catch (e) {
      console.error("Failed to analyze business performance", e);
      return "Analyse impossible pour le moment.";
    }
  }
};
