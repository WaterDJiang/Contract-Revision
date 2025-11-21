import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const processUserRequest = async (
  contractMarkdown: string,
  userInstruction: string,
  conversationHistory: string[],
  language: 'en' | 'zh'
): Promise<AIResponse> => {
  
  const languageInstruction = language === 'zh' 
    ? "IMPORTANT: Output your response (content and analysis) in CHINESE (Simplified). If generating a contract, use Chinese legal terminology." 
    : "Output in English.";

  const prompt = `
    You are an expert legal aide and contract drafter.
    
    ${languageInstruction}

    Current Contract (Markdown):
    """
    ${contractMarkdown}
    """

    User Instruction: "${userInstruction}"

    Conversation Context:
    ${conversationHistory.slice(-5).join('\n')}

    Your Task:
    Determine if the user wants to MODIFY the contract (rewrite/edit) or ANALYZE it (ask questions/risks/summarize).

    1. If MODIFICATION:
       - intent: "MODIFICATION"
       - content: The FULL updated contract in Markdown. Keep structure unless asked to change.
       - highlights: []
    
    2. If ANALYSIS (e.g. "What are the risks?", "Explain this clause"):
       - intent: "ANALYSIS"
       - content: Your concise answer to the user.
       - highlights: An array of EXACT substrings from the "Current Contract" that are relevant to your answer (e.g. risky clauses). These will be highlighted for the user. Extracted highlights must be EXACT characters from the contract text, preserving markdown syntax.

    Output strictly valid JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ["MODIFICATION", "ANALYSIS"] },
            content: { type: Type.STRING },
            highlights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["intent", "content"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Error processing request:", error);
    throw error;
  }
};