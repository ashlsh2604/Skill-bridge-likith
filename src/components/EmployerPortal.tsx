import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  MapPin,
  DollarSign,
  GraduationCap,
  Calendar,
  Layers,
  Send,
  Sparkles
} from 'lucide-react';
import {
  JobPostingRecord,
  JobRequiredSkillRecord,
  StudentProfileRecord,
  UserRecord,
  SkillRecord,
  StudentSkillRecord,
  WorkType,
  ExperienceLevel,
  JobApplicationRecord
} from '../types/mysql-schema';
import { rankCandidatesForJob } from '../lib/recommendation-engine';

interface EmployerPortalProps {
  jobs: JobPostingRecord[];
  jobRequirements: JobRequiredSkillRecord[];
  students: StudentProfileRecord[];
  users: UserRecord[];
  studentSkills: StudentSkillRecord[];
  allSkills: SkillRecord[];
  applications: JobApplicationRecord[];
  onCreateJob: (
    jobData: Omit<JobPostingRecord, 'id' | 'posted_at'>,
    requiredSkills: { skillId: number; importance: 'Required' | 'Preferred'; minProficiency: number; weight: number }[]
  ) => void;
}

export const EmployerPortal: React.FC<EmployerPortalProps> = ({
  jobs,
  jobRequirements,
  students,
  users,
  studentSkills,
  allSkills,
  applications,
  onCreateJob
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'candidates' | 'post-job' | 'applications'>('candidates');
  const [selectedJobId, setSelectedJobId] = useState<number>(jobs[0]?.id || 1);

  // New Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDept, setNewDept] = useState('Core Engineering');
  const [newLocation, setNewLocation] = useState('San Francisco, CA');
  const [newWorkType, setNewWorkType] = useState<WorkType>('Remote');
  const [newExpLevel, setNewExpLevel] = useState<ExperienceLevel>('Entry Level');
  const [newSalaryMin, setNewSalaryMin] = useState(110000);
  const [newSalaryMax, setNewSalaryMax] = useState(135000);
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-11-30');

  // Selected requirements for new job
  const [reqSkills, setReqSkills] = useState<{ skillId: number; importance: 'Required' | 'Preferred'; minProficiency: number; weight: number }[]>([
    { skillId: 1, importance: 'Required', minProficiency: 4, weight: 1.2 }, // JS
    { skillId: 2, importance: 'Required', minProficiency: 4, weight: 1.2 }, // TS
    { skillId: 8, importance: 'Required', minProficiency: 4, weight: 1.3 }  // React
  ]);

  const [addSkillId, setAddSkillId] = useState<number>(allSkills[0]?.id || 1);
  const [addImportance, setAddImportance] = useState<'Required' | 'Preferred'>('Required');
  const [addMinProficiency, setAddMinProficiency] = useState<number>(3);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Prepare student list for reverse candidate ranking
  const studentDataList = students.map(st => {
    const user = users.find(u => u.id === st.user_id) || { full_name: 'Student Candidate', email: 'student@edu' };
    const skills = studentSkills.filter(s => s.student_id === st.id);
    return {
      profile: st,
      skills,
      user
    };
  });

  const rankedCandidates = rankCandidatesForJob(selectedJob, studentDataList, jobRequirements, allSkills);

  const handleAddReqSkill = () => {
    if (reqSkills.some(r => r.skillId === addSkillId)) return;
    setReqSkills(prev => [
      ...prev,
      { skillId: addSkillId, importance: addImportance, minProficiency: addMinProficiency, weight: 1.0 }
    ]);
  };

  const handleRemoveReqSkill = (skillId: number) => {
    setReqSkills(prev => prev.filter(r => r.skillId !== skillId));
  };

  const handleSubmitNewJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim() || reqSkills.length === 0) return;

    onCreateJob(
      {
        title: newTitle,
        company: newCompany,
        department: newDept,
        location: newLocation,
        work_type: newWorkType,
        experience_level: newExpLevel,
        salary_min: Number(newSalaryMin),
        salary_max: Number(newSalaryMax),
        description: newDescription || `Exciting opportunity for a ${newTitle} to work on cutting-edge software solutions at ${newCompany}.`,
        deadline: newDeadline,
        logo_bg: '#4F46E5'
      },
      reqSkills
    );

    alert(`Job opportunity "${newTitle}" published successfully and stored in MySQL!`);
    setActiveSubTab('candidates');
  };

  return (
    <div className="space-y-6" id="employer-portal-root">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">Employer & Recruiter Portal</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Automated Candidate Sourcing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Post new roles with strict MySQL skill requirements, run automated reverse matching on student profiles, and evaluate applicants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('candidates')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'candidates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Candidate Matcher
            </button>
            <button
              onClick={() => setActiveSubTab('post-job')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeSubTab === 'post-job'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Post New Role</span>
            </button>
            <button
              onClick={() => setActiveSubTab('applications')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'applications'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Applications ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {/* SubTab 1: Candidate Matcher */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">Evaluating Matches For:</div>
              <div className="text-sm font-bold text-slate-900">{selectedJob.title} @ {selectedJob.company}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Switch Job:</span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="bg-slate-50 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg py-1.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-3">
            {rankedCandidates.map(({ student, user, match }, index) => {
              const { matchPercentage, matchedSkills, gapSkills } = match;

              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (matchPercentage < 50) badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
              else if (matchPercentage < 75) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              else if (matchPercentage < 88) badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-xs transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {user.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{user.full_name}</h3>
                          <span className="text-xs text-slate-400 font-medium">#{index + 1} Candidate</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {student.degree} • {student.university} (GPA: {student.gpa})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg border font-black text-sm flex items-center gap-1.5 ${badgeColor}`}>
                        <TrendingUp className="w-4 h-4" />
                        <span>{matchPercentage}% Match</span>
                      </div>
                      <a
                        href={`mailto:${user.email}`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Contact Candidate
                      </a>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{student.bio}"
                  </div>

                  {/* Skills Alignment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-700 block mb-1">
                        Matched Competencies ({matchedSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {matchedSkills.map(m => (
                          <span key={m.skill.id} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-100">
                            {m.skill.name} (L{m.studentProficiency})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-amber-700 block mb-1">
                        Deficiencies / Gaps ({gapSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {gapSkills.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">No critical skill gaps</span>
                        ) : (
                          gapSkills.map(g => (
                            <span key={g.skill.id} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                              {g.skill.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Post New Role Form */}
      {activeSubTab === 'post-job' && (
        <form onSubmit={handleSubmitNewJob} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Create New Job Posting</h3>
            <p className="text-xs text-slate-500">
              Stores into MySQL relational tables: `job_postings` and `job_required_skills`.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Junior Backend Systems Engineer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, OpenAI, Cloudflare"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Arrangement</label>
              <select
                value={newWorkType}
                onChange={(e) => setNewWorkType(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level</label>
              <select
                value={newExpLevel}
                onChange={(e) => setNewExpLevel(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Internship">Internship</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range ($/yr)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="5000"
                  value={newSalaryMin}
                  onChange={(e) => setNewSalaryMin(Number(e.target.value))}
                  className="w-1/2 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="number"
                  step="5000"
                  value={newSalaryMax}
                  onChange={(e) => setNewSalaryMax(Number(e.target.value))}
                  className="w-1/2 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline</label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description & Responsibilities</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe core duties, team mission, and impact..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Skill Requirements Builder */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Required & Preferred Skill Specifications
            </h4>

            {/* List of currently chosen skills */}
            <div className="flex flex-wrap gap-2">
              {reqSkills.map(r => {
                const sk = allSkills.find(s => s.id === r.skillId);
                return (
                  <div
                    key={r.skillId}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{sk?.name}</span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        (Min L{r.minProficiency} • {r.importance})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReqSkill(r.skillId)}
                      className="text-slate-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add skill row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <select
                value={addSkillId}
                onChange={(e) => setAddSkillId(Number(e.target.value))}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {allSkills.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>

              <select
                value={addImportance}
                onChange={(e) => setAddImportance(e.target.value as any)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="Required">Required</option>
                <option value="Preferred">Preferred</option>
              </select>

              <select
                value={addMinProficiency}
                onChange={(e) => setAddMinProficiency(Number(e.target.value))}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={1}>Min Level 1 (Beginner)</option>
                <option value={2}>Min Level 2 (Elementary)</option>
                <option value={3}>Min Level 3 (Intermediate)</option>
                <option value={4}>Min Level 4 (Advanced)</option>
                <option value={5}>Min Level 5 (Expert)</option>
              </select>

              <button
                type="button"
                onClick={handleAddReqSkill}
                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
              >
                Add Requirement
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <Send className="w-4 h-4" />
              <span>Publish Job Opportunity & Run Matcher</span>
            </button>
          </div>
        </form>
      )}

      {/* SubTab 3: Applications View */}
      {activeSubTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900">Student Application Pipeline</h3>
          {applications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No applications submitted yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {applications.map(app => {
                const student = students.find(s => s.id === app.student_id);
                const user = users.find(u => u.id === student?.user_id);
                const job = jobs.find(j => j.id === app.job_id);

                return (
                  <div key={app.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{user?.full_name}</div>
                      <div className="text-slate-500">
                        Applied for <strong className="text-slate-700">{job?.title}</strong> at {job?.company}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Applied on: {app.applied_at} • Note: "{app.notes}"
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {app.match_percentage_at_apply}% Match at Apply
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
