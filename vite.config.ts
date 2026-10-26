import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-server',
    configureServer(server) {
      server.middlewares.use('/api/gemini/career-advice', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { studentName, targetRole, university, major, matchedSkills, gapSkills, jobTitle, company, matchPercentage } = JSON.parse(body || '{}');

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                isFallback: true,
                message: 'No GEMINI_API_KEY found in environment, using local AI Advisor',
                advice: null
              }));
              return;
            }

            const ai = new GoogleGenAI({ apiKey });

            const prompt = `You are the Lead Technical Recruiter and Career Mentor for SkillBridge.
Analyze this student match for a job opportunity:
- Student: ${studentName} (${major} at ${university})
- Target Career Track: ${targetRole}
- Job Opportunity: ${jobTitle} at ${company}
- Computed Algorithmic Match: ${matchPercentage}%
- Current Matched Skills: ${matchedSkills?.join(', ') || 'None specified'}
- Identified Skill Gaps: ${gapSkills?.join(', ') || 'None'}

Please provide a structured response in valid JSON with these exact keys:
{
  "executiveSummary": "2-3 sentences summarizing the fit and competitive advantage",
  "skillBridgePlan": [
    { "step": 1, "skill": "skill name", "action": "concrete 2-week learning goal or project", "recommendedResource": "e.g. Official Docs or Course" }
  ],
  "tailoredResumeBullet": "One strong resume bullet point highlighting their matched skills for this specific role",
  "interviewPrepTip": "One high-yield technical question or interview advice regarding their gap and matched skills"
}
Return ONLY valid JSON, with no markdown code fences or conversational intro.`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json'
              }
            });

            const resultText = response.text || '{}';
            let parsed;
            try {
              parsed = JSON.parse(resultText);
            } catch (e) {
              parsed = { executiveSummary: resultText };
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              isFallback: false,
              advice: parsed
            }));
          } catch (err: any) {
            console.error('Gemini API middleware error:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              isFallback: true,
              error: err.message || 'Gemini analysis failed',
              advice: null
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
