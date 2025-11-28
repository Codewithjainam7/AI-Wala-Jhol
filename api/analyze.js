import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error: API Key missing" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using 'gemini-2.5-flash' as requested
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { content, mode, mimeType } = req.body;

    let prompt = "";
    let imageParts = [];

    // 2. Construct the Prompt
    if (mode === 'humanize') {
      prompt = `You are an expert humanizer. Rewrite the following text to make it sound more natural, human, and less robotic. Keep the meaning but vary sentence structure, add natural flow, and remove AI-like patterns. Return ONLY the rewritten text as a JSON object with property "humanized_text". Text: ${content}`;
    } else {
      // Detection Prompt
      prompt = `Analyze the provided content for AI generation. 
      You are an AI detector using the Gemini 2.5 Flash model.
      Return a JSON object strictly in this format:
      {
        "detection": {
          "risk_score": (number 0-100),
          "risk_level": ("HIGH", "MEDIUM", or "LOW"),
          "summary": "Short 1-sentence summary of why it looks like AI or Human",
          "detailed_analysis": "Longer explanation with bullet points if needed",
          "signals": ["Specific indicator 1", "Specific indicator 2", "Specific indicator 3"]
        }
      }
      Analyze this content:`;
      
      if (mode === 'text') {
        prompt += `\n"${content}"`;
      }
    }

    // 3. Handle Images or PDFs
    if ((mode === 'image' || mode === 'file') && mimeType) {
      imageParts = [{ inlineData: { data: content, mimeType: mimeType } }];
    }

    // 4. Generate Content
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // 5. Parse Response safely
    let data = {};
    try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        data = JSON.parse(cleanText);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw text:", text);
        // If parsing fails, we still want to return a valid structure to avoid frontend crash
        // For humanize mode, we might just return the raw text if it failed to parse as JSON
        if (mode === 'humanize') {
             data = { humanized_text: text };
        } else {
             // For detection, return a default safe object indicating error in analysis but valid structure
             data = {
                 detection: {
                     risk_score: 0,
                     risk_level: "LOW",
                     summary: "Analysis failed to parse correctly. Please try again.",
                     detailed_analysis: "The AI returned an invalid response format.",
                     signals: []
                 }
             };
        }
    }

    // 6. Handle Humanize vs Detection response structure
    if (mode === 'humanize') {
      return res.status(200).json({ humanizer: data.humanized_text || text });
    } else {
      // --- CRITICAL FIX: Guarantee structure exists ---
      if (!data || typeof data !== 'object') {
          data = {};
      }
      if (!data.detection) {
          data.detection = {};
      }
      // Guarantee detection properties exist with defaults
      data.detection.risk_score = typeof data.detection.risk_score === 'number' ? data.detection.risk_score : 0;
      data.detection.risk_level = data.detection.risk_level || "LOW";
      data.detection.summary = data.detection.summary || "Analysis completed.";
      
      // Guarantee signals is an array
      if (!Array.isArray(data.detection.signals)) {
        data.detection.signals = ["No specific signals detected."]; 
      }
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    // Even in a catastrophic backend error, returning JSON with error field is better
    return res.status(500).json({ error: error.message || 'Analysis failed on server' });
  }
}
