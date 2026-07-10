// scripts/check-hard-requirements.js
// Synchronous subprocess worker calling Gemini API to extract missing hard requirements.
// Reads JSON payload from stdin.

const fs = require('fs');

async function main() {
  try {
    const inputData = fs.readFileSync(0, 'utf-8');
    const { title, snippet, profile } = JSON.parse(inputData);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log(JSON.stringify({ error: "GEMINI_API_KEY not defined" }));
      process.exit(0);
    }
    
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    
    const prompt = `
List any requirements phrased as mandatory, required, or must-have in this listing that the candidate's profile does NOT show evidence of satisfying. Only include requirements that are specific and consequential (e.g. a named tool, a specific type of hands-on experience, a certification) — ignore generic requirements like 'strong communication skills'.

Job Opportunity Details:
Title: ${title}
Snippet: ${snippet}

Candidate Resume:
${profile.resumeText}

Candidate Skills:
${profile.skills.join(', ')}

Candidate Achievements:
${profile.achievements.join('\n')}

Return strict JSON:
{
  "hardMismatches": ["mismatch 1", "mismatch 2"]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              hardMismatches: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["hardMismatches"]
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const resBody = await response.json();
    const text = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response text from API");
    }
    
    // Print the JSON response directly to stdout
    console.log(text.trim());
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
}

main();
