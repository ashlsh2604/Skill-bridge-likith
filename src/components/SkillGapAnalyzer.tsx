import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  Sparkles,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  StudentProfileRecord,
  StudentSkillRecord,
  SkillRecord,
  JobPostingRecord,
  JobRequiredSkillRecord,
  RecommendationMatchResult
} from '../types/mysql-schema';
import { calculateJobMatch } from '../lib/recommendation-engine';

interface SkillGapAnalyzerProps {
  student: StudentProfileRecord;
  studentSkills: StudentSkillRecord[];
  allSkills: SkillRecord[];
  jobs: JobPostingRecord[];
  jobRequirements: JobRequiredSkillRecord[];
  onAddSkill: (skillId: number, level: number, years: number) => void;
  onSetProficiency: (skillId: number, level: number) => void;
}

export const SkillGapAnalyzer: React.FC<SkillGapAnalyzerProps> = ({
  student,
  studentSkills,
  allSkills,
  jobs,
  jobRequirements,
  onAddSkill,
  onSetProficiency
}) => {
  const [selectedJobId, setSelectedJobId] = useState<number>(jobs[0]?.id || 1);
  const [simulatedLevels, setSimulatedLevels] = useState<Record<number, number>>({});

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Base match calculation
  const baseMatch = useMemo(() => {
    return calculateJobMatch(student, studentSkills, selectedJob, jobRequirements, allSkills);
  }, [student, studentSkills, selectedJob, jobRequirements, allSkills]);

  // Virtual simulated skills
  const simulatedSkills = useMemo(() => {
    const list: StudentSkillRecord[] = studentSkills.map(s => ({ ...s }));
    Object.entries(simulatedLevels).forEach(([skillIdStr, lvl]) => {
      const skillId = Number(skillIdStr);
      const levelNum = Number(lvl);
      const existing = list.find(s => s.skill_id === skillId);
      if (existing) {
        existing.proficiency_level = levelNum;
      } else {
        list.push({
          id: -1,
          student_id: student.id,
          skill_id: skillId,
          proficiency_level: levelNum,
          years_experience: 1.0,
          verified: false,
          created_at: 'simulated'
        });
      }
    });
    return list;
  }, [studentSkills, simulatedLevels, student.id]);

  // Simulated match score
  const simulatedMatch = useMemo(() => {
    return calculateJobMatch(student, simulatedSkills, selectedJob, jobRequirements, allSkills);
  }, [student, simulatedSkills, selectedJob, jobRequirements, allSkills]);

  const handleSimulateSkill = (skillId: number, targetLevel: number) => {
    setSimulatedLevels(prev => ({
      ...prev,
      [skillId]: targetLevel
    }));
  };

  const handleApplySimulated = (skillId: number, level: number) => {
    onAddSkill(skillId, level, 1.0);
    setSimulatedLevels(prev => {
      const copy = { ...prev };
      delete copy[skillId];
      return copy;
    });
  };

  const resetSimulation = () => {
    setSimulatedLevels({});
  };

  const scoreDelta = simulatedMatch.matchPercentage - baseMatch.matchPercentage;

  return (
    <div className="space-y-6" id="skill-gap-analyzer-root">
      {/* Top Banner & Job Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Career Bridge & Gap Analysis</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Predictive Readiness
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Select any target job opportunity to diagnose missing competencies, simulate learning outcomes, and view personalized 30-day bridging roadmaps.
            </p>
          </div>

          {/* Job Picker */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 pl-2">Target Role:</span>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(Number(e.target.value));
                setSimulatedLevels({});
              }}
              className="bg-white text-xs font-bold text-slate-800 border border-slate-300 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} @ {j.company}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Comparative Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Current Match Score</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{baseMatch.matchPercentage}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{baseMatch.recommendationReason}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-2xs">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-indigo-700">Simulated Potential Score</div>
              <div className="text-2xl font-black text-indigo-700 mt-0.5">
                {simulatedMatch.matchPercentage}%
                {scoreDelta > 0 && (
                  <span className="text-xs text-emerald-600 ml-2 font-bold">(+{scoreDelta}% Boost)</span>
                )}
              </div>
              <div className="text-[11px] text-indigo-600 mt-0.5">
                {Object.keys(simulatedLevels).length > 0
                  ? `${Object.keys(simulatedLevels).length} skills actively simulated`
                  : 'Test leveling up skills below to see score increase'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 shadow-2xs">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-amber-800">Critical Skill Gaps</div>
              <div className="text-2xl font-black text-amber-900 mt-0.5">
                {baseMatch.gapSkills.filter(g => g.priority === 'Critical').length} Required
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Total Bridge Time: ~{baseMatch.gapSkills.reduce((sum, g) => sum + g.estimatedBridgeTimeWeeks, 0)} weeks
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-600 font-bold border border-amber-200 shadow-2xs">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {Object.keys(simulatedLevels).length > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
            <span className="text-emerald-800 font-medium">
              Simulation Active: You projected mastery in {Object.keys(simulatedLevels).length} skills. Match increased from {baseMatch.matchPercentage}% to {simulatedMatch.matchPercentage}%.
            </span>
            <button
              onClick={resetSimulation}
              className="font-bold text-emerald-900 underline hover:text-emerald-700"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>

      {/* Side-by-Side Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Skill Matrix & Gap Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Competency Breakdown for {selectedJob.title}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Requirements Comparison</span>
          </div>

          <div className="space-y-3">
            {/* Matched Skills */}
            {baseMatch.matchedSkills.map(m => (
              <div
                key={m.skill.id}
                className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{m.skill.name}</div>
                    <div className="text-[11px] text-slate-500">{m.skill.category} • {m.importance}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block">YOU HAVE</span>
                    <span className="font-bold text-xs text-emerald-700">Level {m.studentProficiency}/5</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">MIN REQUIRED</span>
                    <span className="font-semibold text-xs text-slate-700">Level {m.requiredProficiency}/5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Satisfied
                  </span>
                </div>
              </div>
            ))}

            {/* Gap Skills with Interactive Simulator */}
            {baseMatch.gapSkills.map(g => {
              const isSimulated = simulatedLevels[g.skill.id] !== undefined;
              const currentSimVal = simulatedLevels[g.skill.id] || g.requiredProficiency;

              return (
                <div
                  key={g.skill.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSimulated
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-amber-200 bg-amber-50/30'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{g.skill.name}</span>
                        <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {g.priority} Gap
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Needs Level {g.requiredProficiency} • Estimated Bridge: ~{g.estimatedBridgeTimeWeeks} weeks
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isSimulated ? (
                      <button
                        onClick={() => handleSimulateSkill(g.skill.id, g.requiredProficiency)}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Simulate Mastery</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplySimulated(g.skill.id, currentSimVal)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Save to MySQL Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Step-by-Step Learning Roadmaps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Personalized Bridging Curriculum</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">30-60 Day Blueprint</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Follow this accelerated roadmap to close the high-yield skill gaps for <strong className="text-slate-800">{selectedJob.title}</strong> at <strong className="text-slate-800">{selectedJob.company}</strong>.
          </p>

          <div className="space-y-3">
            {baseMatch.gapSkills.map((gap, index) => (
              <div key={gap.skill.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{gap.skill.name}</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    ~{gap.estimatedBridgeTimeWeeks} Weeks Target
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {gap.skill.description}
                </p>

                <div className="pt-2 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-500">
                  <span className="font-medium text-slate-700">Recommended Milestone:</span>
                  <span className="text-indigo-600 font-medium">
                    Build one showcase project integrating {gap.skill.name}
                  </span>
                </div>
              </div>
            ))}

            {baseMatch.gapSkills.length === 0 && (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Zero Critical Gaps!</h4>
                <p className="text-xs text-emerald-700">
                  You possess 100% of the core competencies required for this role. You are fully prepared to apply!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
