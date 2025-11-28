import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error: API Key missing" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { content, mode, mimeType } = req.body;

    let prompt = "";
    let imageParts = [];

    if (mode === 'humanize') {
        prompt = `You are an expert humanizer... (keep existing prompt)...`;
    } else {
      // --- IMPORTANT: This JSON structure MUST match what App.tsx looks for ---
      prompt = `Analyze this content for AI generation. 
      Return a VALID JSON object (no markdown formatting) with this EXACT structure:
      {
        "detection": {
            "risk_score": (number 0-100),
            "risk_level": ("HIGH", "MEDIUM", or "LOW"),
            "summary": "Short 1-sentence summary",
            "detailed_analysis": "longer explanation"
        }
      }
      Analyze this:`;
      if (mode === 'text') prompt += `\n"${content}"`;
    }

    if ((mode === 'image' || mode === 'file') && mimeType) {
      imageParts = [{ inlineData: { data: content, mimeType: mimeType } }];
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    if (mode === 'humanize') {
      return res.status(200).json({ humanizer: text });
    } else {
        // Clean JSON formatting from Gemini (it often wraps in ```json ... ```)
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);
        return res.status(200).json(data);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze content" });
  }
}
