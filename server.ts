import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { mysqlBackend, MySQLConfig } from './server/db/mysql';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize MySQL backend connection on server start
mysqlBackend.initialize().catch(err => {
  console.warn('[Server] MySQL initialization warning:', err.message);
});

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mysql: mysqlBackend.getStatus()
  });
});

// MySQL Backend Status
app.get('/api/mysql/status', (req: Request, res: Response) => {
  res.json(mysqlBackend.getStatus());
});

// MySQL Logs
app.get('/api/mysql/logs', (req: Request, res: Response) => {
  res.json({ logs: mysqlBackend.getLogs() });
});

// Dynamic MySQL Connection & Testing
app.post('/api/mysql/connect', async (req: Request, res: Response) => {
  try {
    const { host, port, user, password, database, ssl } = req.body;
    const config: MySQLConfig = {
      host: host || 'localhost',
      port: Number(port) || 3306,
      user: user || 'root',
      password: password || '',
      database: database || 'skillbridge_db',
      ssl: Boolean(ssl)
    };

    const result = await mysqlBackend.connect(config);
    res.json({
      ...result,
      status: mysqlBackend.getStatus()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to connect to MySQL' });
  }
});

// Execute Raw SQL Query (Used by MySQL Studio Console)
app.post('/api/mysql/query', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const result = await mysqlBackend.executeRawSQL(sql);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SQL execution failed' });
  }
});

// Reset and Re-seed MySQL Database
app.post('/api/mysql/reseed', async (req: Request, res: Response) => {
  try {
    const result = await mysqlBackend.reseedAll();
    const data = await mysqlBackend.getFullDataset();
    res.json({ ...result, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Reseed failed' });
  }
});

// Full Dataset Hydration endpoint
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const dataset = await mysqlBackend.getFullDataset();
    const status = mysqlBackend.getStatus();
    res.json({ ...dataset, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dataset' });
  }
});

// Update Student Profile
app.put('/api/students/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await mysqlBackend.updateStudentProfile(id, req.body);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update student profile' });
  }
});

// Upsert Student Skill
app.post('/api/student-skills', async (req: Request, res: Response) => {
  try {
    const { studentId, skillId, proficiencyLevel, yearsExperience } = req.body;
    const result = await mysqlBackend.upsertStudentSkill(
      Number(studentId),
      Number(skillId),
      Number(proficiencyLevel),
      Number(yearsExperience || 1.0)
    );
    res.json({ success: true, skill: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upsert skill' });
  }
});

// Delete Student Skill
app.delete('/api/student-skills/:studentId/:skillId', async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const skillId = Number(req.params.skillId);
    await mysqlBackend.deleteStudentSkill(studentId, skillId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove skill' });
  }
});

// Create Job with Required Skills (Employer Portal)
app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const { job, requiredSkills } = req.body;
    const created = await mysqlBackend.createJob(job, requiredSkills || []);
    res.json({ success: true, ...created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create job posting' });
  }
});

// Submit Job Application
app.post('/api/applications', async (req: Request, res: Response) => {
  try {
    const { studentId, jobId, matchPercentage, notes } = req.body;
    const application = await mysqlBackend.submitApplication(
      Number(studentId),
      Number(jobId),
      Number(matchPercentage),
      notes
    );
    res.json({ success: true, application });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit application' });
  }
});

// Gemini AI Career Advisor Server-Side Route
app.post('/api/gemini/career-advice', async (req: Request, res: Response) => {
  const {
    studentName,
    targetRole,
    university,
    major,
    matchedSkills,
    gapSkills,
    jobTitle,
    company,
    matchPercentage
  } = req.body;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are an expert technical career coach and hiring manager reviewing a university student's profile for an engineering role.
Student: ${studentName}
Academic Background: ${major} at ${university}
Target Role: ${targetRole}
Applying for: ${jobTitle} at ${company}
Skill Compatibility Match: ${matchPercentage}%

Demonstrated Skills: ${(matchedSkills || []).join(', ') || 'None specified'}
Identified Skill Gaps: ${(gapSkills || []).join(', ') || 'No critical gaps'}

Respond with a JSON object strictly adhering to this schema:
{
  "executiveSummary": "A concise 2-sentence assessment of their readiness and competitive edge.",
  "skillBridgePlan": [
    {
      "step": 1,
      "skill": "Name of gap skill or highest-priority skill",
      "action": "Concrete, hands-on project or practical implementation to build this skill in 2-3 weeks",
      "recommendedResource": "Specific documentation, official tutorial, or industry-standard benchmark"
    }
  ],
  "tailoredResumeBullet": "A high-impact resume bullet point following the 'Accomplished [X], measured by [Y], by doing [Z]' Google XYZ format.",
  "interviewPrepTip": "One high-frequency technical interview question or architectural scenario this company will test for this role."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text?.trim() || '';
      const parsed = JSON.parse(rawText);
      return res.json({ advice: parsed, isFallback: false, model: 'gemini-2.5-flash' });
    }
  } catch (err: any) {
    console.warn('[Gemini Server Route] Gemini API call error:', err.message);
  }

  // Graceful structured fallback
  res.json({
    isFallback: true,
    advice: {
      executiveSummary: `${studentName} exhibits a strong foundation with ${matchPercentage}% alignment for the ${jobTitle} position at ${company}. Prioritizing key competencies like ${(gapSkills || []).slice(0, 2).join(' and ') || 'system design'} will accelerate readiness.`,
      skillBridgePlan: (gapSkills || ['System Architecture', 'Database Optimization']).slice(0, 3).map((skill: string, index: number) => ({
        step: index + 1,
        skill,
        action: `Build a production-grade demo project demonstrating ${skill} with automated testing and benchmarking.`,
        recommendedResource: `Official ${skill} documentation and engineering deep-dive tutorials`
      })),
      tailoredResumeBullet: `Architected scalable modules for ${targetRole || 'Software Engineering'} workflows, improving data throughput by 32% and reducing latency via optimized database indexing.`,
      interviewPrepTip: `Prepare to explain how you model relational dependencies, ensure foreign key integrity, and index query execution in high-concurrency environments.`
    }
  });
});

// -------------------------------------------------------------
// Vite Middleware & Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillBridge Server] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
