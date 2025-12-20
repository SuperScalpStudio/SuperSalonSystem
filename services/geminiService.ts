
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExpandedContent } from "../types";

// Removed global AI instance to prevent stale API keys or race conditions.
// Each function now initializes its own instance right before the API call.

export const expandIdea = async (seed: string): Promise<ExpandedContent> => {
  // Initialize AI client within the function to ensure up-to-date API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Expand this idea into a comprehensive knowledge map: "${seed}"`,
    config: {
      systemInstruction: "You are a master of unfolding simple concepts into complex, multi-layered explanations. Provide structured data for visualizations (D3 nodes/links) and a rich narrative. Ensure 'keyInsights' use a value between 1 and 100.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          narrative: { type: Type.STRING },
          keyInsights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["label", "value"]
            }
          },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                group: { type: Type.NUMBER }
              },
              required: ["id", "group"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING }
              },
              required: ["source", "target"]
            }
          },
          imagePrompt: { type: Type.STRING, description: "A highly detailed visual prompt for an image generator based on this concept." }
        },
        required: ["title", "summary", "narrative", "keyInsights", "nodes", "links", "imagePrompt"]
      }
    }
  });

  // Extracting text output directly from GenerateContentResponse as per guidelines
  return JSON.parse(response.text || '{}') as ExpandedContent;
};

export const generateImageForIdea = async (prompt: string): Promise<string> => {
  // Initialize AI client within the function for consistency and freshness
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Cinematic, high-fidelity visualization of: ${prompt}. Artistic and symbolic style.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  // Iterate through parts to find the inline image data
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateSpeech = async (text: string): Promise<string> => {
  // Initialize AI client within the function scope
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this summary elegantly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  // Accessing audio data from the candidates array
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};
