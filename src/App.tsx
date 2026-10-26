import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { mysqlEngine, SQLLogEntry } from './lib/mysql-engine';
import {
  StudentProfileRecord,
  UserRecord,
  SkillRecord,
  StudentSkillRecord,
  JobPostingRecord,
  JobRequiredSkillRecord,
  JobApplicationRecord,
  RecommendationMatchResult
} from './types/mysql-schema';
import { generateRecommendations } from './lib/recommendation-engine';
import { Header } from './components/Header';
import { RecommendationDashboard } from './components/RecommendationDashboard';
import { JobDetailModal } from './components/JobDetailModal';
import { SkillInventory } from './components/SkillInventory';
import { SkillGapAnalyzer } from './components/SkillGapAnalyzer';
import { EmployerPortal } from './components/EmployerPortal';
import { MySQLStudio } from './components/MySQLStudio';
import { StudentProfileModal } from './components/StudentProfileModal';
import { apiClient, BackendStatus } from './lib/api-client';

export default function App() {
  // Database state mirrored from mysqlEngine & MySQL backend
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [students, setStudents] = useState<StudentProfileRecord[]>([]);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [studentSkills, setStudentSkills] = useState<StudentSkillRecord[]>([]);
  const [jobs, setJobs] = useState<JobPostingRecord[]>([]);
  const [jobRequirements, setJobRequirements] = useState<JobRequiredSkillRecord[]>([]);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [logs, setLogs] = useState<SQLLogEntry[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // App UI State
  const [activeTab, setActiveTab] = useState<'recommendations' | 'skills' | 'gap-analyzer' | 'employer' | 'mysql-studio'>('recommendations');
  const [activeStudentId, setActiveStudentId] = useState<number>(1);
  const [selectedJobMatch, setSelectedJobMatch] = useState<RecommendationMatchResult | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state helper from engine
  const refreshStateFromEngine = useCallback(() => {
    const st = mysqlEngine.getState();
    setUsers([...st.users]);
    setStudents([...st.student_profiles]);
    setSkills([...st.skills]);
    setStudentSkills([...st.student_skills]);
    setJobs([...st.job_postings]);
    setJobRequirements([...st.job_required_skills]);
    setApplications([...st.job_applications]);
    setLogs(mysqlEngine.getLogs());
  }, []);

  // Fetch full dataset from backend MySQL server
  const fetchBackendData = useCallback(async () => {
    try {
      const [dataset, status] = await Promise.all([
        apiClient.getFullDataset(),
        apiClient.getMySQLStatus()
      ]);
      if (status) {
        setBackendStatus(status);
      }
      if (dataset) {
        if (dataset.users?.length) setUsers(dataset.users);
        if (dataset.student_profiles?.length) setStudents(dataset.student_profiles);
        if (dataset.skills?.length) setSkills(dataset.skills);
        if (dataset.student_skills?.length) setStudentSkills(dataset.student_skills);
        if (dataset.job_postings?.length) setJobs(dataset.job_postings);
        if (dataset.job_required_skills?.length) setJobRequirements(dataset.job_required_skills);
        if (dataset.job_applications?.length) setApplications(dataset.job_applications);
        if (dataset.logs?.length) {
          // Merge server logs with local engine logs
          const combinedLogs = [...mysqlEngine.getLogs(), ...dataset.logs.map(l => ({
            id: l.id,
            timestamp: l.timestamp,
            query: l.query,
            executionTimeMs: l.executionTimeMs,
            affectedRows: l.affectedRows
          }))];
          // Deduplicate by ID
          const unique = Array.from(new Map(combinedLogs.map(item => [item.id, item])).values());
          setLogs(unique.slice(0, 100));
        }
      }
    } catch (err) {
      console.warn('[App] Backend sync error, relying on local relational store:', err);
    }
  }, []);

  // Initialize engine and subscribe to updates
  useEffect(() => {
    let mounted = true;
    async function init() {
      await mysqlEngine.initFromFirestore();
      if (!mounted) return;
      refreshStateFromEngine();
      setIsInitialized(true);
      await fetchBackendData();
    }
    init();

    const unsubscribe = mysqlEngine.subscribe(() => {
      if (mounted) {
        refreshStateFromEngine();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshStateFromEngine, fetchBackendData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Active student and user record
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === activeStudentId) || students[0];
  }, [students, activeStudentId]);

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentStudent?.user_id) || users[0];
  }, [users, currentStudent]);

  // Active student's skills
  const currentStudentSkills = useMemo(() => {
    if (!currentStudent) return [];
    return studentSkills.filter(ss => ss.student_id === currentStudent.id);
  }, [studentSkills, currentStudent]);

  // Calculate live recommendations using the automated matching engine
  const recommendations = useMemo(() => {
    if (!currentStudent) return [];
    return generateRecommendations(
      currentStudent,
      currentStudentSkills,
      jobs,
      jobRequirements,
      skills,
      applications
    );
  }, [currentStudent, currentStudentSkills, jobs, jobRequirements, skills, applications]);

  // Database Mutators (Optimistic Local + Backend MySQL Sync)
  const handleSetProficiency = (skillId: number, level: number) => {
    if (!currentStudent) return;
    const skillName = skills.find(s => s.id === skillId)?.name || 'Skill';
    mysqlEngine.setStudentSkillProficiency(currentStudent.id, skillId, level);
    apiClient.upsertStudentSkill(currentStudent.id, skillId, level, 1.0)
      .catch(err => console.warn('Backend sync error:', err));
    showToast(`Updated ${skillName} to Level ${level}/5 in MySQL database. Match scores recalculated!`);
  };

  const handleAddSkill = (skillId: number, level: number, years: number) => {
    if (!currentStudent) return;
    const skillName = skills.find(s => s.id === skillId)?.name || 'Skill';
    mysqlEngine.addStudentSkill(currentStudent.id, skillId, level, years);
    apiClient.upsertStudentSkill(currentStudent.id, skillId, level, years)
      .catch(err => console.warn('Backend sync error:', err));
    showToast(`Added ${skillName} (Level ${level}) to MySQL profile!`);
  };

  const handleRemoveSkill = (skillId: number) => {
    if (!currentStudent) return;
    const skillName = skills.find(s => s.id === skillId)?.name || 'Skill';
    mysqlEngine.removeStudentSkill(currentStudent.id, skillId);
    apiClient.deleteStudentSkill(currentStudent.id, skillId)
      .catch(err => console.warn('Backend sync error:', err));
    showToast(`Removed ${skillName} from profile.`);
  };

  const handleApplyToJob = (jobId: number, matchPercentage: number, notes?: string) => {
    if (!currentStudent) return;
    const job = jobs.find(j => j.id === jobId);
    mysqlEngine.applyToJob(currentStudent.id, jobId, matchPercentage, notes);
    apiClient.submitApplication(currentStudent.id, jobId, matchPercentage, notes)
      .catch(err => console.warn('Backend sync error:', err));
    showToast(`Application successfully recorded for ${job?.title} at ${job?.company} (${matchPercentage}% fit)!`);
  };

  const handleSaveProfile = (data: Partial<StudentProfileRecord>) => {
    if (!currentStudent) return;
    mysqlEngine.updateStudentProfile(currentStudent.id, data);
    apiClient.updateStudentProfile(currentStudent.id, data)
      .catch(err => console.warn('Backend sync error:', err));
    showToast('Updated student profile and career targets in MySQL database.');
  };

  const handleCreateJob = (
    jobData: Omit<JobPostingRecord, 'id' | 'posted_at'>,
    reqSkills: { skillId: number; importance: 'Required' | 'Preferred'; minProficiency: number; weight: number }[]
  ) => {
    mysqlEngine.createJobWithRequirements(jobData, reqSkills);
    apiClient.createJob(jobData, reqSkills)
      .catch(err => console.warn('Backend sync error:', err));
    showToast(`New role "${jobData.title}" published! Automatic matching initialized.`);
  };

  if (!isInitialized || !currentStudent || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Connecting to MySQL Relational Engine...</p>
          <p className="text-xs text-slate-400">Loading student profiles, verified skills, and job catalogs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased" id="skillbridge-app-root">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        students={students}
        users={users}
        activeStudentId={activeStudentId}
        setActiveStudentId={setActiveStudentId}
        onEditProfile={() => setIsProfileModalOpen(true)}
        isCloudSynced={isCloudSynced}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'recommendations' && (
          <RecommendationDashboard
            student={currentStudent}
            user={currentUser}
            recommendations={recommendations}
            onSelectJob={(match) => setSelectedJobMatch(match)}
            onApply={handleApplyToJob}
            onViewSkills={() => setActiveTab('skills')}
          />
        )}

        {activeTab === 'skills' && (
          <SkillInventory
            student={currentStudent}
            studentSkills={currentStudentSkills}
            allSkills={skills}
            onSetProficiency={handleSetProficiency}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onViewMatches={() => setActiveTab('recommendations')}
          />
        )}

        {activeTab === 'gap-analyzer' && (
          <SkillGapAnalyzer
            student={currentStudent}
            studentSkills={currentStudentSkills}
            allSkills={skills}
            jobs={jobs}
            jobRequirements={jobRequirements}
            onAddSkill={handleAddSkill}
            onSetProficiency={handleSetProficiency}
          />
        )}

        {activeTab === 'employer' && (
          <EmployerPortal
            jobs={jobs}
            jobRequirements={jobRequirements}
            students={students}
            users={users}
            studentSkills={studentSkills}
            allSkills={skills}
            applications={applications}
            onCreateJob={handleCreateJob}
          />
        )}

        {activeTab === 'mysql-studio' && (
          <MySQLStudio
            logs={logs}
            backendStatus={backendStatus}
            onRefreshData={fetchBackendData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800">SkillBridge</span> — Student Skill & Career Matcher
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by MySQL Relational Architecture</span>
            <span>•</span>
            <span>Automated Cosine & Proficiency Recommendation Algorithm</span>
            <span>•</span>
            <span>AI Career Guidance via Gemini</span>
          </div>
        </div>
      </footer>

      {/* Job Detail & AI Advisor Modal */}
      {selectedJobMatch && (
        <JobDetailModal
          matchResult={selectedJobMatch}
          student={currentStudent}
          studentName={currentUser.full_name}
          onClose={() => setSelectedJobMatch(null)}
          onApply={handleApplyToJob}
        />
      )}

      {/* Student Profile Editor Modal */}
      {isProfileModalOpen && (
        <StudentProfileModal
          student={currentStudent}
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
