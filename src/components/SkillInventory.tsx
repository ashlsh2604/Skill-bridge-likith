import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  Search,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  StudentProfileRecord,
  SkillRecord,
  StudentSkillRecord,
  SkillCategory
} from '../types/mysql-schema';

interface SkillInventoryProps {
  student: StudentProfileRecord;
  studentSkills: StudentSkillRecord[];
  allSkills: SkillRecord[];
  onSetProficiency: (skillId: number, level: number) => void;
  onAddSkill: (skillId: number, level: number, years: number) => void;
  onRemoveSkill: (skillId: number) => void;
  onViewMatches: () => void;
}

const PROFICIENCY_LABELS = [
  'Beginner (Foundations)',
  'Elementary (Working Knowledge)',
  'Intermediate (Autonomous)',
  'Advanced (Production Ready)',
  'Expert (Lead / Architect)'
];

export const SkillInventory: React.FC<SkillInventoryProps> = ({
  student,
  studentSkills,
  allSkills,
  onSetProficiency,
  onAddSkill,
  onRemoveSkill,
  onViewMatches
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Add modal state
  const [modalSkillId, setModalSkillId] = useState<number>(0);
  const [modalProficiency, setModalProficiency] = useState<number>(3);
  const [modalYears, setModalYears] = useState<number>(1.5);

  const skillMap = useMemo(() => {
    const map = new Map<number, SkillRecord>();
    allSkills.forEach(s => map.set(s.id, s));
    return map;
  }, [allSkills]);

  // Enriched student skills
  const enrichedSkills = useMemo(() => {
    return studentSkills.map(ss => {
      const info = skillMap.get(ss.skill_id);
      return {
        ...ss,
        name: info?.name || `Skill #${ss.skill_id}`,
        category: (info?.category || 'Languages') as SkillCategory,
        description: info?.description || ''
      };
    });
  }, [studentSkills, skillMap]);

  // Categories present in master list
  const categories: SkillCategory[] = [
    'Languages',
    'Frontend',
    'Backend & APIs',
    'Database & Storage',
    'Cloud & DevOps',
    'Data Science & AI',
    'Cybersecurity',
    'Tools & Methodologies',
    'Soft Skills'
  ];

  // Filtered skills
  const filteredSkills = useMemo(() => {
    return enrichedSkills.filter(s => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (searchTerm.trim() && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [enrichedSkills, selectedCategory, searchTerm]);

  // Available skills to add (excluding already added)
  const availableToAdd = useMemo(() => {
    const ownedIds = new Set(studentSkills.map(ss => ss.skill_id));
    return allSkills.filter(s => !ownedIds.has(s.id));
  }, [allSkills, studentSkills]);

  const handleOpenAddModal = (skillId?: number) => {
    const firstAvailable = skillId || (availableToAdd.length > 0 ? availableToAdd[0].id : 0);
    setModalSkillId(firstAvailable);
    setModalProficiency(3);
    setModalYears(1.0);
    setIsAddModalOpen(true);
  };

  const handleSaveNewSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSkillId) return;
    onAddSkill(modalSkillId, modalProficiency, modalYears);
    setIsAddModalOpen(false);
  };

  const averageRating = (
    studentSkills.reduce((sum, s) => sum + s.proficiency_level, 0) / Math.max(1, studentSkills.length)
  ).toFixed(1);

  return (
    <div className="space-y-6" id="skill-inventory-root">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Student Skills Matrix</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                MySQL Relational Table: `student_skills`
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Rate your true proficiency from Level 1 to 5. The automated recommendation engine uses these ratings to calculate real-time compatibility and highlight career bridges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAddModal()}
              disabled={availableToAdd.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-2xs disabled:opacity-50"
              id="add-skill-button"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Skill</span>
            </button>
            <button
              onClick={onViewMatches}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
            >
              <span>View Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Recorded Skills</div>
            <div className="text-xl font-bold text-slate-900">{studentSkills.length} Verified</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Avg Proficiency</div>
            <div className="text-xl font-bold text-indigo-600">{averageRating} / 5.0</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Expert Roles (L4-L5)</div>
            <div className="text-xl font-bold text-emerald-600">
              {studentSkills.filter(s => s.proficiency_level >= 4).length}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Industry Catalog</div>
            <div className="text-xl font-bold text-slate-700">{allSkills.length} Available</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({enrichedSkills.length})
            </button>
            {categories.map(cat => {
              const count = enrichedSkills.filter(s => s.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skills Matrix Grid */}
      {filteredSkills.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No skills in this filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or add a new skill from the 40+ catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skill => (
            <div
              key={skill.skill_id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition flex flex-col justify-between space-y-3"
              id={`skill-card-${skill.skill_id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{skill.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {skill.category}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveSkill(skill.skill_id)}
                    title="Remove skill from profile"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {skill.description}
                </p>
              </div>

              {/* Interactive Proficiency Rating Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Proficiency</span>
                  <span className="font-bold text-indigo-600 text-[11px]">
                    Level {skill.proficiency_level} / 5
                  </span>
                </div>

                {/* 5-Segment Interactive Rating Bar */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isFilled = lvl <= skill.proficiency_level;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => onSetProficiency(skill.skill_id, lvl)}
                        title={`Set to Level ${lvl}: ${PROFICIENCY_LABELS[lvl - 1]}`}
                        className={`flex-1 h-3 rounded-sm transition-all ${
                          isFilled
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{PROFICIENCY_LABELS[skill.proficiency_level - 1].split('(')[0]}</span>
                  <span>{skill.years_experience} yrs exp</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Add Skill to Profile</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Skill from Master Catalog ({availableToAdd.length} available)
                </label>
                <select
                  value={modalSkillId}
                  onChange={(e) => setModalSkillId(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {availableToAdd.map(sk => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name} ({sk.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Proficiency Rating: Level {modalProficiency} ({PROFICIENCY_LABELS[modalProficiency - 1]})
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={modalProficiency}
                  onChange={(e) => setModalProficiency(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1: Beginner</span>
                  <span>3: Intermediate</span>
                  <span>5: Expert</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Practical Experience
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="15"
                  value={modalYears}
                  onChange={(e) => setModalYears(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Add to MySQL Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
