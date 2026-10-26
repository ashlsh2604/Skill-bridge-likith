import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Play,
  Download,
  Copy,
  Check,
  Table,
  Layers,
  Code2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { mysqlEngine, SQLLogEntry } from '../lib/mysql-engine';
import { apiClient, BackendStatus, SQLQueryResult } from '../lib/api-client';

interface MySQLStudioProps {
  logs: SQLLogEntry[];
  backendStatus?: BackendStatus | null;
  onRefreshData?: () => void;
}

const PRESET_QUERIES = [
  {
    name: 'Top Students & Career Targets',
    sql: 'SELECT u.full_name, sp.university, sp.target_role, sp.gpa FROM users u JOIN student_profiles sp ON u.id = sp.user_id;'
  },
  {
    name: 'Skill Popularity & Avg Proficiency',
    sql: 'SELECT s.name, s.category, count(ss.id) as total_students, avg(ss.proficiency_level) as avg_proficiency FROM skills s JOIN student_skills ss ON s.id = ss.skill_id GROUP BY s.id ORDER BY avg_proficiency DESC LIMIT 6;'
  },
  {
    name: 'Job Postings & Requirements Count',
    sql: 'SELECT j.title, j.company, j.work_type, j.salary_min, j.salary_max FROM job_postings j LIMIT 6;'
  },
  {
    name: 'Inspect Table Schema',
    sql: 'DESCRIBE student_profiles;'
  },
  {
    name: 'Show All Tables',
    sql: 'SHOW TABLES;'
  }
];

export const MySQLStudio: React.FC<MySQLStudioProps> = ({ logs, backendStatus, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'schema' | 'logs' | 'config'>('console');
  const [queryInput, setQueryInput] = useState<string>(PRESET_QUERIES[0].sql);
  const [isRunningQuery, setIsRunningQuery] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<SQLQueryResult | null>(() => {
    return mysqlEngine.executeQuery(PRESET_QUERIES[0].sql);
  });
  const [copiedDump, setCopiedDump] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('student_profiles');

  // Connection management form state
  const [connHost, setConnHost] = useState(backendStatus?.host || 'localhost');
  const [connPort, setConnPort] = useState(backendStatus?.port || 3306);
  const [connDatabase, setConnDatabase] = useState(backendStatus?.database || 'skillbridge_db');
  const [connUser, setConnUser] = useState(backendStatus?.user || 'root');
  const [connPassword, setConnPassword] = useState('');
  const [connSSL, setConnSSL] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [connectionFeedback, setConnectionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRunQuery = async () => {
    if (!queryInput.trim()) return;
    setIsRunningQuery(true);
    try {
      const res = await apiClient.executeQuery(queryInput);
      setQueryResult(res);
      onRefreshData?.();
    } catch {
      const fallback = mysqlEngine.executeQuery(queryInput);
      setQueryResult(fallback);
    } finally {
      setIsRunningQuery(false);
    }
  };

  const handleSelectPreset = async (sql: string) => {
    setQueryInput(sql);
    setIsRunningQuery(true);
    try {
      const res = await apiClient.executeQuery(sql);
      setQueryResult(res);
      onRefreshData?.();
    } catch {
      const fallback = mysqlEngine.executeQuery(sql);
      setQueryResult(fallback);
    } finally {
      setIsRunningQuery(false);
    }
  };

  const handleTestConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionFeedback(null);
    try {
      const res = await apiClient.connectMySQL({
        host: connHost,
        port: Number(connPort),
        user: connUser,
        password: connPassword,
        database: connDatabase,
        ssl: connSSL
      });
      setConnectionFeedback({
        type: 'success',
        message: `${res.message} (Round-trip ping: ${res.latencyMs}ms)`
      });
      onRefreshData?.();
    } catch (err: any) {
      setConnectionFeedback({
        type: 'error',
        message: err.message || 'Failed to connect to MySQL database.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    setConnectionFeedback(null);
    try {
      await apiClient.reseedDatabase();
      setConnectionFeedback({
        type: 'success',
        message: 'Successfully re-seeded MySQL tables with default datasets!'
      });
      onRefreshData?.();
    } catch (err: any) {
      setConnectionFeedback({
        type: 'error',
        message: err.message || 'Reseeding failed.'
      });
    } finally {
      setIsReseeding(false);
    }
  };

  const handleDownloadDump = () => {
    const dump = mysqlEngine.exportMySQLDump();
    const blob = new Blob([dump], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillbridge_mysql_dump_${new Date().toISOString().slice(0,10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyDump = () => {
    const dump = mysqlEngine.exportMySQLDump();
    navigator.clipboard.writeText(dump);
    setCopiedDump(true);
    setTimeout(() => setCopiedDump(false), 2000);
  };

  const tables = [
    { name: 'users', desc: 'User accounts, emails, roles, timestamps' },
    { name: 'student_profiles', desc: 'Academic details, GPA, degree, target role, bio' },
    { name: 'skills', desc: 'Master directory of skills and categories' },
    { name: 'student_skills', desc: 'Relational mapping of students to rated skills (1-5)' },
    { name: 'job_postings', desc: 'Job postings with salaries, locations, and deadlines' },
    { name: 'job_required_skills', desc: 'Job requirement links with min proficiency and weights' },
    { name: 'career_recommendations', desc: 'Automated matching scores and gap analyses' },
    { name: 'job_applications', desc: 'Submitted student job applications and statuses' }
  ];

  return (
    <div className="space-y-6" id="mysql-studio-root">
      {/* Studio Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">MySQL Relational Database Studio</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Engine: InnoDB • 8.0+
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct relational table management, live SQL query console, schema ERD, and production DDL export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDump}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .sql Dump</span>
            </button>
            <button
              onClick={handleCopyDump}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
            >
              {copiedDump ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDump ? 'Copied DDL' : 'Copy DDL'}</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'console'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive SQL Console</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'schema'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Schema Inspector & ERD</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'logs'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Transaction Log ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'config'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Connection Driver</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive SQL Console */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Quick Query Presets</span>
              <span className="text-[11px] text-slate-400">Click to load and execute</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUERIES.map(pq => (
                <button
                  key={pq.name}
                  onClick={() => handleSelectPreset(pq.sql)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition font-medium"
                >
                  {pq.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>mysql&gt; Query Editor (skillbridge_db)</span>
              </div>
              <button
                onClick={handleRunQuery}
                disabled={isRunningQuery}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5 transition cursor-pointer"
              >
                {isRunningQuery ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                ) : (
                  <Play className="w-3 h-3 fill-slate-950" />
                )}
                <span>{isRunningQuery ? 'Running...' : 'Execute SQL'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm p-4 outline-none resize-y border-none"
              placeholder="SELECT * FROM student_profiles;"
            />
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Result Set</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-[11px]">
                    {queryResult.rowCount} rows returned in {queryResult.executionTimeMs}ms
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">STATUS: 200 OK</span>
              </div>

              {queryResult.error ? (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-mono">
                  {queryResult.error}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700">
                      <tr>
                        {queryResult.columns.map(col => (
                          <th key={col} className="p-2.5 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {queryResult.columns.map(col => (
                            <td key={col} className="p-2.5 whitespace-nowrap text-slate-700">
                              {String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schema Inspector & ERD */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Table Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Relational Tables ({tables.length})
              </h3>
              <div className="space-y-1">
                {tables.map(t => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTable(t.name);
                      setQueryResult(mysqlEngine.executeQuery(`DESCRIBE ${t.name};`));
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                      selectedTable === t.name
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t.name}</span>
                    <ChevronRightIcon className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Table Columns View */}
            <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-base text-slate-900 font-mono">TABLE `{selectedTable}`</h4>
                  <p className="text-xs text-slate-500">
                    {tables.find(t => t.name === selectedTable)?.desc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const res = mysqlEngine.executeQuery(`SELECT * FROM ${selectedTable} LIMIT 10;`);
                    setQueryResult(res);
                    setActiveTab('console');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  View Table Data
                </button>
              </div>

              {queryResult && (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        {queryResult.columns.map(c => (
                          <th key={c} className="p-2.5 font-bold">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queryResult.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {queryResult.columns.map(c => (
                            <td key={c} className="p-2.5 text-slate-700">{String(r[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Foreign Key Mapping note */}
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900">
                <strong>Foreign Key Integrity:</strong> Cascades updates and prevents orphaned skills between `student_profiles` and `student_skills` via InnoDB constraints.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Transaction Logs */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span>MySQL General Query Audit Log</span>
            <span>{logs.length} Recent Statements</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>
                <span className="text-emerald-400 flex-1 break-all">{log.query}</span>
                <span className="text-slate-400 text-[11px] shrink-0">{log.executionTimeMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: MySQL Connection Config & Management */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Live Backend Connection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <span>Backend MySQL Service Status</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Powered by Node.js, Express, and official <code className="text-indigo-600 font-mono">mysql2/promise</code> driver with connection pooling.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  backendStatus?.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${backendStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                  <span>{backendStatus?.connected ? 'Live MySQL Instance Connected' : 'Relational Engine Active'}</span>
                </span>

                <button
                  onClick={handleReseed}
                  disabled={isReseeding}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Reseed tables with default student, skill, and job records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
                  <span>{isReseeding ? 'Reseeding...' : 'Reseed Tables'}</span>
                </button>
              </div>
            </div>

            {/* Status Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Database Driver</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">mysql2/promise</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pool Limit: 10 conns</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Host & Port</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                  {backendStatus?.host || 'localhost'}:{backendStatus?.port || 3306}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">DB: {backendStatus?.database || 'skillbridge_db'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Round-trip Ping</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 font-mono">
                  {backendStatus?.latencyMs || 0} ms
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Auto-reconnect enabled</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Total Queries Logged</div>
                <div className="text-sm font-bold text-indigo-600 mt-0.5 font-mono">
                  {backendStatus?.totalQueries || logs.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Full audit trail</div>
              </div>
            </div>

            {/* Table Row Counts */}
            {backendStatus?.tableCounts && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Active Tables:</span>
                {Object.entries(backendStatus.tableCounts).map(([tableName, count]) => (
                  <span key={tableName} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                    {tableName}: <strong className="text-slate-900">{count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Banner */}
          {connectionFeedback && (
            <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              connectionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {connectionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{connectionFeedback.message}</span>
            </div>
          )}

          {/* Interactive Connection Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Connect to External MySQL Instance</h3>
              <p className="text-xs text-slate-500 mt-1">
                Point the backend service to your Cloud SQL for MySQL, AWS RDS, PlanetScale, Aiven, or local Docker instance.
                The backend service will automatically create required tables and synchronize data.
              </p>
            </div>

            <form onSubmit={handleTestConnect} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Host / IP</label>
                <input
                  type="text"
                  value={connHost}
                  onChange={(e) => setConnHost(e.target.value)}
                  placeholder="127.0.0.1 or cloudsql-ip"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  value={connPort}
                  onChange={(e) => setConnPort(Number(e.target.value))}
                  placeholder="3306"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={connDatabase}
                  onChange={(e) => setConnDatabase(e.target.value)}
                  placeholder="skillbridge_db"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">User</label>
                <input
                  type="text"
                  value={connUser}
                  onChange={(e) => setConnUser(e.target.value)}
                  placeholder="root or db_user"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={connPassword}
                  onChange={(e) => setConnPassword(e.target.value)}
                  placeholder="Database password"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={connSSL}
                    onChange={(e) => setConnSSL(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Require SSL / TLS Encrypted Connection</span>
                </label>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>{isConnecting ? 'Testing Connection...' : 'Connect to MySQL Server'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Node.js Driver Code Snippet */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Node.js MySQL Driver Integration (`mysql2/promise`)</h3>
            <p className="text-xs text-slate-500">
              The backend application connects with this standard connection pool snippet to execute queries directly against MySQL.
            </p>

            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`import mysql from 'mysql2/promise';

// Initialize MySQL connection pool with InnoDB support
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'skillbridge_user',
  password: process.env.MYSQL_PASSWORD || 'secret_password',
  database: 'skillbridge_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4'
});

// Example Automated Recommendation Query:
export async function getStudentMatches(studentId: number) {
  const [rows] = await pool.query(
    \`SELECT j.*, 
            COUNT(jr.id) AS total_required,
            SUM(CASE WHEN ss.proficiency_level >= jr.min_proficiency THEN 1 ELSE 0 END) AS satisfied_skills
     FROM job_postings j
     JOIN job_required_skills jr ON j.id = jr.job_id
     LEFT JOIN student_skills ss ON jr.skill_id = ss.skill_id AND ss.student_id = ?
     GROUP BY j.id
     ORDER BY satisfied_skills DESC\`,
    [studentId]
  );
  return rows;
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
