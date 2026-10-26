import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  Send
} from 'lucide-react';
import {
  RecommendationMatchResult,
  StudentProfileRecord,
  UserRecord,
  WorkType,
  ExperienceLevel
} from '../types/mysql-schema';

interface RecommendationDashboardProps {
  student: StudentProfileRecord;
  user: UserRecord;
  recommendations: RecommendationMatchResult[];
  onSelectJob: (match: RecommendationMatchResult) => void;
  onApply: (jobId: number, matchPercentage: number) => void;
  onViewSkills: () => void;
}

export const RecommendationDashboard: React.FC<RecommendationDashboardProps> = ({
  student,
  user,
  recommendations,
  onSelectJob,
  onApply,
  onViewSkills
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minMatch, setMinMatch] = useState<number>(0);
  const [selectedWorkType, setSelectedWorkType] = useState<string>('ALL');
  const [selectedExpLevel, setSelectedExpLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'recent'>('match');

  // Filtered and sorted results
  const filteredMatches = useMemo(() => {
    return recommendations
      .filter((rec) => {
        if (rec.matchPercentage < minMatch) return false;
        if (selectedWorkType !== 'ALL' && rec.job.work_type !== selectedWorkType) return false;
        if (selectedExpLevel !== 'ALL' && rec.job.experience_level !== selectedExpLevel) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = rec.job.title.toLowerCase().includes(q);
          const matchCompany = rec.job.company.toLowerCase().includes(q);
          const matchSkills = rec.matchedSkills.some(m => m.skill.name.toLowerCase().includes(q));
          const matchGap = rec.gapSkills.some(g => g.skill.name.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchSkills && !matchGap) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchPercentage - a.matchPercentage;
        if (sortBy === 'salary') return b.job.salary_max - a.job.salary_max;
        return new Date(b.job.posted_at).getTime() - new Date(a.job.posted_at).getTime();
      });
  }, [recommendations, minMatch, selectedWorkType, selectedExpLevel, searchTerm, sortBy]);

  // Aggregate stats
  const topMatchScore = recommendations.length > 0 ? recommendations[0].matchPercentage : 0;
  const highMatchCount = recommendations.filter(r => r.matchPercentage >= 75).length;
  const appliedCount = recommendations.filter(r => r.isApplied).length;

  return (
    <div className="space-y-6" id="recommendation-dashboard-root">
      {/* Student Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Automated Recommendation Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Career Matches for {user.full_name}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Target Track: <span className="text-white font-semibold">{student.target_role}</span> • {student.degree} from {student.university}
            </p>
            <p className="text-xs text-slate-400 max-w-xl line-clamp-2">
              {student.bio}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-emerald-400">{topMatchScore}%</div>
              <div className="text-[11px] text-slate-300 font-medium">Top Match</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-indigo-300">{highMatchCount}</div>
              <div className="text-[11px] text-slate-300 font-medium">Strong Fits (75%+)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">{appliedCount}</div>
              <div className="text-[11px] text-slate-300 font-medium">Applied</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, company, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              id="job-search-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Min Match:</span>
              <select
                aria-label="Filter by minimum match percentage"
                value={minMatch}
                onChange={(e) => setMinMatch(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                id="min-match-select"
              >
                <option value={0}>All Matches</option>
                <option value={60}>60%+ Fit</option>
                <option value={75}>75%+ Strong</option>
                <option value={85}>85%+ Top Tier</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="font-medium">Type:</span>
              <select
                aria-label="Filter by work arrangement type"
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                id="work-type-select"
              >
                <option value="ALL">All Modes</option>
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="font-medium">Sort:</span>
              <select
                aria-label="Sort recommended jobs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                id="sort-by-select"
              >
                <option value="match">Match Score</option>
                <option value="salary">Salary (Highest)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredMatches.length}</strong> matching career opportunities
          </span>
          <button
            onClick={onViewSkills}
            className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 hover:underline"
          >
            Adjust your skill matrix to optimize scores <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matching jobs found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try lowering the minimum match threshold or clearing the search query to view all available roles.
          </p>
          <button
            onClick={() => { setMinMatch(0); setSearchTerm(''); setSelectedWorkType('ALL'); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const { job, matchPercentage, matchedSkills, gapSkills, isApplied, applicationStatus } = match;

            // Badge styling according to match score
            let matchColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let matchLabel = 'Exceptional Match';
            if (matchPercentage < 50) {
              matchColor = 'bg-slate-50 text-slate-700 border-slate-200';
              matchLabel = 'Growth Opportunity';
            } else if (matchPercentage < 75) {
              matchColor = 'bg-amber-50 text-amber-700 border-amber-200';
              matchLabel = 'Moderate Match';
            } else if (matchPercentage < 88) {
              matchColor = 'bg-blue-50 text-blue-700 border-blue-200';
              matchLabel = 'Strong Match';
            }

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative group"
                id={`job-card-${job.id}`}
              >
                <div>
                  {/* Top row: Company initials badge, Title, and Match Gauge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: job.logo_bg || '#4F46E5' }}
                      >
                        {job.company.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {job.company} • <span className="text-slate-400">{job.department}</span>
                        </p>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg border font-black text-sm sm:text-base flex items-center gap-1.5 ${matchColor}`}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{matchPercentage}%</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{matchLabel}</span>
                    </div>
                  </div>

                  {/* Metadata: Location, Salary, Work Type */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                      {job.work_type}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                      {job.experience_level}
                    </span>
                  </div>

                  {/* Recommendation Insight */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 italic flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{match.recommendationReason}</span>
                  </div>

                  {/* Skills Alignment Preview */}
                  <div className="mt-4 space-y-2">
                    {/* Matched Skills */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Matched Skills ({matchedSkills.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 4).map(m => (
                          <span
                            key={m.skill.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-medium"
                          >
                            <span>{m.skill.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">L{m.studentProficiency}</span>
                          </span>
                        ))}
                        {matchedSkills.length > 4 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{matchedSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skill Gaps (if any) */}
                    {gapSkills.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                          <span className="flex items-center gap-1 text-amber-700">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Bridge Gaps ({gapSkills.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gapSkills.slice(0, 3).map(g => (
                            <span
                              key={g.skill.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium"
                            >
                              <span>{g.skill.name}</span>
                              <span className="text-[10px] text-amber-600 font-semibold">({g.estimatedBridgeTimeWeeks}w)</span>
                            </span>
                          ))}
                          {gapSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{gapSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectJob(match)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    id={`view-fit-btn-${job.id}`}
                  >
                    <span>Analyze Fit & Roadmap</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {isApplied ? (
                    <div className="py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{applicationStatus || 'Applied'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onApply(job.id, matchPercentage)}
                      className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                      id={`quick-apply-btn-${job.id}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Quick Apply</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
