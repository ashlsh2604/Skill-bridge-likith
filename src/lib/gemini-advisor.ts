import { RecommendationMatchResult, StudentProfileRecord } from '../types/mysql-schema';

export interface CareerAdviceResult {
  executiveSummary: string;
  skillBridgePlan: {
    step: number;
    skill: string;
    action: string;
    recommendedResource: string;
  }[];
  tailoredResumeBullet: string;
  interviewPrepTip: string;
  source: 'gemini' | 'algorithmic';
}

export async function getCareerAdvice(
  student: StudentProfileRecord,
  matchResult: RecommendationMatchResult,
  studentName: string = 'Alex Rivera'
): Promise<CareerAdviceResult> {
  const matchedSkillNames = matchResult.matchedSkills.map(m => m.skill.name);
  const gapSkillNames = matchResult.gapSkills.map(g => g.skill.name);

  try {
    const res = await fetch('/api/gemini/career-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        targetRole: student.target_role,
        university: student.university,
        major: student.major,
        matchedSkills: matchedSkillNames,
        gapSkills: gapSkillNames,
        jobTitle: matchResult.job.title,
        company: matchResult.job.company,
        matchPercentage: matchResult.matchPercentage
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.advice && !data.isFallback && data.advice.executiveSummary) {
        return {
          executiveSummary: data.advice.executiveSummary,
          skillBridgePlan: data.advice.skillBridgePlan || generateFallbackPlan(matchResult),
          tailoredResumeBullet: data.advice.tailoredResumeBullet || generateFallbackResumeBullet(matchResult, student),
          interviewPrepTip: data.advice.interviewPrepTip || generateFallbackInterviewTip(matchResult),
          source: 'gemini'
        };
      }
    }
  } catch (err) {
    console.warn('Could not reach Gemini backend API endpoint, using high-fidelity local advisor', err);
  }

  // High-fidelity algorithmic recommendation fallback
  return {
    executiveSummary: generateFallbackSummary(matchResult, student, studentName),
    skillBridgePlan: generateFallbackPlan(matchResult),
    tailoredResumeBullet: generateFallbackResumeBullet(matchResult, student),
    interviewPrepTip: generateFallbackInterviewTip(matchResult),
    source: 'algorithmic'
  };
}

function generateFallbackSummary(match: RecommendationMatchResult, student: StudentProfileRecord, name: string): string {
  if (match.matchPercentage >= 85) {
    return `${name} exhibits stellar qualification for ${match.job.title} at ${match.job.company}. Their mastery in ${match.matchedSkills.slice(0, 3).map(m => m.skill.name).join(', ')} strongly aligns with ${match.job.department} engineering goals, making them an immediate hire candidate.`;
  } else if (match.matchPercentage >= 70) {
    return `${name} possesses the essential core proficiencies required for ${match.job.title}. With focused ramp-up on ${match.gapSkills[0]?.skill.name || 'supplementary tools'}, they will match the target profile with high readiness.`;
  } else {
    return `This ${match.job.title} position at ${match.job.company} provides an aspirational career milestone. While foundational knowledge is in place, closing gaps in ${match.gapSkills.slice(0, 2).map(g => g.skill.name).join(' & ')} will unlock this pathway.`;
  }
}

function generateFallbackPlan(match: RecommendationMatchResult) {
  if (match.gapSkills.length === 0) {
    return [
      {
        step: 1,
        skill: match.matchedSkills[0]?.skill.name || 'System Architecture',
        action: 'Build a production-grade showcase project demonstrating real-time concurrency and caching.',
        recommendedResource: 'Official Architecture Best Practices & RFCs'
      },
      {
        step: 2,
        skill: 'Production Readiness',
        action: 'Write end-to-end integration tests and benchmark API response latencies.',
        recommendedResource: 'Martin Fowler Enterprise Patterns'
      }
    ];
  }

  return match.gapSkills.slice(0, 3).map((gap, index) => {
    let action = `Complete practical tutorial and implement a micro-project using ${gap.skill.name}.`;
    let res = `Official Documentation & FreeCodeCamp ${gap.skill.name} Track`;

    if (gap.skill.category === 'Cloud & DevOps') {
      action = `Containerize a full-stack application, configure multi-stage Dockerfiles, and deploy to a managed cluster.`;
      res = 'Docker Hands-on Labs & Kubernetes By Example';
    } else if (gap.skill.category === 'Data Science & AI') {
      action = `Train a baseline PyTorch model, implement evaluation pipelines, and deploy an inference endpoint with FastAPI.`;
      res = 'DeepLearning.AI & PyTorch Tutorials';
    } else if (gap.skill.category === 'Database & Storage') {
      action = `Design normalized relational schemas, write multi-table joins, and optimize slow queries using EXPLAIN.`;
      res = 'MySQL Documentation & Use The Index Luke';
    }

    return {
      step: index + 1,
      skill: gap.skill.name,
      action,
      recommendedResource: res
    };
  });
}

function generateFallbackResumeBullet(match: RecommendationMatchResult, student: StudentProfileRecord): string {
  const topMatched = match.matchedSkills.slice(0, 3).map(m => m.skill.name).join(', ');
  return `Engineered full-lifecycle software solutions leveraging ${topMatched}, resulting in 35% improved response latency and adhering to industry-standard architecture patterns.`;
}

function generateFallbackInterviewTip(match: RecommendationMatchResult): string {
  const topMatched = match.matchedSkills[0]?.skill.name || 'TypeScript';
  const topGap = match.gapSkills[0]?.skill.name;

  if (topGap) {
    return `Be prepared to discuss your depth in ${topMatched}, and if asked about ${topGap}, highlight your fast learning agility: "While I am currently expanding my hands-on experience with ${topGap}, my solid foundation in ${topMatched} and relational modeling allows me to pick up the stack within weeks."`;
  }
  return `Expect deep architectural questions on how you structure components and optimize data flow in ${topMatched}. Prepare a concrete war-story about debugging a tricky state or query performance bottleneck.`;
}
