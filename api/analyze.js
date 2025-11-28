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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Force JSON output
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
      You are an AI detector using the Gemini 1.5 Flash model.
      Return a JSON object strictly in this format:
      {
        "detection": {
          "risk_score": (number 0-100),
          "risk_level": ("HIGH", "MEDIUM", or "LOW"),
          "summary": "Short 1-sentence summary of why it looks like AI or Human",
          "detailed_analysis": "Longer explanation with bullet points if needed"
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
    let data;
    try {
        // Remove markdown code blocks if present (```json ... ```)
        const cleanText = text.replace(/```json|```/g, '').trim();
        data = JSON.parse(cleanText);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw text:", text);
        return res.status(500).json({ error: "AI returned invalid JSON", raw: text });
    }

    // 6. Handle Humanize vs Detection response structure
    if (mode === 'humanize') {
      return res.status(200).json({ humanizer: data.humanized_text || text });
    } else {
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || 'Analysis failed on server' });
  }
}

