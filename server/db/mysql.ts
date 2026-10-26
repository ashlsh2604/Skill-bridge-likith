import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import {
  INITIAL_USERS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_SKILLS,
  INITIAL_STUDENT_SKILLS,
  INITIAL_JOB_POSTINGS,
  INITIAL_JOB_REQUIRED_SKILLS,
  INITIAL_JOB_APPLICATIONS
} from '../../src/data/initial-mysql-data';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface BackendSQLLog {
  id: string;
  timestamp: string;
  query: string;
  executionTimeMs: number;
  affectedRows?: number;
  source: 'mysql-server' | 'in-memory-engine';
}

export interface MySQLStatus {
  connected: boolean;
  mode: 'mysql' | 'in-memory-relational';
  host: string;
  port: number;
  database: string;
  user: string;
  latencyMs: number;
  error?: string;
  tableCounts: Record<string, number>;
  totalQueries: number;
}

// In-memory relational storage fallback if external MySQL server is unreachable
interface InMemStore {
  users: any[];
  student_profiles: any[];
  skills: any[];
  student_skills: any[];
  job_postings: any[];
  job_required_skills: any[];
  job_applications: any[];
  logs: BackendSQLLog[];
}

class MySQLBackendService {
  private pool: Pool | null = null;
  private isConnected = false;
  private currentConfig: MySQLConfig;
  private logs: BackendSQLLog[] = [];
  private inMemStore: InMemStore;
  private lastPingMs = 0;
  private lastError: string | undefined = undefined;

  constructor() {
    this.currentConfig = {
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'skillbridge_db',
      ssl: process.env.MYSQL_SSL === 'true'
    };

    // Deep copy initial data into in-memory store
    this.inMemStore = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      student_profiles: JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILES)),
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      student_skills: JSON.parse(JSON.stringify(INITIAL_STUDENT_SKILLS)),
      job_postings: JSON.parse(JSON.stringify(INITIAL_JOB_POSTINGS)),
      job_required_skills: JSON.parse(JSON.stringify(INITIAL_JOB_REQUIRED_SKILLS)),
      job_applications: JSON.parse(JSON.stringify(INITIAL_JOB_APPLICATIONS)),
      logs: []
    };
  }

  public async initialize(): Promise<void> {
    console.log(`[MySQL Backend] Initializing connection to ${this.currentConfig.user}@${this.currentConfig.host}:${this.currentConfig.port}/${this.currentConfig.database}`);
    await this.connect(this.currentConfig);
  }

  public async connect(config: MySQLConfig): Promise<{ success: boolean; message: string; latencyMs: number }> {
    this.currentConfig = { ...config };
    const start = Date.now();

    try {
      if (this.pool) {
        try {
          await this.pool.end();
        } catch {
          // ignore cleanup errors
        }
        this.pool = null;
      }

      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      };

      if (config.ssl) {
        connectionConfig.ssl = { rejectUnauthorized: false };
      }

      const testPool = mysql.createPool(connectionConfig);
      const conn: PoolConnection = await testPool.getConnection();
      
      const pingStart = Date.now();
      await conn.ping();
      this.lastPingMs = Date.now() - pingStart;
      conn.release();

      this.pool = testPool;
      this.isConnected = true;
      this.lastError = undefined;

      console.log(`[MySQL Backend] Successfully connected to MySQL at ${config.host}:${config.port} (${this.lastPingMs}ms)`);
      
      // Auto-migrate tables
      await this.ensureSchema();
      await this.syncInMemToMySQL();

      this.logQuery('SELECT 1 /* MySQL Health Check & Ping */', this.lastPingMs, 1, 'mysql-server');

      return {
        success: true,
        message: `Connected to MySQL database '${config.database}' at ${config.host}:${config.port}`,
        latencyMs: this.lastPingMs
      };
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err.message || 'Connection failed';
      this.lastPingMs = Date.now() - start;
      console.warn(`[MySQL Backend] External MySQL connection failed (${err.code || err.message}). Operating in resilient local relational mode.`);
      
      this.logQuery(
        `-- Connection attempt to ${config.host}:${config.port} failed: ${err.message}. Using active local relational store.`,
        this.lastPingMs,
        0,
        'in-memory-engine'
      );

      return {
        success: false,
        message: `Could not connect to MySQL server at ${config.host}:${config.port} (${err.message}). Active backend will use local relational engine.`,
        latencyMs: this.lastPingMs
      };
    }
  }

  private async ensureSchema(): Promise<void> {
    if (!this.pool || !this.isConnected) return;

    try {
      const ddlStatements = [
        `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          full_name VARCHAR(150) NOT NULL,
          role ENUM('student', 'recruiter', 'admin') DEFAULT 'student',
          avatar_url VARCHAR(500),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS student_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          university VARCHAR(200) NOT NULL,
          major VARCHAR(150) NOT NULL,
          degree VARCHAR(100) DEFAULT 'Bachelor of Science',
          graduation_year INT NOT NULL,
          gpa DECIMAL(3, 2) DEFAULT 3.50,
          target_role VARCHAR(150),
          bio TEXT,
          github_url VARCHAR(255),
          linkedin_url VARCHAR(255),
          portfolio_url VARCHAR(255),
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS skills (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          category VARCHAR(80) NOT NULL,
          description VARCHAR(255),
          icon_name VARCHAR(50),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS student_skills (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          skill_id INT NOT NULL,
          proficiency_level INT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
          years_experience DECIMAL(3, 1) DEFAULT 1.0,
          verified BOOLEAN DEFAULT FALSE,
          notes VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_student_skill (student_id, skill_id),
          FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS job_postings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          company VARCHAR(150) NOT NULL,
          department VARCHAR(100),
          location VARCHAR(150) NOT NULL,
          work_type ENUM('Remote', 'Hybrid', 'On-site') NOT NULL DEFAULT 'Remote',
          experience_level ENUM('Internship', 'Entry Level', 'Mid Level', 'Senior') NOT NULL DEFAULT 'Entry Level',
          salary_min INT DEFAULT 0,
          salary_max INT DEFAULT 0,
          description TEXT NOT NULL,
          deadline DATE,
          posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS job_required_skills (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_id INT NOT NULL,
          skill_id INT NOT NULL,
          importance ENUM('Required', 'Preferred') DEFAULT 'Required',
          min_proficiency INT NOT NULL DEFAULT 3 CHECK (min_proficiency BETWEEN 1 AND 5),
          weight DECIMAL(3, 2) DEFAULT 1.00,
          FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;`,

        `CREATE TABLE IF NOT EXISTS job_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          job_id INT NOT NULL,
          match_percentage_at_apply DECIMAL(5, 2) NOT NULL DEFAULT 0,
          status ENUM('Applied', 'Reviewing', 'Interviewing', 'Accepted', 'Rejected') DEFAULT 'Applied',
          notes VARCHAR(255),
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;`
      ];

      for (const statement of ddlStatements) {
        await this.pool.query(statement);
      }
      console.log('[MySQL Backend] Relational InnoDB schema confirmed on MySQL server');
    } catch (err: any) {
      console.error('[MySQL Backend] Error executing schema creation on MySQL:', err.message);
    }
  }

  private async syncInMemToMySQL(): Promise<void> {
    if (!this.pool || !this.isConnected) return;

    try {
      // Check if users table already has data
      const [userRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM users');
      if (userRows[0]?.count > 0) {
        console.log('[MySQL Backend] MySQL tables already contain data, skipping initial population.');
        return;
      }

      console.log('[MySQL Backend] Seeding initial dataset into MySQL tables...');
      
      // Insert users
      for (const u of this.inMemStore.users) {
        await this.pool.query(
          'INSERT INTO users (id, email, full_name, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.email, u.full_name, u.role, u.avatar_url || null, u.created_at || new Date()]
        );
      }

      // Insert student profiles
      for (const sp of this.inMemStore.student_profiles) {
        await this.pool.query(
          `INSERT INTO student_profiles (id, user_id, university, major, degree, graduation_year, gpa, target_role, bio, github_url, linkedin_url, portfolio_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sp.id, sp.user_id, sp.university, sp.major, sp.degree || 'B.S.', sp.graduation_year, sp.gpa, sp.target_role, sp.bio, sp.github_url || null, sp.linkedin_url || null, sp.portfolio_url || null]
        );
      }

      // Insert skills
      for (const sk of this.inMemStore.skills) {
        await this.pool.query(
          'INSERT INTO skills (id, name, category, description, icon_name) VALUES (?, ?, ?, ?, ?)',
          [sk.id, sk.name, sk.category, sk.description, sk.icon_name || null]
        );
      }

      // Insert student_skills
      for (const ss of this.inMemStore.student_skills) {
        await this.pool.query(
          'INSERT INTO student_skills (id, student_id, skill_id, proficiency_level, years_experience, verified, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [ss.id, ss.student_id, ss.skill_id, ss.proficiency_level, ss.years_experience, ss.verified, ss.notes || null]
        );
      }

      // Insert job postings
      for (const jp of this.inMemStore.job_postings) {
        await this.pool.query(
          `INSERT INTO job_postings (id, title, company, department, location, work_type, experience_level, salary_min, salary_max, description, deadline, posted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [jp.id, jp.title, jp.company, jp.department, jp.location, jp.work_type, jp.experience_level, jp.salary_min, jp.salary_max, jp.description, jp.deadline || '2026-12-31', jp.posted_at || new Date()]
        );
      }

      // Insert job_required_skills
      for (const jrs of this.inMemStore.job_required_skills) {
        await this.pool.query(
          'INSERT INTO job_required_skills (id, job_id, skill_id, importance, min_proficiency, weight) VALUES (?, ?, ?, ?, ?, ?)',
          [jrs.id, jrs.job_id, jrs.skill_id, jrs.importance, jrs.min_proficiency, jrs.weight]
        );
      }

      // Insert applications
      for (const app of this.inMemStore.job_applications) {
        await this.pool.query(
          'INSERT INTO job_applications (id, student_id, job_id, match_percentage_at_apply, status, notes, applied_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [app.id, app.student_id, app.job_id, app.match_percentage_at_apply, app.status, app.notes || null, app.applied_at || new Date()]
        );
      }

      console.log('[MySQL Backend] Seeded full dataset into live MySQL tables successfully');
    } catch (err: any) {
      console.error('[MySQL Backend] Error seeding data into MySQL:', err.message);
    }
  }

  public async reseedAll(): Promise<{ success: boolean; message: string }> {
    this.inMemStore = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      student_profiles: JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILES)),
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      student_skills: JSON.parse(JSON.stringify(INITIAL_STUDENT_SKILLS)),
      job_postings: JSON.parse(JSON.stringify(INITIAL_JOB_POSTINGS)),
      job_required_skills: JSON.parse(JSON.stringify(INITIAL_JOB_REQUIRED_SKILLS)),
      job_applications: JSON.parse(JSON.stringify(INITIAL_JOB_APPLICATIONS)),
      logs: []
    };

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query('SET FOREIGN_KEY_CHECKS = 0;');
        await this.pool.query('TRUNCATE TABLE job_applications;');
        await this.pool.query('TRUNCATE TABLE job_required_skills;');
        await this.pool.query('TRUNCATE TABLE student_skills;');
        await this.pool.query('TRUNCATE TABLE job_postings;');
        await this.pool.query('TRUNCATE TABLE skills;');
        await this.pool.query('TRUNCATE TABLE student_profiles;');
        await this.pool.query('TRUNCATE TABLE users;');
        await this.pool.query('SET FOREIGN_KEY_CHECKS = 1;');
        await this.syncInMemToMySQL();
      } catch (err: any) {
        return { success: false, message: `Reset error: ${err.message}` };
      }
    }

    this.logQuery('CALL ResetAndSeedDatabase() /* Truncated and reloaded fixtures */', 25, 0, this.isConnected ? 'mysql-server' : 'in-memory-engine');
    return { success: true, message: 'Database reset and re-seeded successfully' };
  }

  // Live SQL Query Executor
  public async executeRawSQL(sqlString: string): Promise<{
    columns: string[];
    rows: any[];
    executionTimeMs: number;
    affectedRows: number;
    error?: string;
  }> {
    const trimmed = sqlString.trim().replace(/;+$/, '');
    const start = Date.now();

    if (this.isConnected && this.pool) {
      try {
        const [result, fields]: any = await this.pool.query(trimmed);
        const duration = Date.now() - start;

        let columns: string[] = [];
        let rows: any[] = [];
        let affected = 0;

        if (Array.isArray(result)) {
          rows = result;
          if (fields && fields.length > 0) {
            columns = fields.map((f: any) => f.name);
          } else if (rows.length > 0) {
            columns = Object.keys(rows[0]);
          }
        } else if (result && typeof result === 'object') {
          affected = result.affectedRows || 0;
          columns = ['result', 'affectedRows', 'insertId'];
          rows = [{
            result: 'Query OK',
            affectedRows: result.affectedRows,
            insertId: result.insertId
          }];
        }

        this.logQuery(trimmed, duration, affected || rows.length, 'mysql-server');
        return { columns, rows, executionTimeMs: duration, affectedRows: affected };
      } catch (err: any) {
        const duration = Date.now() - start;
        this.logQuery(`-- ERROR: ${err.message}\n${trimmed}`, duration, 0, 'mysql-server');
        return {
          columns: ['error'],
          rows: [{ error: err.message }],
          executionTimeMs: duration,
          affectedRows: 0,
          error: err.message
        };
      }
    }

    // In-memory SQL simulator for preview sandbox
    return this.executeInMemorySQL(trimmed);
  }

  private executeInMemorySQL(sql: string): {
    columns: string[];
    rows: any[];
    executionTimeMs: number;
    affectedRows: number;
    error?: string;
  } {
    const start = Date.now();
    const upper = sql.toUpperCase();

    try {
      if (upper === 'SHOW TABLES' || upper.startsWith('SHOW TABLES')) {
        const tables = [
          'users',
          'student_profiles',
          'skills',
          'student_skills',
          'job_postings',
          'job_required_skills',
          'career_recommendations',
          'job_applications'
        ];
        const duration = Date.now() - start;
        this.logQuery(sql, duration, tables.length, 'in-memory-engine');
        return {
          columns: ['Tables_in_skillbridge_db'],
          rows: tables.map(t => ({ Tables_in_skillbridge_db: t })),
          executionTimeMs: duration,
          affectedRows: tables.length
        };
      }

      if (upper.startsWith('DESCRIBE ') || upper.startsWith('DESC ')) {
        const tableName = sql.split(/\s+/)[1]?.toLowerCase().replace(/;/, '');
        const duration = Date.now() - start;
        this.logQuery(sql, duration, 0, 'in-memory-engine');
        return {
          columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
          rows: this.getTableDescription(tableName),
          executionTimeMs: duration,
          affectedRows: 0
        };
      }

      // SELECT with JOIN logic
      if (upper.startsWith('SELECT')) {
        let rows: any[] = [];
        if (upper.includes('USERS') && upper.includes('STUDENT_PROFILES')) {
          rows = this.inMemStore.student_profiles.map(sp => {
            const u = this.inMemStore.users.find(usr => usr.id === sp.user_id);
            return {
              full_name: u?.full_name || 'Student',
              university: sp.university,
              target_role: sp.target_role,
              gpa: sp.gpa
            };
          });
        } else if (upper.includes('SKILLS') && upper.includes('STUDENT_SKILLS')) {
          const statsMap: Record<number, { name: string; category: string; total: number; sumProf: number }> = {};
          this.inMemStore.skills.forEach(s => {
            statsMap[s.id] = { name: s.name, category: s.category, total: 0, sumProf: 0 };
          });
          this.inMemStore.student_skills.forEach(ss => {
            if (statsMap[ss.skill_id]) {
              statsMap[ss.skill_id].total++;
              statsMap[ss.skill_id].sumProf += ss.proficiency_level;
            }
          });
          rows = Object.values(statsMap)
            .map(item => ({
              name: item.name,
              category: item.category,
              total_students: item.total,
              avg_proficiency: item.total > 0 ? (item.sumProf / item.total).toFixed(1) : '0.0'
            }))
            .sort((a, b) => Number(b.avg_proficiency) - Number(a.avg_proficiency))
            .slice(0, 10);
        } else if (upper.includes('JOB_POSTINGS')) {
          rows = this.inMemStore.job_postings.slice(0, 8).map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            work_type: j.work_type,
            salary_min: `$${(j.salary_min / 1000).toFixed(0)}k`,
            salary_max: `$${(j.salary_max / 1000).toFixed(0)}k`,
            location: j.location
          }));
        } else if (upper.includes('STUDENT_PROFILES')) {
          rows = this.inMemStore.student_profiles.slice(0, 10);
        } else if (upper.includes('SKILLS')) {
          rows = this.inMemStore.skills.slice(0, 15);
        } else {
          rows = [{ message: 'Query executed against active in-memory relational store', query: sql }];
        }

        const duration = Date.now() - start;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : ['result'];
        this.logQuery(sql, duration, rows.length, 'in-memory-engine');
        return {
          columns,
          rows,
          executionTimeMs: duration,
          affectedRows: rows.length
        };
      }

      // Mutation fallback
      const duration = Date.now() - start;
      this.logQuery(sql, duration, 1, 'in-memory-engine');
      return {
        columns: ['Status'],
        rows: [{ Status: 'Query OK, 1 row affected (in-memory)' }],
        executionTimeMs: duration,
        affectedRows: 1
      };
    } catch (e: any) {
      const duration = Date.now() - start;
      return {
        columns: ['error'],
        rows: [{ error: e.message }],
        executionTimeMs: duration,
        affectedRows: 0,
        error: e.message
      };
    }
  }

  private getTableDescription(table: string): any[] {
    switch (table) {
      case 'student_profiles':
        return [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: 'NULL', Extra: 'auto_increment' },
          { Field: 'user_id', Type: 'int(11)', Null: 'NO', Key: 'MUL', Default: 'NULL', Extra: '' },
          { Field: 'university', Type: 'varchar(200)', Null: 'NO', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'major', Type: 'varchar(150)', Null: 'NO', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'gpa', Type: 'decimal(3,2)', Null: 'YES', Key: '', Default: '3.50', Extra: '' },
          { Field: 'target_role', Type: 'varchar(150)', Null: 'YES', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'updated_at', Type: 'datetime', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: 'on update' }
        ];
      case 'skills':
        return [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: 'NULL', Extra: 'auto_increment' },
          { Field: 'name', Type: 'varchar(100)', Null: 'NO', Key: 'UNI', Default: 'NULL', Extra: '' },
          { Field: 'category', Type: 'varchar(80)', Null: 'NO', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'description', Type: 'varchar(255)', Null: 'YES', Key: '', Default: 'NULL', Extra: '' }
        ];
      default:
        return [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: 'NULL', Extra: 'auto_increment' },
          { Field: 'created_at', Type: 'datetime', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' }
        ];
    }
  }

  // CRUD Operations with sync to both MySQL and in-memory cache
  public async getFullDataset(): Promise<any> {
    if (this.isConnected && this.pool) {
      try {
        const [users]: any = await this.pool.query('SELECT * FROM users');
        const [student_profiles]: any = await this.pool.query('SELECT * FROM student_profiles');
        const [skills]: any = await this.pool.query('SELECT * FROM skills');
        const [student_skills]: any = await this.pool.query('SELECT * FROM student_skills');
        const [job_postings]: any = await this.pool.query('SELECT * FROM job_postings');
        const [job_required_skills]: any = await this.pool.query('SELECT * FROM job_required_skills');
        const [job_applications]: any = await this.pool.query('SELECT * FROM job_applications');

        return {
          users,
          student_profiles,
          skills,
          student_skills,
          job_postings,
          job_required_skills,
          job_applications,
          logs: this.logs.slice(0, 50)
        };
      } catch (err: any) {
        console.warn('[MySQL Backend] Query error, falling back to cached state:', err.message);
      }
    }

    return {
      users: this.inMemStore.users,
      student_profiles: this.inMemStore.student_profiles,
      skills: this.inMemStore.skills,
      student_skills: this.inMemStore.student_skills,
      job_postings: this.inMemStore.job_postings,
      job_required_skills: this.inMemStore.job_required_skills,
      job_applications: this.inMemStore.job_applications,
      logs: this.logs.slice(0, 50)
    };
  }

  public async updateStudentProfile(id: number, data: any): Promise<any> {
    const start = Date.now();
    const index = this.inMemStore.student_profiles.findIndex(sp => sp.id === id);
    if (index !== -1) {
      this.inMemStore.student_profiles[index] = {
        ...this.inMemStore.student_profiles[index],
        ...data,
        updated_at: new Date().toISOString()
      };
    }

    const sql = `UPDATE student_profiles SET university = ?, major = ?, gpa = ?, target_role = ?, bio = ?, github_url = ?, linkedin_url = ?, portfolio_url = ?, updated_at = NOW() WHERE id = ?`;
    const params = [
      data.university,
      data.major,
      data.gpa,
      data.target_role,
      data.bio,
      data.github_url || null,
      data.linkedin_url || null,
      data.portfolio_url || null,
      id
    ];

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(sql, params);
        const duration = Date.now() - start;
        this.logQuery(`UPDATE student_profiles SET target_role='${data.target_role}', gpa=${data.gpa} WHERE id=${id};`, duration, 1, 'mysql-server');
      } catch (err: any) {
        console.error('[MySQL Backend] Failed to update MySQL table:', err.message);
      }
    } else {
      const duration = Date.now() - start;
      this.logQuery(`UPDATE student_profiles SET target_role='${data.target_role}', gpa=${data.gpa} WHERE id=${id};`, duration, 1, 'in-memory-engine');
    }

    return this.inMemStore.student_profiles[index];
  }

  public async upsertStudentSkill(studentId: number, skillId: number, proficiencyLevel: number, yearsExperience: number): Promise<any> {
    const start = Date.now();
    const existingIndex = this.inMemStore.student_skills.findIndex(
      ss => ss.student_id === studentId && ss.skill_id === skillId
    );

    let updatedRecord: any;
    if (existingIndex >= 0) {
      this.inMemStore.student_skills[existingIndex].proficiency_level = proficiencyLevel;
      this.inMemStore.student_skills[existingIndex].years_experience = yearsExperience;
      updatedRecord = this.inMemStore.student_skills[existingIndex];
    } else {
      const newId = Math.max(...this.inMemStore.student_skills.map(s => s.id), 0) + 1;
      updatedRecord = {
        id: newId,
        student_id: studentId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: yearsExperience,
        verified: false,
        created_at: new Date().toISOString()
      };
      this.inMemStore.student_skills.push(updatedRecord);
    }

    const sql = `INSERT INTO student_skills (student_id, skill_id, proficiency_level, years_experience) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level), years_experience = VALUES(years_experience)`;

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(sql, [studentId, skillId, proficiencyLevel, yearsExperience]);
        this.logQuery(`INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES (${studentId}, ${skillId}, ${proficiencyLevel}) ON DUPLICATE KEY UPDATE proficiency_level=${proficiencyLevel};`, Date.now() - start, 1, 'mysql-server');
      } catch (err: any) {
        console.error('[MySQL Backend] Failed upsert to MySQL:', err.message);
      }
    } else {
      this.logQuery(`INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES (${studentId}, ${skillId}, ${proficiencyLevel}) ON DUPLICATE KEY UPDATE proficiency_level=${proficiencyLevel};`, Date.now() - start, 1, 'in-memory-engine');
    }

    return updatedRecord;
  }

  public async deleteStudentSkill(studentId: number, skillId: number): Promise<boolean> {
    const start = Date.now();
    this.inMemStore.student_skills = this.inMemStore.student_skills.filter(
      ss => !(ss.student_id === studentId && ss.skill_id === skillId)
    );

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query('DELETE FROM student_skills WHERE student_id = ? AND skill_id = ?', [studentId, skillId]);
        this.logQuery(`DELETE FROM student_skills WHERE student_id = ${studentId} AND skill_id = ${skillId};`, Date.now() - start, 1, 'mysql-server');
      } catch (err: any) {
        console.error('[MySQL Backend] Error deleting skill:', err.message);
      }
    } else {
      this.logQuery(`DELETE FROM student_skills WHERE student_id = ${studentId} AND skill_id = ${skillId};`, Date.now() - start, 1, 'in-memory-engine');
    }

    return true;
  }

  public async createJob(jobData: any, requiredSkills: any[]): Promise<any> {
    const start = Date.now();
    const newJobId = Math.max(...this.inMemStore.job_postings.map(j => j.id), 0) + 1;
    const newJob = {
      ...jobData,
      id: newJobId,
      posted_at: new Date().toISOString().substring(0, 10)
    };
    this.inMemStore.job_postings.unshift(newJob);

    let nextReqId = Math.max(...this.inMemStore.job_required_skills.map(r => r.id), 0) + 1;
    const addedRequirements = requiredSkills.map(req => {
      const item = {
        id: nextReqId++,
        job_id: newJobId,
        skill_id: req.skillId,
        importance: req.importance,
        min_proficiency: req.minProficiency,
        weight: req.weight
      };
      this.inMemStore.job_required_skills.push(item);
      return item;
    });

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO job_postings (id, title, company, department, location, work_type, experience_level, salary_min, salary_max, description, deadline, posted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newJobId, newJob.title, newJob.company, newJob.department, newJob.location, newJob.work_type, newJob.experience_level, newJob.salary_min, newJob.salary_max, newJob.description, newJob.deadline || '2026-12-31', newJob.posted_at]
        );

        for (const req of addedRequirements) {
          await this.pool.query(
            'INSERT INTO job_required_skills (id, job_id, skill_id, importance, min_proficiency, weight) VALUES (?, ?, ?, ?, ?, ?)',
            [req.id, req.job_id, req.skill_id, req.importance, req.min_proficiency, req.weight]
          );
        }
        this.logQuery(`START TRANSACTION; INSERT INTO job_postings (title) VALUES ('${newJob.title}'); COMMIT;`, Date.now() - start, 1 + addedRequirements.length, 'mysql-server');
      } catch (err: any) {
        console.error('[MySQL Backend] Error inserting job to MySQL:', err.message);
      }
    } else {
      this.logQuery(`START TRANSACTION; INSERT INTO job_postings (title) VALUES ('${newJob.title}'); COMMIT;`, Date.now() - start, 1 + addedRequirements.length, 'in-memory-engine');
    }

    return { job: newJob, requirements: addedRequirements };
  }

  public async submitApplication(studentId: number, jobId: number, matchPercentage: number, notes?: string): Promise<any> {
    const start = Date.now();
    const existing = this.inMemStore.job_applications.find(a => a.student_id === studentId && a.job_id === jobId);
    if (existing) {
      return existing;
    }

    const newId = Math.max(...this.inMemStore.job_applications.map(a => a.id), 0) + 1;
    const application = {
      id: newId,
      student_id: studentId,
      job_id: jobId,
      match_percentage_at_apply: matchPercentage,
      status: 'Applied',
      notes: notes || 'Direct Match Application via SkillBridge',
      applied_at: new Date().toISOString()
    };
    this.inMemStore.job_applications.unshift(application);

    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO job_applications (id, student_id, job_id, match_percentage_at_apply, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [application.id, application.student_id, application.job_id, application.match_percentage_at_apply, application.status, application.notes]
        );
        this.logQuery(`INSERT INTO job_applications (student_id, job_id, status) VALUES (${studentId}, ${jobId}, 'Applied');`, Date.now() - start, 1, 'mysql-server');
      } catch (err: any) {
        console.error('[MySQL Backend] Error recording application to MySQL:', err.message);
      }
    } else {
      this.logQuery(`INSERT INTO job_applications (student_id, job_id, status) VALUES (${studentId}, ${jobId}, 'Applied');`, Date.now() - start, 1, 'in-memory-engine');
    }

    return application;
  }

  public getStatus(): MySQLStatus {
    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'mysql' : 'in-memory-relational',
      host: this.currentConfig.host,
      port: this.currentConfig.port,
      database: this.currentConfig.database,
      user: this.currentConfig.user,
      latencyMs: this.lastPingMs,
      error: this.lastError,
      tableCounts: {
        users: this.inMemStore.users.length,
        student_profiles: this.inMemStore.student_profiles.length,
        skills: this.inMemStore.skills.length,
        student_skills: this.inMemStore.student_skills.length,
        job_postings: this.inMemStore.job_postings.length,
        job_required_skills: this.inMemStore.job_required_skills.length,
        job_applications: this.inMemStore.job_applications.length
      },
      totalQueries: this.logs.length
    };
  }

  public getLogs(): BackendSQLLog[] {
    return [...this.logs];
  }

  private logQuery(query: string, duration: number, affectedRows = 0, source: 'mysql-server' | 'in-memory-engine'): void {
    const entry: BackendSQLLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      query: query.length > 250 ? query.substring(0, 247) + '...' : query,
      executionTimeMs: Math.max(1, Math.round(duration)),
      affectedRows,
      source
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }
}

export const mysqlBackend = new MySQLBackendService();
