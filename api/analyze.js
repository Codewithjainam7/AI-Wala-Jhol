import { GoogleGenerativeAI } from "@google/generative-ai";

// CRITICAL FIX: Add size limit configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase from default 1mb to 50mb
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server Error: API Key missing" });

    const { content, mode, mimeType } = req.body;

    // CRITICAL FIX: Validate content size BEFORE processing
    if (!content) {
      return res.status(400).json({ error: "No content provided" });
    }

    // Check content size (base64 encoded data)
    const contentSize = content.length;
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    
    if (contentSize > maxSize) {
      return res.status(413).json({ 
        error: "Content too large. Please use a smaller file or less text.",
        details: `Content size: ${(contentSize / 1024 / 1024).toFixed(2)}MB, Max: 20MB`
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    let prompt = "";
    let imageParts = [];

    if (mode === 'humanize') {
      // Limit text for humanization to avoid timeouts
      const textToHumanize = content.length > 5000 ? content.substring(0, 5000) : content;
      prompt = `You are an expert humanizer. Rewrite this text to sound more natural, varying sentence structure and removing AI patterns. Return JSON with: { "humanized_text": "...", "changes_made": ["change1", "change2"], "improvement_score": 85 }. Text: ${textToHumanize}`;
    } else {
      prompt = `Analyze this content for AI generation. Return JSON with this EXACT structure: 
{
  "detection": {
    "risk_score": 0-100,
    "risk_level": "LOW" | "MEDIUM" | "HIGH",
    "summary": "brief summary",
    "detailed_analysis": "detailed explanation",
    "signals": ["signal1", "signal2"],
    "is_ai_generated": true/false,
    "ai_probability": 0-1,
    "human_probability": 0-1,
    "confidence": "high" | "medium" | "low",
    "model_suspected": "model name or null"
  },
  "recommendations": ["rec1", "rec2"]
}

Content to analyze:`;
      
      if (mode === 'text') {
        // Limit text analysis to first 10000 chars to avoid payload issues
        const textToAnalyze = content.length > 10000 ? content.substring(0, 10000) : content;
        prompt += `\n"${textToAnalyze}"`;
      }
    }

    if ((mode === 'image' || mode === 'file') && mimeType) {
      imageParts = [{ inlineData: { data: content, mimeType: mimeType } }];
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    let data = {};
    try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        data = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        if (mode !== 'humanize') {
             data = { 
               detection: { 
                 risk_score: 0, 
                 risk_level: "LOW", 
                 summary: "Error parsing AI response.", 
                 detailed_analysis: "The analysis could not be completed.",
                 signals: ["Parse error occurred"],
                 is_ai_generated: false,
                 ai_probability: 0,
                 human_probability: 1,
                 confidence: "low",
                 model_suspected: null
               },
               recommendations: ["Try analyzing again"]
             };
        } else {
             data = { 
               humanized_text: text,
               changes_made: ["Unable to parse structured changes"],
               improvement_score: 0
             };
        }
    }

    if (mode === 'humanize') {
      return res.status(200).json({ 
        humanizer: {
          humanized_text: data.humanized_text || text,
          changes_made: Array.isArray(data.changes_made) ? data.changes_made : [],
          improvement_score: data.improvement_score || 0,
          notes: data.notes || null
        }
      });
    } else {
      if (!data) data = {};
      if (!data.detection) data.detection = {};
      
      data.detection.risk_score = typeof data.detection.risk_score === 'number' ? data.detection.risk_score : 0;
      data.detection.risk_level = data.detection.risk_level || "LOW";
      data.detection.summary = data.detection.summary || "Analysis completed.";
      data.detection.detailed_analysis = data.detection.detailed_analysis || "No detailed analysis available.";
      data.detection.confidence = data.detection.confidence || "low";
      data.detection.is_ai_generated = typeof data.detection.is_ai_generated === 'boolean' ? data.detection.is_ai_generated : false;
      data.detection.ai_probability = typeof data.detection.ai_probability === 'number' ? data.detection.ai_probability : 0;
      data.detection.human_probability = typeof data.detection.human_probability === 'number' ? data.detection.human_probability : 1;
      data.detection.model_suspected = data.detection.model_suspected || null;
      
      if (!Array.isArray(data.detection.signals) || data.detection.signals.length === 0) {
        data.detection.signals = ["No specific signals detected"];
      }
      
      if (!Array.isArray(data.recommendations)) {
        data.recommendations = ["Review content manually", "Consider context"];
      }
      
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Analysis failed on server',
      detection: {
        risk_score: 0,
        risk_level: "LOW",
        summary: "Server error occurred",
        detailed_analysis: "The analysis could not be completed due to a server error.",
        signals: ["Server error"],
        is_ai_generated: false,
        ai_probability: 0,
        human_probability: 1,
        confidence: "low",
        model_suspected: null
      },
      recommendations: ["Try again later"]
    });
  }
}
