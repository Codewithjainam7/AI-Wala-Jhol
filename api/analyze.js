import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server Error: API Key missing" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { content, mode, mimeType } = req.body;
    let prompt = "";
    let imageParts = [];

    if (mode === 'humanize') {
      prompt = `You are an expert humanizer. Rewrite this text to sound more natural... Text: ${content}`;
    } else {
      prompt = `Analyze this content for AI generation. Return JSON: { "detection": { "risk_score": 0, "risk_level": "LOW", "summary": "...", "detailed_analysis": "...", "signals": ["signal1"] } }. Content:`;
      if (mode === 'text') prompt += `\n"${content}"`;
    }

    if ((mode === 'image' || mode === 'file') && mimeType) {
      imageParts = [{ inlineData: { data: content, mimeType: mimeType } }];
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    let data = {};
    try {
        data = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
        if (mode !== 'humanize') {
             data = { detection: { risk_score: 0, risk_level: "LOW", summary: "Error parsing AI response.", signals: [] } };
        } else {
             data = { humanized_text: text };
        }
    }

    if (mode === 'humanize') {
      return res.status(200).json({ humanizer: data.humanized_text || text });
    } else {
      if (!data) data = {};
      if (!data.detection) data.detection = {};
      
      // DEFAULTS
      data.detection.risk_score = data.detection.risk_score || 0;
      data.detection.risk_level = data.detection.risk_level || "LOW";
      data.detection.summary = data.detection.summary || "Analysis completed.";
      
      // FORCE ARRAY
      if (!Array.isArray(data.detection.signals)) {
        data.detection.signals = ["No specific signals detected."];
      }
      
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || 'Analysis failed on server' });
  }
}
