import {
  UserRecord,
  StudentProfileRecord,
  SkillRecord,
  StudentSkillRecord,
  JobPostingRecord,
  JobRequiredSkillRecord,
  JobApplicationRecord
} from '../types/mysql-schema';
import {
  INITIAL_USERS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_SKILLS,
  INITIAL_STUDENT_SKILLS,
  INITIAL_JOB_POSTINGS,
  INITIAL_JOB_REQUIRED_SKILLS,
  INITIAL_JOB_APPLICATIONS,
  MYSQL_DDL_AND_SEED_SQL
} from '../data/initial-mysql-data';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export interface SQLLogEntry {
  id: string;
  query: string;
  timestamp: string;
  executionTimeMs: number;
  rowsAffected?: number;
  status: 'SUCCESS' | 'ERROR';
}

export interface SQLQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  query: string;
  error?: string;
}

class MySQLEngine {
  private users: UserRecord[] = [...INITIAL_USERS];
  private studentProfiles: StudentProfileRecord[] = [...INITIAL_STUDENT_PROFILES];
  private skills: SkillRecord[] = [...INITIAL_SKILLS];
  private studentSkills: StudentSkillRecord[] = [...INITIAL_STUDENT_SKILLS];
  private jobPostings: JobPostingRecord[] = [...INITIAL_JOB_POSTINGS];
  private jobRequiredSkills: JobRequiredSkillRecord[] = [...INITIAL_JOB_REQUIRED_SKILLS];
  private jobApplications: JobApplicationRecord[] = [...INITIAL_JOB_APPLICATIONS];

  private sqlLogs: SQLLogEntry[] = [];
  private listeners: (() => void)[] = [];
  private isCloudSynced: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.logQuery('SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS = 1;', 1, 0);
    this.logQuery('USE skillbridge_db;', 1, 0);
  }

  // Subscribe to changes
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error notifying MySQL engine subscriber:', e);
      }
    });
  }

  // Cloud Firestore Sync
  public async initSync(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Attempt to load any saved state from Firestore
      const snap = await getDoc(doc(db, 'system_state', 'mysql_metadata'));
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData.studentProfiles) this.studentProfiles = cloudData.studentProfiles;
        if (cloudData.studentSkills) this.studentSkills = cloudData.studentSkills;
        if (cloudData.jobPostings) this.jobPostings = cloudData.jobPostings;
        if (cloudData.jobRequiredSkills) this.jobRequiredSkills = cloudData.jobRequiredSkills;
        if (cloudData.jobApplications) this.jobApplications = cloudData.jobApplications;
        this.isCloudSynced = true;
        this.logQuery('/* Synced persistent relational tables from Firestore Cloud */', 12, this.studentProfiles.length);
      } else {
        // First time initialization: persist initial seed data to Firestore
        await this.syncToCloud();
      }
    } catch (err) {
      console.warn('Firestore sync probe:', err);
      // Works in offline / sandbox mode seamlessly
    }
    this.notify();
  }

  public initFromFirestore(): Promise<void> {
    return this.initSync();
  }

  public getState() {
    return {
      users: [...this.users],
      student_profiles: [...this.studentProfiles],
      skills: [...this.skills],
      student_skills: [...this.studentSkills],
      job_postings: [...this.jobPostings],
      job_required_skills: [...this.jobRequiredSkills],
      job_applications: [...this.jobApplications]
    };
  }

  public async syncToCloud(): Promise<void> {
    try {
      await setDoc(doc(db, 'system_state', 'mysql_metadata'), {
        studentProfiles: this.studentProfiles,
        studentSkills: this.studentSkills,
        jobPostings: this.jobPostings,
        jobRequiredSkills: this.jobRequiredSkills,
        jobApplications: this.jobApplications,
        lastSyncedAt: new Date().toISOString()
      }, { merge: true });
      this.isCloudSynced = true;
    } catch (err) {
      console.warn('Cloud sync background error:', err);
    }
  }

  public getIsCloudSynced(): boolean {
    return this.isCloudSynced;
  }

  // Log queries
  private logQuery(query: string, executionTimeMs: number, rowsAffected: number = 0, status: 'SUCCESS' | 'ERROR' = 'SUCCESS'): void {
    this.sqlLogs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      query: query.trim(),
      timestamp: new Date().toLocaleTimeString(),
      executionTimeMs,
      rowsAffected,
      status
    });
    if (this.sqlLogs.length > 50) {
      this.sqlLogs.pop();
    }
  }

  public getLogs(): SQLLogEntry[] {
    return [...this.sqlLogs];
  }

  // Public Getters
  public getUsers(): UserRecord[] {
    return [...this.users];
  }

  public getStudentProfiles(): StudentProfileRecord[] {
    return [...this.studentProfiles];
  }

  public getStudentProfile(id: number): StudentProfileRecord | undefined {
    return this.studentProfiles.find(s => s.id === id);
  }

  public getSkills(): SkillRecord[] {
    return [...this.skills];
  }

  public getStudentSkills(studentId: number): StudentSkillRecord[] {
    return this.studentSkills.filter(ss => ss.student_id === studentId);
  }

  public getJobPostings(): JobPostingRecord[] {
    return [...this.jobPostings];
  }

  public getJobRequiredSkills(jobId?: number): JobRequiredSkillRecord[] {
    if (jobId !== undefined) {
      return this.jobRequiredSkills.filter(j => j.job_id === jobId);
    }
    return [...this.jobRequiredSkills];
  }

  public getJobApplications(studentId?: number): JobApplicationRecord[] {
    if (studentId !== undefined) {
      return this.jobApplications.filter(a => a.student_id === studentId);
    }
    return [...this.jobApplications];
  }

  // Mutations with MySQL Logging
  public updateStudentProfile(idOrProfile: number | (Partial<StudentProfileRecord> & { id: number }), data?: Partial<StudentProfileRecord>): void {
    const start = performance.now();
    let id: number;
    let updates: Partial<StudentProfileRecord>;

    if (typeof idOrProfile === 'number') {
      id = idOrProfile;
      updates = data || {};
    } else {
      id = idOrProfile.id;
      updates = idOrProfile;
    }

    const index = this.studentProfiles.findIndex(s => s.id === id);
    if (index === -1) return;

    this.studentProfiles[index] = {
      ...this.studentProfiles[index],
      ...updates,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const updated = this.studentProfiles[index];
    const time = Math.round(performance.now() - start);
    const sql = `UPDATE student_profiles SET university = '${updated.university || ''}', major = '${updated.major || ''}', gpa = ${updated.gpa ?? 3.5}, target_role = '${updated.target_role || ''}', bio = '${(updated.bio || '').replace(/'/g, "\\'")}', updated_at = NOW() WHERE id = ${id};`;
    this.logQuery(sql, time, 1);
    this.syncToCloud();
    this.notify();
  }

  public setStudentSkillProficiency(studentId: number, skillId: number, proficiencyLevel: number): void {
    const start = performance.now();
    const existingIndex = this.studentSkills.findIndex(
      ss => ss.student_id === studentId && ss.skill_id === skillId
    );

    if (existingIndex !== -1) {
      this.studentSkills[existingIndex].proficiency_level = proficiencyLevel;
      const time = Math.round(performance.now() - start);
      const sql = `UPDATE student_skills SET proficiency_level = ${proficiencyLevel} WHERE student_id = ${studentId} AND skill_id = ${skillId};`;
      this.logQuery(sql, time, 1);
    } else {
      const newId = Math.max(0, ...this.studentSkills.map(s => s.id)) + 1;
      this.studentSkills.push({
        id: newId,
        student_id: studentId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: 1.0,
        verified: false,
        created_at: new Date().toISOString().substring(0, 10)
      });
      const time = Math.round(performance.now() - start);
      const sql = `INSERT INTO student_skills (student_id, skill_id, proficiency_level, years_experience, verified) VALUES (${studentId}, ${skillId}, ${proficiencyLevel}, 1.0, FALSE);`;
      this.logQuery(sql, time, 1);
    }

    this.syncToCloud();
    this.notify();
  }

  public addStudentSkill(studentId: number, skillId: number, proficiencyLevel: number, yearsExperience: number = 1.0): void {
    const start = performance.now();
    const existingIndex = this.studentSkills.findIndex(
      ss => ss.student_id === studentId && ss.skill_id === skillId
    );

    if (existingIndex !== -1) {
      this.studentSkills[existingIndex].proficiency_level = proficiencyLevel;
      this.studentSkills[existingIndex].years_experience = yearsExperience;
      const time = Math.round(performance.now() - start);
      const sql = `UPDATE student_skills SET proficiency_level = ${proficiencyLevel}, years_experience = ${yearsExperience} WHERE student_id = ${studentId} AND skill_id = ${skillId};`;
      this.logQuery(sql, time, 1);
    } else {
      const newId = Math.max(0, ...this.studentSkills.map(s => s.id)) + 1;
      this.studentSkills.push({
        id: newId,
        student_id: studentId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: yearsExperience,
        verified: true,
        created_at: new Date().toISOString().substring(0, 10)
      });
      const time = Math.round(performance.now() - start);
      const sql = `INSERT INTO student_skills (student_id, skill_id, proficiency_level, years_experience, verified) VALUES (${studentId}, ${skillId}, ${proficiencyLevel}, ${yearsExperience}, TRUE);`;
      this.logQuery(sql, time, 1);
    }

    this.syncToCloud();
    this.notify();
  }

  public removeStudentSkill(studentId: number, skillId: number): void {
    const start = performance.now();
    const beforeCount = this.studentSkills.length;
    this.studentSkills = this.studentSkills.filter(
      ss => !(ss.student_id === studentId && ss.skill_id === skillId)
    );
    const deleted = beforeCount - this.studentSkills.length;
    const time = Math.round(performance.now() - start);
    const sql = `DELETE FROM student_skills WHERE student_id = ${studentId} AND skill_id = ${skillId};`;
    this.logQuery(sql, time, deleted);
    this.syncToCloud();
    this.notify();
  }

  public applyToJob(studentId: number, jobId: number, matchPercentage: number, notes?: string): boolean {
    const start = performance.now();
    const exists = this.jobApplications.some(a => a.student_id === studentId && a.job_id === jobId);
    if (exists) return false;

    const newId = Math.max(0, ...this.jobApplications.map(a => a.id)) + 1;
    const newApp: JobApplicationRecord = {
      id: newId,
      student_id: studentId,
      job_id: jobId,
      match_percentage_at_apply: matchPercentage,
      status: 'Applied',
      notes: notes || 'Submitted via SkillBridge Automated Matching portal',
      applied_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.jobApplications.unshift(newApp);
    const time = Math.round(performance.now() - start);
    const sql = `INSERT INTO job_applications (student_id, job_id, match_percentage_at_apply, status, notes) VALUES (${studentId}, ${jobId}, ${matchPercentage}, 'Applied', '${(notes || '').replace(/'/g, "\\'")}');`;
    this.logQuery(sql, time, 1);
    this.syncToCloud();
    this.notify();
    return true;
  }

  public createJob(
    jobData: Omit<JobPostingRecord, 'id' | 'posted_at'>,
    requiredSkills: { skillId: number; importance: 'Required' | 'Preferred'; minProficiency: number; weight: number }[]
  ): JobPostingRecord {
    const start = performance.now();
    const newJobId = Math.max(0, ...this.jobPostings.map(j => j.id)) + 1;
    const newJob: JobPostingRecord = {
      ...jobData,
      id: newJobId,
      posted_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.jobPostings.unshift(newJob);

    // Insert required skills
    let nextReqId = Math.max(0, ...this.jobRequiredSkills.map(j => j.id)) + 1;
    for (const req of requiredSkills) {
      this.jobRequiredSkills.push({
        id: nextReqId++,
        job_id: newJobId,
        skill_id: req.skillId,
        importance: req.importance,
        min_proficiency: req.minProficiency,
        weight: req.weight
      });
    }

    const time = Math.round(performance.now() - start);
    const sql = `INSERT INTO job_postings (title, company, department, location, work_type, experience_level, salary_min, salary_max, description, deadline) VALUES ('${jobData.title.replace(/'/g, "\\'")}', '${jobData.company.replace(/'/g, "\\'")}', '${jobData.department}', '${jobData.location}', '${jobData.work_type}', '${jobData.experience_level}', ${jobData.salary_min}, ${jobData.salary_max}, '${jobData.description.replace(/'/g, "\\'")}', '${jobData.deadline}');`;
    this.logQuery(sql, time, 1 + requiredSkills.length);
    this.syncToCloud();
    this.notify();
    return newJob;
  }

  public createJobWithRequirements(
    jobData: Omit<JobPostingRecord, 'id' | 'posted_at'>,
    requiredSkills: { skillId: number; importance: 'Required' | 'Preferred'; minProficiency: number; weight: number }[]
  ): JobPostingRecord {
    return this.createJob(jobData, requiredSkills);
  }

  // Live SQL Query Evaluator for the interactive Studio
  public executeQuery(sqlQuery: string): SQLQueryResult {
    const start = performance.now();
    const trimmed = sqlQuery.trim();
    const upper = trimmed.toUpperCase();

    try {
      // 1. SHOW TABLES
      if (upper.startsWith('SHOW TABLES')) {
        const time = Math.round(performance.now() - start);
        this.logQuery(trimmed, time, 8);
        return {
          columns: ['Tables_in_skillbridge_db', 'Engine', 'Rows_Estimate'],
          rows: [
            { Tables_in_skillbridge_db: 'users', Engine: 'InnoDB', Rows_Estimate: this.users.length },
            { Tables_in_skillbridge_db: 'student_profiles', Engine: 'InnoDB', Rows_Estimate: this.studentProfiles.length },
            { Tables_in_skillbridge_db: 'skills', Engine: 'InnoDB', Rows_Estimate: this.skills.length },
            { Tables_in_skillbridge_db: 'student_skills', Engine: 'InnoDB', Rows_Estimate: this.studentSkills.length },
            { Tables_in_skillbridge_db: 'job_postings', Engine: 'InnoDB', Rows_Estimate: this.jobPostings.length },
            { Tables_in_skillbridge_db: 'job_required_skills', Engine: 'InnoDB', Rows_Estimate: this.jobRequiredSkills.length },
            { Tables_in_skillbridge_db: 'career_recommendations', Engine: 'InnoDB', Rows_Estimate: 16 },
            { Tables_in_skillbridge_db: 'job_applications', Engine: 'InnoDB', Rows_Estimate: this.jobApplications.length }
          ],
          rowCount: 8,
          executionTimeMs: time,
          query: trimmed
        };
      }

      // 2. DESCRIBE / EXPLAIN <table>
      if (upper.startsWith('DESCRIBE') || upper.startsWith('DESC')) {
        const parts = trimmed.split(/\s+/);
        const tableName = (parts[1] || '').replace(/;$/, '').toLowerCase();
        const time = Math.round(performance.now() - start);
        this.logQuery(trimmed, time, 1);

        const schemaMeta: Record<string, { Field: string; Type: string; Null: string; Key: string; Default: any }[]> = {
          users: [
            { Field: 'id', Type: 'int AUTO_INCREMENT', Null: 'NO', Key: 'PRI', Default: null },
            { Field: 'email', Type: 'varchar(255)', Null: 'NO', Key: 'UNI', Default: null },
            { Field: 'full_name', Type: 'varchar(150)', Null: 'NO', Key: '', Default: null },
            { Field: 'role', Type: "enum('student','recruiter','admin')", Null: 'NO', Key: '', Default: 'student' },
            { Field: 'created_at', Type: 'timestamp', Null: 'NO', Key: '', Default: 'CURRENT_TIMESTAMP' }
          ],
          student_profiles: [
            { Field: 'id', Type: 'int AUTO_INCREMENT', Null: 'NO', Key: 'PRI', Default: null },
            { Field: 'user_id', Type: 'int', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'university', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null },
            { Field: 'major', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null },
            { Field: 'degree', Type: 'varchar(150)', Null: 'NO', Key: '', Default: null },
            { Field: 'graduation_year', Type: 'int', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'gpa', Type: 'decimal(3,2)', Null: 'NO', Key: '', Default: '3.50' },
            { Field: 'bio', Type: 'text', Null: 'YES', Key: '', Default: null },
            { Field: 'target_role', Type: 'varchar(150)', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'updated_at', Type: 'timestamp', Null: 'NO', Key: '', Default: 'CURRENT_TIMESTAMP' }
          ],
          skills: [
            { Field: 'id', Type: 'int AUTO_INCREMENT', Null: 'NO', Key: 'PRI', Default: null },
            { Field: 'name', Type: 'varchar(100)', Null: 'NO', Key: 'UNI', Default: null },
            { Field: 'category', Type: 'varchar(100)', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'description', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null }
          ],
          student_skills: [
            { Field: 'id', Type: 'int AUTO_INCREMENT', Null: 'NO', Key: 'PRI', Default: null },
            { Field: 'student_id', Type: 'int', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'skill_id', Type: 'int', Null: 'NO', Key: 'MUL', Default: null },
            { Field: 'proficiency_level', Type: 'int(1-5)', Null: 'NO', Key: '', Default: '3' },
            { Field: 'years_experience', Type: 'decimal(3,1)', Null: 'NO', Key: '', Default: '1.0' },
            { Field: 'verified', Type: 'tinyint(1)', Null: 'NO', Key: '', Default: '0' }
          ],
          job_postings: [
            { Field: 'id', Type: 'int AUTO_INCREMENT', Null: 'NO', Key: 'PRI', Default: null },
            { Field: 'title', Type: 'varchar(200)', Null: 'NO', Key: '', Default: null },
            { Field: 'company', Type: 'varchar(200)', Null: 'NO', Key: '', Default: null },
            { Field: 'location', Type: 'varchar(150)', Null: 'NO', Key: '', Default: null },
            { Field: 'work_type', Type: "enum('Remote','Hybrid','On-site')", Null: 'NO', Key: 'MUL', Default: 'Remote' },
            { Field: 'salary_min', Type: 'int', Null: 'NO', Key: '', Default: null },
            { Field: 'salary_max', Type: 'int', Null: 'NO', Key: '', Default: null }
          ]
        };

        const rows = schemaMeta[tableName] || schemaMeta['student_profiles'];
        return {
          columns: ['Field', 'Type', 'Null', 'Key', 'Default'],
          rows,
          rowCount: rows.length,
          executionTimeMs: time,
          query: trimmed
        };
      }

      // 3. SELECT Queries
      if (upper.startsWith('SELECT')) {
        let rows: Record<string, any>[] = [];

        if (upper.includes('FROM STUDENT_PROFILES') || upper.includes('FROM `STUDENT_PROFILES`')) {
          rows = this.studentProfiles.map(s => {
            const u = this.users.find(usr => usr.id === s.user_id);
            return {
              id: s.id,
              full_name: u?.full_name || 'Student',
              university: s.university,
              major: s.major,
              graduation_year: s.graduation_year,
              gpa: s.gpa,
              target_role: s.target_role,
              skills_count: this.studentSkills.filter(sk => sk.student_id === s.id).length
            };
          });
        } else if (upper.includes('FROM SKILLS')) {
          rows = this.skills.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            description: s.description
          }));
        } else if (upper.includes('FROM STUDENT_SKILLS')) {
          rows = this.studentSkills.map(ss => {
            const skill = this.skills.find(s => s.id === ss.skill_id);
            const student = this.studentProfiles.find(st => st.id === ss.student_id);
            const user = this.users.find(u => u.id === student?.user_id);
            return {
              id: ss.id,
              student: user?.full_name || `Student #${ss.student_id}`,
              skill_name: skill?.name || `Skill #${ss.skill_id}`,
              category: skill?.category || '',
              proficiency_level: ss.proficiency_level,
              years_experience: ss.years_experience,
              verified: ss.verified ? 'YES' : 'NO'
            };
          });
        } else if (upper.includes('FROM JOB_POSTINGS')) {
          rows = this.jobPostings.map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            work_type: j.work_type,
            experience_level: j.experience_level,
            salary: `$${(j.salary_min / 1000)}k - $${(j.salary_max / 1000)}k`,
            required_skills_count: this.jobRequiredSkills.filter(jr => jr.job_id === j.id && jr.importance === 'Required').length
          }));
        } else if (upper.includes('FROM JOB_APPLICATIONS')) {
          rows = this.jobApplications.map(a => {
            const student = this.studentProfiles.find(s => s.id === a.student_id);
            const user = this.users.find(u => u.id === student?.user_id);
            const job = this.jobPostings.find(j => j.id === a.job_id);
            return {
              application_id: a.id,
              applicant: user?.full_name || `Student #${a.student_id}`,
              job_title: job?.title || `Job #${a.job_id}`,
              company: job?.company || '',
              match_at_apply: `${a.match_percentage_at_apply}%`,
              status: a.status,
              applied_at: a.applied_at
            };
          });
        } else {
          // Default joined recommendation query
          rows = this.jobPostings.slice(0, 5).map(j => ({
            job_id: j.id,
            title: j.title,
            company: j.company,
            work_type: j.work_type,
            sample_match_rate: '88.5%',
            department: j.department
          }));
        }

        // Apply simple LIMIT if present
        const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i);
        if (limitMatch && limitMatch[1]) {
          const limit = parseInt(limitMatch[1], 10);
          rows = rows.slice(0, limit);
        }

        const columns = rows.length > 0 ? Object.keys(rows[0]) : ['result'];
        const time = Math.max(1, Math.round(performance.now() - start));
        this.logQuery(trimmed, time, rows.length);

        return {
          columns,
          rows,
          rowCount: rows.length,
          executionTimeMs: time,
          query: trimmed
        };
      }

      // Default fallback
      const time = Math.round(performance.now() - start);
      this.logQuery(trimmed, time, 1);
      return {
        columns: ['status', 'message'],
        rows: [{ status: 'OK', message: `Query executed successfully (${trimmed.substring(0, 30)}...)` }],
        rowCount: 1,
        executionTimeMs: time,
        query: trimmed
      };
    } catch (err: any) {
      const time = Math.round(performance.now() - start);
      this.logQuery(trimmed, time, 0, 'ERROR');
      return {
        columns: ['error_code', 'error_message'],
        rows: [{ error_code: 'ER_SYNTAX_ERROR', error_message: err.message || 'Error executing query' }],
        rowCount: 0,
        executionTimeMs: time,
        query: trimmed,
        error: err.message
      };
    }
  }

  // Export full SQL dump string
  public exportMySQLDump(): string {
    let sql = MYSQL_DDL_AND_SEED_SQL + '\n\n';
    sql += '-- ==========================================================\n';
    sql += `-- CURRENT SNAPSHOT EXPORT GENERATED AT ${new Date().toISOString()}\n`;
    sql += '-- ==========================================================\n\n';

    // Users
    sql += '-- Insert Current Users\n';
    for (const u of this.users) {
      sql += `INSERT INTO users (id, email, full_name, role) VALUES (${u.id}, '${u.email}', '${u.full_name.replace(/'/g, "\\'")}', '${u.role}') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);\n`;
    }
    sql += '\n';

    // Student Profiles
    sql += '-- Insert Current Student Profiles\n';
    for (const p of this.studentProfiles) {
      sql += `INSERT INTO student_profiles (id, user_id, university, major, degree, graduation_year, gpa, bio, target_role) VALUES (${p.id}, ${p.user_id}, '${p.university.replace(/'/g, "\\'")}', '${p.major.replace(/'/g, "\\'")}', '${p.degree.replace(/'/g, "\\'")}', ${p.graduation_year}, ${p.gpa}, '${(p.bio || '').replace(/'/g, "\\'")}', '${p.target_role.replace(/'/g, "\\'")}') ON DUPLICATE KEY UPDATE gpa=VALUES(gpa), target_role=VALUES(target_role);\n`;
    }
    sql += '\n';

    // Student Skills
    sql += '-- Insert Current Student Skills Matrix\n';
    for (const ss of this.studentSkills) {
      sql += `INSERT INTO student_skills (id, student_id, skill_id, proficiency_level, years_experience, verified) VALUES (${ss.id}, ${ss.student_id}, ${ss.skill_id}, ${ss.proficiency_level}, ${ss.years_experience}, ${ss.verified ? 'TRUE' : 'FALSE'}) ON DUPLICATE KEY UPDATE proficiency_level=VALUES(proficiency_level);\n`;
    }
    sql += '\n';

    // Job Applications
    sql += '-- Insert Current Job Applications\n';
    for (const a of this.jobApplications) {
      sql += `INSERT INTO job_applications (id, student_id, job_id, match_percentage_at_apply, status, notes) VALUES (${a.id}, ${a.student_id}, ${a.job_id}, ${a.match_percentage_at_apply}, '${a.status}', '${(a.notes || '').replace(/'/g, "\\'")}') ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;
    }

    return sql;
  }
}

// Global singleton instance
export const mysqlEngine = new MySQLEngine();
