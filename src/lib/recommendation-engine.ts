import {
  StudentProfileRecord,
  StudentSkillRecord,
  SkillRecord,
  JobPostingRecord,
  JobRequiredSkillRecord,
  JobApplicationRecord,
  RecommendationMatchResult
} from '../types/mysql-schema';

export function calculateJobMatch(
  student: StudentProfileRecord,
  studentSkills: StudentSkillRecord[],
  job: JobPostingRecord,
  jobRequirements: JobRequiredSkillRecord[],
  allSkills: SkillRecord[],
  applications: JobApplicationRecord[] = []
): RecommendationMatchResult {
  const skillMap = new Map<number, SkillRecord>();
  allSkills.forEach(s => skillMap.set(s.id, s));

  const studentSkillMap = new Map<number, StudentSkillRecord>();
  studentSkills.forEach(ss => studentSkillMap.set(ss.skill_id, ss));

  const thisJobReqs = jobRequirements.filter(jr => jr.job_id === job.id);
  const requiredList = thisJobReqs.filter(r => r.importance === 'Required');
  const preferredList = thisJobReqs.filter(r => r.importance === 'Preferred');

  const matchedSkills: RecommendationMatchResult['matchedSkills'] = [];
  const gapSkills: RecommendationMatchResult['gapSkills'] = [];

  let requiredScoreSum = 0;
  let requiredMaxSum = 0;

  for (const req of requiredList) {
    const skill = skillMap.get(req.skill_id);
    if (!skill) continue;

    const studentSkill = studentSkillMap.get(req.skill_id);
    const weight = req.weight || 1.0;
    requiredMaxSum += weight;

    if (studentSkill) {
      const isProficientEnough = studentSkill.proficiency_level >= req.min_proficiency;
      let ratio = 1.0;
      if (!isProficientEnough) {
        ratio = Math.max(0.4, studentSkill.proficiency_level / req.min_proficiency);
      }
      requiredScoreSum += ratio * weight;

      matchedSkills.push({
        skill,
        studentProficiency: studentSkill.proficiency_level,
        requiredProficiency: req.min_proficiency,
        importance: 'Required',
        isProficientEnough
      });

      if (!isProficientEnough) {
        // Also register as a partial gap
        gapSkills.push({
          skill,
          requiredProficiency: req.min_proficiency,
          importance: 'Required',
          estimatedBridgeTimeWeeks: Math.max(1, (req.min_proficiency - studentSkill.proficiency_level) * 2),
          priority: 'Critical'
        });
      }
    } else {
      // Missing completely
      gapSkills.push({
        skill,
        requiredProficiency: req.min_proficiency,
        importance: 'Required',
        estimatedBridgeTimeWeeks: Math.max(2, req.min_proficiency * 1.5),
        priority: 'Critical'
      });
    }
  }

  let preferredScoreSum = 0;
  let preferredMaxSum = 0;

  for (const pref of preferredList) {
    const skill = skillMap.get(pref.skill_id);
    if (!skill) continue;

    const studentSkill = studentSkillMap.get(pref.skill_id);
    const weight = pref.weight || 0.8;
    preferredMaxSum += weight;

    if (studentSkill) {
      const isProficientEnough = studentSkill.proficiency_level >= pref.min_proficiency;
      const ratio = isProficientEnough ? 1.0 : studentSkill.proficiency_level / pref.min_proficiency;
      preferredScoreSum += ratio * weight;

      matchedSkills.push({
        skill,
        studentProficiency: studentSkill.proficiency_level,
        requiredProficiency: pref.min_proficiency,
        importance: 'Preferred',
        isProficientEnough
      });
    } else {
      gapSkills.push({
        skill,
        requiredProficiency: pref.min_proficiency,
        importance: 'Preferred',
        estimatedBridgeTimeWeeks: Math.max(1, pref.min_proficiency * 1.2),
        priority: 'Recommended'
      });
    }
  }

  // Calculate percentage
  const requiredPct = requiredMaxSum > 0 ? (requiredScoreSum / requiredMaxSum) : 1.0;
  const preferredPct = preferredMaxSum > 0 ? (preferredScoreSum / preferredMaxSum) : 1.0;

  // Career track keyword alignment (0 to 10%)
  const targetWords = (student.target_role || '').toLowerCase().split(/[\s/,-]+/);
  const jobWords = (job.title + ' ' + job.department).toLowerCase();
  const hasRoleOverlap = targetWords.some(w => w.length > 3 && jobWords.includes(w));
  const roleBonus = hasRoleOverlap ? 1.0 : 0.4;

  // Overall Weighted Score: 70% Required + 20% Preferred + 10% Role Fit
  const rawScore = (requiredPct * 0.70) + (preferredPct * 0.20) + (roleBonus * 0.10);
  const matchPercentage = Math.min(100, Math.max(15, Math.round(rawScore * 100)));

  // Generate automated recommendation narrative
  let recommendationReason = '';
  if (matchPercentage >= 85) {
    recommendationReason = `Exceptional alignment! You satisfy ${matchedSkills.filter(m => m.importance === 'Required').length} of ${requiredList.length} core requirements with high proficiency.`;
  } else if (matchPercentage >= 70) {
    const topGap = gapSkills.find(g => g.priority === 'Critical');
    recommendationReason = `Strong contender! Solid core match, with a quick bridge opportunity in ${topGap ? topGap.skill.name : 'advanced topics'}.`;
  } else if (matchPercentage >= 50) {
    const gaps = gapSkills.slice(0, 2).map(g => g.skill.name).join(' & ');
    recommendationReason = `Moderate match. Focus on learning ${gaps} to increase your fit by ~25%.`;
  } else {
    recommendationReason = `Growth role. High upside with multiple skill bridge opportunities across this stack.`;
  }

  const existingApp = applications.find(a => a.job_id === job.id && a.student_id === student.id);

  return {
    job,
    matchPercentage,
    matchedSkills,
    gapSkills,
    careerTrackAlignment: Math.round(roleBonus * 100),
    recommendationReason,
    isApplied: !!existingApp,
    applicationStatus: existingApp?.status
  };
}

export function rankAllJobOpportunities(
  student: StudentProfileRecord,
  studentSkills: StudentSkillRecord[],
  jobs: JobPostingRecord[],
  jobRequirements: JobRequiredSkillRecord[],
  allSkills: SkillRecord[],
  applications: JobApplicationRecord[] = []
): RecommendationMatchResult[] {
  const results = jobs.map(job => 
    calculateJobMatch(student, studentSkills, job, jobRequirements, allSkills, applications)
  );

  // Sort descending by match percentage, then by job ID
  return results.sort((a, b) => b.matchPercentage - a.matchPercentage || a.job.id - b.job.id);
}

export const generateRecommendations = rankAllJobOpportunities;

// Automated candidate ranking for Employers/Recruiters viewing a specific job
export function rankCandidatesForJob(
  job: JobPostingRecord,
  students: { profile: StudentProfileRecord; skills: StudentSkillRecord[]; user: { full_name: string; email: string } }[],
  jobRequirements: JobRequiredSkillRecord[],
  allSkills: SkillRecord[]
) {
  return students.map(st => {
    const match = calculateJobMatch(st.profile, st.skills, job, jobRequirements, allSkills);
    return {
      student: st.profile,
      user: st.user,
      match
    };
  }).sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);
}
