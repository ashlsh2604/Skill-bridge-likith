import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  DollarSign,
  Briefcase,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  FileText,
  Send,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { RecommendationMatchResult, StudentProfileRecord } from '../types/mysql-schema';
import { getCareerAdvice, CareerAdviceResult } from '../lib/gemini-advisor';

interface JobDetailModalProps {
  matchResult: RecommendationMatchResult | null;
  student: StudentProfileRecord;
  studentName: string;
  onClose: () => void;
  onApply: (jobId: number, matchPercentage: number, notes?: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  matchResult,
  student,
  studentName,
  onClose,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState<'fit' | 'ai-advisor' | 'description'>('fit');
  const [advice, setAdvice] = useState<CareerAdviceResult | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [copiedResume, setCopiedResume] = useState<boolean>(false);
  const [applicationNote, setApplicationNote] = useState<string>('');
  const [appliedSuccessfully, setAppliedSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    if (!matchResult) return;
    setAppliedSuccessfully(matchResult.isApplied);

    let isMounted = true;
    async function loadAdvice() {
      setLoadingAdvice(true);
      try {
        const result = await getCareerAdvice(student, matchResult!, studentName);
        if (isMounted) {
          setAdvice(result);
        }
      } catch (e) {
        console.error('Failed to load career advice', e);
      } finally {
        if (isMounted) setLoadingAdvice(false);
      }
    }

    loadAdvice();
    return () => {
      isMounted = false;
    };
  }, [matchResult, student, studentName]);

  if (!matchResult) return null;

  const { job, matchPercentage, matchedSkills, gapSkills, isApplied, applicationStatus } = matchResult;

  const handleCopyResume = () => {
    if (!advice?.tailoredResumeBullet) return;
    navigator.clipboard.writeText(advice.tailoredResumeBullet);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleApply = () => {
    onApply(job.id, matchPercentage, applicationNote);
    setAppliedSuccessfully(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" id="job-detail-modal-backdrop">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
              style={{ backgroundColor: job.logo_bg || '#4F46E5' }}
            >
              {job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {job.experience_level}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                {job.company} • <span className="text-slate-400">{job.department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location} ({job.work_type})
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Apply by {job.deadline}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('fit')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'fit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Match & Skill Matrix</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
              {matchPercentage}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai-advisor')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ai-advisor'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI Career Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab('description')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'description'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Job Details</span>
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm flex-1">
          {activeTab === 'fit' && (
            <div className="space-y-6">
              {/* Score Highlight Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-100 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Computed Compatibility Index
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {matchPercentage}% Overall Candidate Alignment
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {matchResult.recommendationReason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-indigo-600">{matchPercentage}%</div>
                  <div className="text-[10px] font-bold text-slate-400">AUTOMATED MATCH</div>
                </div>
              </div>

              {/* Skills Detailed Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Required Skills Evaluation
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {matchedSkills.map(m => (
                    <div key={m.skill.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{m.skill.name}</div>
                          <div className="text-[11px] text-slate-500">{m.skill.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-slate-400 text-[10px] block">REQUIRED</span>
                          <span className="font-semibold text-slate-700">Level {m.requiredProficiency}/5</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">YOUR LEVEL</span>
                          <span className="font-bold text-emerald-700">Level {m.studentProficiency}/5</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {m.isProficientEnough ? 'Proficient' : 'Developing'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {gapSkills.map(g => (
                    <div key={g.skill.id} className="p-3 flex items-center justify-between bg-amber-50/40 hover:bg-amber-50/70">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{g.skill.name}</div>
                          <div className="text-[11px] text-slate-500">{g.skill.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-slate-400 text-[10px] block">REQUIRED</span>
                          <span className="font-semibold text-slate-700">Level {g.requiredProficiency}/5</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">YOUR LEVEL</span>
                          <span className="font-bold text-amber-700">Not Added</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Gap: ~{g.estimatedBridgeTimeWeeks} wks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-advisor' && (
            <div className="space-y-6">
              {loadingAdvice ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Generating customized career intelligence via Gemini...
                  </p>
                </div>
              ) : advice ? (
                <div className="space-y-5">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Executive Fit Assessment</span>
                      <span className="ml-auto text-[10px] text-indigo-500 font-normal">
                        {advice.source === 'gemini' ? 'Gemini 2.5 Flash' : 'Algorithmic Analyzer'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                      {advice.executiveSummary}
                    </p>
                  </div>

                  {/* Tailored Resume Bullet Point */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Targeted Resume Bullet for This Job</span>
                      </div>
                      <button
                        onClick={handleCopyResume}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedResume ? 'Copied!' : 'Copy to Resume'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
                      • {advice.tailoredResumeBullet}
                    </div>
                  </div>

                  {/* Interview Preparation Strategy */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>Technical Interview Strategy & Gap Addressing</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      {advice.interviewPrepTip}
                    </p>
                  </div>

                  {/* 30-Day Skill Bridge Action Plan */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Recommended Skill Bridge Roadmap</span>
                    </div>
                    <div className="space-y-2.5">
                      {advice.skillBridgePlan.map((step) => (
                        <div key={step.step} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {step.step}
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-xs text-slate-900">
                              Bridge Goal: <span className="text-indigo-600">{step.skill}</span>
                            </div>
                            <p className="text-xs text-slate-600">{step.action}</p>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Resource: <span className="text-slate-600">{step.recommendedResource}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  About the Opportunity
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Job Specifications</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div><strong>Company:</strong> {job.company}</div>
                  <div><strong>Department:</strong> {job.department}</div>
                  <div><strong>Location:</strong> {job.location}</div>
                  <div><strong>Work Mode:</strong> {job.work_type}</div>
                  <div><strong>Experience:</strong> {job.experience_level}</div>
                  <div><strong>Application Deadline:</strong> {job.deadline}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Quick Apply or Applied State */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {appliedSuccessfully ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Application active ({applicationStatus || 'Applied'})
              </span>
            ) : (
              <span>Your profile and verified skills will be attached automatically</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors"
            >
              Close
            </button>

            {!appliedSuccessfully ? (
              <button
                onClick={handleApply}
                className="flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                id="modal-apply-btn"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Application ({matchPercentage}% Fit)</span>
              </button>
            ) : (
              <div className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-lg">
                Applied
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
