import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  }
};
