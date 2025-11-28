import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { content, mode, mimeType } = req.body;

    let prompt = "";
    let imageParts = [];

    // --- PROMPT ENGINEERING ---
    if (mode === 'humanize') {
      prompt = `You are an expert humanizer. Rewrite the following text to make it sound more natural, human, and less robotic. Keep the meaning but vary sentence structure and add human nuances. Return ONLY the rewritten text. Text: ${content}`;
    } else {
      // Detection Prompt (Text, File, or Image)
      prompt = `Analyze the provided content (Text or Image) for AI generation. 
      You are an AI detector. 
      Return a JSON object strictly in this format (no markdown):
      {
        "risk_score": (number 0-100),
        "risk_level": ("HIGH", "MEDIUM", or "LOW"),
        "summary": "Short 1-sentence summary of why it looks like AI or Human",
        "details": ["Bullet point 1 observation", "Bullet point 2 observation"]
      }
      Analyze this content:`;
      
      // If it's just text, append it to the prompt
      if (mode === 'text') {
        prompt += `\n"${content}"`;
      }
    }

    // Handle Images/PDFs
    if ((mode === 'image' || mode === 'file') && mimeType) {
      imageParts = [{ inlineData: { data: content, mimeType: mimeType } }];
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // --- PARSE RESPONSE ---
    if (mode === 'humanize') {
      return res.status(200).json({ humanizer: text });
    } else {
      // Clean up markdown if Gemini adds it (e.g. ```json ... ```)
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      return res.status(200).json(data);
    }

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: 'Failed to analyze' });
  }
}