import React from 'react';
import {
  Briefcase,
  Database,
  Layers,
  Sparkles,
  UserCheck,
  Building2,
  TrendingUp,
  CloudCheck,
  Edit3
} from 'lucide-react';
import { StudentProfileRecord, UserRecord } from '../types/mysql-schema';
import { BackendStatus } from '../lib/api-client';

interface HeaderProps {
  activeTab: 'recommendations' | 'skills' | 'gap-analyzer' | 'employer' | 'mysql-studio';
  setActiveTab: (tab: 'recommendations' | 'skills' | 'gap-analyzer' | 'employer' | 'mysql-studio') => void;
  students: StudentProfileRecord[];
  users: UserRecord[];
  activeStudentId: number;
  setActiveStudentId: (id: number) => void;
  onEditProfile: () => void;
  isCloudSynced: boolean;
  backendStatus?: BackendStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  students,
  users,
  activeStudentId,
  setActiveStudentId,
  onEditProfile,
  isCloudSynced,
  backendStatus
}) => {
  const currentStudent = students.find(s => s.id === activeStudentId) || students[0];
  const currentUser = users.find(u => u.id === currentStudent?.user_id) || users[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="skillbridge-main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand, Student Switcher, Database Status */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">SkillBridge</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Career Matcher
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Automated Skill Gap & Career Recommendation Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database & Cloud Status */}
            <button
              onClick={() => setActiveTab('mysql-studio')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium transition cursor-pointer"
              title="Click to open MySQL Database Studio & Connection Manager"
              id="header-mysql-status-badge"
            >
              <span className={`w-2 h-2 rounded-full ${backendStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-semibold">MySQL 8.0</span>
              <span className="text-emerald-300">|</span>
              <span className="text-emerald-700">
                {backendStatus?.connected 
                  ? `Connected (${backendStatus.latencyMs}ms)` 
                  : (backendStatus?.mode === 'mysql' ? 'MySQL Connecting' : 'Backend Engine Active')}
              </span>
            </button>

            {/* Active Student Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800">{currentUser?.full_name}</div>
                <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{currentStudent?.target_role}</div>
              </div>
              <select
                aria-label="Switch active student"
                className="bg-white text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg py-1 px-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                value={activeStudentId}
                onChange={(e) => setActiveStudentId(Number(e.target.value))}
                id="student-switcher-select"
              >
                {students.map(st => {
                  const u = users.find(usr => usr.id === st.user_id);
                  return (
                    <option key={st.id} value={st.id}>
                      {u?.full_name} ({st.major.split(' ')[0]})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={onEditProfile}
                title="Edit student profile & career goals"
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                id="edit-profile-header-btn"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 py-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-tab-recommendations"
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Recommendations</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'skills'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-tab-skills"
          >
            <Layers className="w-4 h-4" />
            <span>Skill Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('gap-analyzer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'gap-analyzer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-tab-gap-analyzer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Career Bridge & Gaps</span>
          </button>

          <button
            onClick={() => setActiveTab('employer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'employer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-tab-employer"
          >
            <Building2 className="w-4 h-4" />
            <span>Employer Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('mysql-studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'mysql-studio'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="nav-tab-mysql-studio"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>MySQL Database Studio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
