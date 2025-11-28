
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
  comparisonContext?: { original: string; revised: string },
  selectedContext?: string
): Promise<AIResponse> => {
  const draftIntentRegex = /(起草|草拟|擬|草擬|生成|制作|创建|寫|寫一份|写一份|写一个|給我|给我).*(合同|協議|协议|模板|範本|范本|證書|证书|證明|证明|授權書|授权书|聲明|声明|函)|\b(template|draft|generate|create|write)\b.*\b(contract|agreement|certificate|incumbency|resolution|power\s+of\s+attorney)\b|Certificate\s+of\s+Incumbency/i;
  const intentHint = draftIntentRegex.test(userInstruction) ? 'DRAFT_REQUEST' : 'NONE';
  
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

  if (selectedContext) {
    contextBlock += `
    Selected Context:
    """
    ${selectedContext}
    """
    `;
  }

  const systemContent = `
    You are an expert legal aide and contract drafter.
    Output language: if language == 'zh', use Chinese (Simplified); otherwise, use English.

    Advisory Requirements:
    1. Act as a professional legal advisor and proactively flag missing clauses or risks with actionable suggestions.
    2. Keep advice professional but explain in plain, accessible language so non-experts understand.
    3. Treat the user as a beginner and guide them step-by-step to complete their contract tasks.

    Change Principles:
    - Modify only the parts explicitly requested by the user; keep all unrelated text identical.
    - Preserve existing Markdown structure, headings, numbering, bullets, and whitespace outside the modified scope.
    - Do not reformat or rewrite non-target sections; avoid global style normalizations during modification.
    - If scope is unclear, prefer ANALYSIS with clarifying questions rather than broad edits.
    4. After each contract modification, briefly explain the legal logic and reasons for the changes.

    Contract Generation & Review Checklist:
    - Parties and definitions: use precise legal names, authority, and clear definitions.
    - Scope/services: deliverables, milestones, acceptance criteria, change control.
    - Commercial terms: pricing model, payment terms, taxes, late fees, invoicing cadence.
    - Term/termination: initial term, renewal, termination for cause/convenience, suspension.
    - Intellectual property: ownership of work product, background/foreground IP, license scope.
    - Confidentiality & data protection: PII/PHI handling, security measures, breach notification.
    - Warranties & disclaimers: performance, fitness, domain-specific assurances.
    - Liability allocation: limitation of liability caps, exclusions, indemnities, remedies.
    - Compliance: export controls, sanctions, privacy laws, anti-bribery, industry regulations.
    - Service levels & support: SLAs, uptime, response times, maintenance windows.
    - Subcontracting/assignment: restrictions, consent requirements, audit/inspection rights.
    - Governing law, jurisdiction, dispute resolution: venue, arbitration/mediation rules.
    - Force majeure, notices, entire agreement, severability, survival of key obligations.
    - Insurance: required coverages and evidence of insurance.
    - Privacy/DPA: processing roles, cross-border transfers, subprocessors, data subject rights.
    - Third-party/open-source components: licensing and compliance.
    - Execution: effective date, counterparts, electronic signatures.

    Risk & Issue Detection:
    - Flag missing clauses, ambiguous terms, conflicting obligations, and non-standard positions.
    - Highlight unlimited liability, broad IP assignments, perpetual/irrevocable licenses, unilateral change clauses, auto-renewal traps.

    Clarification & Guidance:
    - Ask targeted questions to fill gaps (e.g., governing law, IP ownership, SLA needs).
    - Provide step-by-step guidance to help the user complete their contract tasks.

    Your Task:
    Determine if the user wants to MODIFY the contract (rewrite/edit) or ANALYZE it (ask questions/risks/summarize).
    MODE_HINT: ${intentHint}

    Output strictly valid JSON.

    JSON Schema:
    {
      "intent": "MODIFICATION" | "ANALYSIS",
      "content": "The updated markdown contract OR the analysis answer",
      "highlights": ["exact substring 1", "exact substring 2"] (only for ANALYSIS)
    }

    If MODIFICATION: content should be the FULL updated markdown with minimal diffs outside the requested scope.
    If ANALYSIS: highlights must be EXACT substrings from the contract text for UI highlighting.

    Intent Override Policy:
    - If MODE_HINT == 'DRAFT_REQUEST', you MUST set intent = 'MODIFICATION' and return a COMPLETE Markdown contract.
    - Do NOT ask questions; assume reasonable defaults and use placeholders when details are missing.
    - Keep clean Markdown structure with headings, lists, and numbered sections.
  `;

  // --- GOOGLE GENAI IMPLEMENTATION ---
  if (settings.provider === 'google') {
    const apiKey = settings.keys?.google || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Google API Key is missing. Please configure it in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
        model: settings.modelName || 'gemini-2.5-flash',
        contents: `${systemContent}\n\n${contextBlock}\n\nUser Instruction: "${userInstruction}"\n\nConversation Context:\n${conversationHistory.slice(-10).join('\n')}`,
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
    let apiKey = '';
    let baseUrl = settings.baseUrl;

    const getEnvKey = (...names: string[]) => {
      const im = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
      const w = typeof window !== 'undefined' ? (window as any) : {};
      for (const n of names) {
        const v = im?.[n] || w?.[n] || w?.__ENV__?.[n] || (w?.process?.env?.[n]) || (typeof process !== 'undefined' ? (process as any).env?.[n] : undefined);
        if (v) return v as string;
      }
      return '';
    };

    // GLM Specific Configuration (Zhipu AI)
    if (settings.provider === 'glm') {
       apiKey = settings.keys?.glm || getEnvKey('VITE_GLM_API_KEY', 'GLM_API_KEY');
       baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
    } else if (settings.provider === 'openai') {
       apiKey = settings.keys?.openai || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) || process.env.OPENAI_API_KEY || '';
       baseUrl = baseUrl || 'https://api.openai.com/v1';
    } else if (settings.provider === 'custom') {
       apiKey = settings.keys?.custom || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_CUSTOM_API_KEY : undefined) || process.env.CUSTOM_API_KEY || '';
    }

    if (!apiKey) throw new Error(`API Key is missing for provider: ${settings.provider}.`);
    if (!baseUrl) throw new Error("Base URL is required.");

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.modelName || (settings.provider === 'glm' ? 'glm-4.6' : 'gpt-4-turbo'),
          messages: [
            { role: "system", content: systemContent },
            ...conversationHistory.slice(-10).map(h => {
              const [prefix, ...rest] = h.split(':');
              const content = rest.join(':').trim();
              const role = (prefix || '').trim().toUpperCase() === 'AI' ? 'assistant' : 'user';
              return { role, content };
            }),
            { role: "user", content: contextBlock },
            { role: "user", content: userInstruction }
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
