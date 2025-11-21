
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, AIIntent } from "../types";
import { ModelSettings } from "../contexts/SettingsContext";

// Unified interface for AI requests
export const processUserRequest = async (
  contractMarkdown: string,
  userInstruction: string,
  conversationHistory: string[],
  language: 'en' | 'zh',
  settings: ModelSettings,
  comparisonContext?: { original: string; revised: string }
): Promise<AIResponse> => {
  
  let contextBlock = `
    Current Contract (Markdown):
    """
    ${contractMarkdown}
    """
  `;

  if (comparisonContext) {
    contextBlock = `
    MODE: CONTRACT COMPARISON
    
    Original Contract:
    """
    ${comparisonContext.original}
    """

    Revised Contract (Current Focus):
    """
    ${comparisonContext.revised}
    """
    
    The user is asking about the differences or wants to modify the Revised Contract based on the comparison.
    `;
  }

  const systemPrompt = `
    You are an expert legal aide and contract drafter.
    ${language === 'zh' ? "IMPORTANT: Output your response in CHINESE (Simplified). Use Chinese legal terminology." : "Output in English."}

    ${contextBlock}

    User Instruction: "${userInstruction}"

    Conversation Context:
    ${conversationHistory.slice(-5).join('\n')}

    Your Task:
    Determine if the user wants to MODIFY the contract (rewrite/edit) or ANALYZE it (ask questions/risks/summarize).
    
    Output strictly valid JSON.
    
    JSON Schema:
    {
      "intent": "MODIFICATION" | "ANALYSIS",
      "content": "The updated markdown contract OR the analysis answer",
      "highlights": ["exact substring 1", "exact substring 2"] (only for ANALYSIS)
    }

    If MODIFICATION: content should be the FULL updated markdown.
    If ANALYSIS: highlights must be EXACT substrings from the contract text for UI highlighting.
  `;

  // --- GOOGLE GENAI IMPLEMENTATION ---
  if (settings.provider === 'google') {
    // Fallback to process.env.API_KEY if user hasn't set one
    const apiKey = settings.apiKey || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Google API Key is missing. Please configure it in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
        model: settings.modelName || 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, enum: ["MODIFICATION", "ANALYSIS"] },
              content: { type: Type.STRING },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["intent", "content"]
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from Google AI");
      return JSON.parse(text) as AIResponse;
    } catch (error) {
      console.error("Google AI Error:", error);
      throw error;
    }
  } 
  
  // --- GLM (Backend Configured) / OPENAI / CUSTOM IMPLEMENTATION ---
  else {
    let apiKey = settings.apiKey;
    let baseUrl = settings.baseUrl;

    // GLM Specific Configuration (Zhipu AI)
    if (settings.provider === 'glm') {
       // Use GLM specific env key first, then general API_KEY
       apiKey = process.env.GLM_API_KEY || process.env.API_KEY || '';
       // Zhipu / GLM OpenAI compatible endpoint
       baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
    } else if (settings.provider === 'openai') {
       baseUrl = baseUrl || 'https://api.openai.com/v1';
    }

    if (!apiKey) {
      throw new Error(`API Key is missing for provider: ${settings.provider}.`);
    }
    if (!baseUrl) throw new Error("Base URL is required.");

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.modelName || (settings.provider === 'glm' ? 'glm-4' : 'gpt-4-turbo'),
          messages: [
            { role: "system", content: "You are a helpful legal assistant. Output valid JSON only." },
            { role: "user", content: systemPrompt }
          ],
          // GLM/Zhipu supports response_format: { type: "json_object" } for some models, but safe to ask in prompt
          // Note: OpenAI strict JSON mode requires the word 'json' in the prompt, which we have.
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Request failed: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const contentStr = data.choices[0]?.message?.content;
      if (!contentStr) throw new Error("Empty response from API");

      return JSON.parse(contentStr) as AIResponse;
    } catch (error) {
      console.error(`${settings.provider} API Error:`, error);
      // Fallback: sometimes models output markdown code blocks even with json mode
      if (error instanceof SyntaxError) {
          throw new Error("AI response was not valid JSON. Please try again.");
      }
      throw error;
    }
  }
};
