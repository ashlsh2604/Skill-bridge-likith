import {
  UserRecord,
  StudentProfileRecord,
  SkillRecord,
  StudentSkillRecord,
  JobPostingRecord,
  JobRequiredSkillRecord,
  JobApplicationRecord
} from '../types/mysql-schema';

export const INITIAL_SKILLS: SkillRecord[] = [
  // Languages
  { id: 1, name: 'JavaScript', category: 'Languages', description: 'Core ECMAScript for modern browser and Node.js runtimes' },
  { id: 2, name: 'TypeScript', category: 'Languages', description: 'Statically typed superset of JavaScript for scalable codebases' },
  { id: 3, name: 'Python', category: 'Languages', description: 'Versatile language for backend, automation, and AI/ML' },
  { id: 4, name: 'Java', category: 'Languages', description: 'Enterprise object-oriented programming for large distributed systems' },
  { id: 5, name: 'Go (Golang)', category: 'Languages', description: 'High-performance concurrent language for backend microservices' },
  { id: 6, name: 'SQL', category: 'Languages', description: 'Declarative query language for relational database management' },
  { id: 7, name: 'C++', category: 'Languages', description: 'Systems programming with low-level memory control' },

  // Frontend
  { id: 8, name: 'React', category: 'Frontend', description: 'Component-based UI library for single-page applications' },
  { id: 9, name: 'Tailwind CSS', category: 'Frontend', description: 'Utility-first CSS framework for rapid UI styling' },
  { id: 10, name: 'Next.js', category: 'Frontend', description: 'Full-stack React framework with SSR, ISR, and API routes' },
  { id: 11, name: 'Vue.js', category: 'Frontend', description: 'Progressive JavaScript framework for user interfaces' },
  { id: 12, name: 'HTML5 & Semantic Web', category: 'Frontend', description: 'Accessible markup and modern web standards' },

  // Backend & APIs
  { id: 13, name: 'Node.js', category: 'Backend & APIs', description: 'Asynchronous event-driven JavaScript runtime' },
  { id: 14, name: 'Express.js', category: 'Backend & APIs', description: 'Fast, minimalist web framework for Node.js' },
  { id: 15, name: 'REST API Design', category: 'Backend & APIs', description: 'Architectural style for distributed hypermedia systems' },
  { id: 16, name: 'GraphQL', category: 'Backend & APIs', description: 'Query language and runtime for structured APIs' },
  { id: 17, name: 'FastAPI', category: 'Backend & APIs', description: 'Modern, high-performance web framework for Python' },
  { id: 18, name: 'Microservices', category: 'Backend & APIs', description: 'Decoupled architectural pattern for independent deployment' },

  // Database & Storage
  { id: 19, name: 'MySQL', category: 'Database & Storage', description: 'Industry-standard open-source relational database management system' },
  { id: 20, name: 'PostgreSQL', category: 'Database & Storage', description: 'Advanced open-source relational and object database' },
  { id: 21, name: 'MongoDB', category: 'Database & Storage', description: 'Document-oriented NoSQL database for flexible schemas' },
  { id: 22, name: 'Redis', category: 'Database & Storage', description: 'In-memory data structure store used as a cache and message broker' },

  // Cloud & DevOps
  { id: 23, name: 'Docker', category: 'Cloud & DevOps', description: 'Containerization platform to package apps with dependencies' },
  { id: 24, name: 'Kubernetes', category: 'Cloud & DevOps', description: 'Automated container orchestration and scaling system' },
  { id: 25, name: 'AWS Cloud Services', category: 'Cloud & DevOps', description: 'Amazon Web Services (EC2, S3, RDS, Lambda)' },
  { id: 26, name: 'Google Cloud Platform (GCP)', category: 'Cloud & DevOps', description: 'Google Cloud Run, Firestore, BigQuery, and IAM' },
  { id: 27, name: 'CI/CD Pipelines (GitHub Actions)', category: 'Cloud & DevOps', description: 'Automated testing, building, and deployment workflows' },
  { id: 28, name: 'Terraform', category: 'Cloud & DevOps', description: 'Infrastructure as Code (IaC) tool for multi-cloud' },

  // Data Science & AI
  { id: 29, name: 'Pandas & NumPy', category: 'Data Science & AI', description: 'Python libraries for data manipulation and numerical computation' },
  { id: 30, name: 'PyTorch', category: 'Data Science & AI', description: 'Deep learning framework for neural networks and tensor computation' },
  { id: 31, name: 'Machine Learning Fundamentals', category: 'Data Science & AI', description: 'Supervised, unsupervised algorithms, cross-validation, and metrics' },
  { id: 32, name: 'Large Language Models (LLMs)', category: 'Data Science & AI', description: 'Prompt engineering, embeddings, and generative AI APIs' },
  { id: 33, name: 'Data Visualization (D3 / PowerBI)', category: 'Data Science & AI', description: 'Transforming complex datasets into visual dashboards' },

  // Cybersecurity
  { id: 34, name: 'OWASP Security Best Practices', category: 'Cybersecurity', description: 'Mitigating vulnerabilities like XSS, SQLi, and CSRF' },
  { id: 35, name: 'Authentication & JWT / OAuth', category: 'Cybersecurity', description: 'Secure identity delegation, token management, and RBAC' },
  { id: 36, name: 'Network Security', category: 'Cybersecurity', description: 'Protocols, firewalls, TLS/SSL, and encrypted communication' },

  // Tools & Methodologies
  { id: 37, name: 'Git & GitHub', category: 'Tools & Methodologies', description: 'Distributed version control, branching strategies, and PR workflows' },
  { id: 38, name: 'Unit & Integration Testing (Jest/Vitest)', category: 'Tools & Methodologies', description: 'Automated test-driven development and code coverage' },
  { id: 39, name: 'Agile & Scrum', category: 'Tools & Methodologies', description: 'Iterative sprint-based software development methodology' },

  // Soft Skills
  { id: 40, name: 'Technical Communication', category: 'Soft Skills', description: 'Explaining complex architectural decisions to non-technical stakeholders' },
  { id: 41, name: 'Cross-Functional Collaboration', category: 'Soft Skills', description: 'Working effectively with designers, product managers, and QA' }
];

export const INITIAL_USERS: UserRecord[] = [
  {
    id: 1,
    email: 'alex.rivera@university.edu',
    full_name: 'Alex Rivera',
    role: 'student',
    created_at: '2026-01-15 09:30:00'
  },
  {
    id: 2,
    email: 'sarah.chen@university.edu',
    full_name: 'Sarah Chen',
    role: 'student',
    created_at: '2026-01-18 11:20:00'
  },
  {
    id: 3,
    email: 'marcus.vance@university.edu',
    full_name: 'Marcus Vance',
    role: 'student',
    created_at: '2026-02-01 14:15:00'
  }
];

export const INITIAL_STUDENT_PROFILES: StudentProfileRecord[] = [
  {
    id: 1,
    user_id: 1,
    university: 'Stanford University / Berkeley Tech Alliance',
    major: 'Computer Science',
    degree: 'B.S. in Computer Science',
    graduation_year: 2026,
    gpa: 3.84,
    bio: 'Passionate full-stack software engineer with a focus on modern TypeScript, React, and scalable Node.js backend systems. Seeking new graduate or senior intern roles.',
    target_role: 'Full Stack Software Engineer',
    github_url: 'https://github.com/alexrivera-dev',
    linkedin_url: 'https://linkedin.com/in/alex-rivera-cs',
    portfolio_url: 'https://alexrivera.io',
    updated_at: '2026-09-10 18:24:00'
  },
  {
    id: 2,
    user_id: 2,
    university: 'Carnegie Mellon University',
    major: 'Data Science & Machine Learning',
    degree: 'B.S. in Applied Statistics & AI',
    graduation_year: 2026,
    gpa: 3.92,
    bio: 'Data scientist & ML researcher enthusiastic about generative models, predictive analytics, and Python pipeline engineering. Experienced in PyTorch and big data pipelines.',
    target_role: 'Machine Learning Engineer / Data Scientist',
    github_url: 'https://github.com/sarahchen-data',
    linkedin_url: 'https://linkedin.com/in/sarah-chen-ml',
    portfolio_url: 'https://sarahchen.ai',
    updated_at: '2026-09-08 14:00:00'
  },
  {
    id: 3,
    user_id: 3,
    university: 'Georgia Institute of Technology',
    major: 'Computer Engineering',
    degree: 'B.S. in Computer Engineering & Cloud Systems',
    graduation_year: 2027,
    gpa: 3.76,
    bio: 'Systems enthusiast with deep interest in Kubernetes, distributed cloud infrastructure, Terraform, and high-throughput Go backend services.',
    target_role: 'Cloud Infrastructure / DevOps Engineer',
    github_url: 'https://github.com/marcusvance-ops',
    linkedin_url: 'https://linkedin.com/in/marcus-vance-cloud',
    portfolio_url: 'https://marcusvance.net',
    updated_at: '2026-09-05 10:30:00'
  }
];

export const INITIAL_STUDENT_SKILLS: StudentSkillRecord[] = [
  // Alex Rivera (Student 1) - Strong Full Stack
  { id: 1, student_id: 1, skill_id: 1, proficiency_level: 5, years_experience: 3.5, verified: true, created_at: '2026-01-16' }, // JavaScript
  { id: 2, student_id: 1, skill_id: 2, proficiency_level: 5, years_experience: 3.0, verified: true, created_at: '2026-01-16' }, // TypeScript
  { id: 3, student_id: 1, skill_id: 8, proficiency_level: 5, years_experience: 3.0, verified: true, created_at: '2026-01-16' }, // React
  { id: 4, student_id: 1, skill_id: 9, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-16' }, // Tailwind CSS
  { id: 5, student_id: 1, skill_id: 10, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-01-16' }, // Next.js
  { id: 6, student_id: 1, skill_id: 13, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-16' }, // Node.js
  { id: 7, student_id: 1, skill_id: 14, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-01-16' }, // Express.js
  { id: 8, student_id: 1, skill_id: 15, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-16' }, // REST APIs
  { id: 9, student_id: 1, skill_id: 19, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-01-16' }, // MySQL
  { id: 10, student_id: 1, skill_id: 6, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-16' }, // SQL
  { id: 11, student_id: 1, skill_id: 37, proficiency_level: 5, years_experience: 3.5, verified: true, created_at: '2026-01-16' }, // Git & GitHub
  { id: 12, student_id: 1, skill_id: 38, proficiency_level: 3, years_experience: 1.5, verified: false, created_at: '2026-02-10' }, // Testing
  { id: 13, student_id: 1, skill_id: 23, proficiency_level: 2, years_experience: 1.0, verified: false, created_at: '2026-03-01' }, // Docker (Beginner/Gap)
  { id: 14, student_id: 1, skill_id: 40, proficiency_level: 4, years_experience: 3.0, verified: true, created_at: '2026-01-16' }, // Technical Communication

  // Sarah Chen (Student 2) - Data Science & AI
  { id: 15, student_id: 2, skill_id: 3, proficiency_level: 5, years_experience: 4.0, verified: true, created_at: '2026-01-19' }, // Python
  { id: 16, student_id: 2, skill_id: 6, proficiency_level: 5, years_experience: 3.5, verified: true, created_at: '2026-01-19' }, // SQL
  { id: 17, student_id: 2, skill_id: 19, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-19' }, // MySQL
  { id: 18, student_id: 2, skill_id: 29, proficiency_level: 5, years_experience: 3.5, verified: true, created_at: '2026-01-19' }, // Pandas & NumPy
  { id: 19, student_id: 2, skill_id: 30, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-19' }, // PyTorch
  { id: 20, student_id: 2, skill_id: 31, proficiency_level: 5, years_experience: 3.0, verified: true, created_at: '2026-01-19' }, // ML Fundamentals
  { id: 21, student_id: 2, skill_id: 32, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-01' }, // LLMs
  { id: 22, student_id: 2, skill_id: 33, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-01-19' }, // Data Viz
  { id: 23, student_id: 2, skill_id: 17, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-15' }, // FastAPI
  { id: 24, student_id: 2, skill_id: 37, proficiency_level: 4, years_experience: 3.0, verified: true, created_at: '2026-01-19' }, // Git

  // Marcus Vance (Student 3) - Cloud & Systems
  { id: 25, student_id: 3, skill_id: 5, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-02' }, // Go
  { id: 26, student_id: 3, skill_id: 3, proficiency_level: 4, years_experience: 2.5, verified: true, created_at: '2026-02-02' }, // Python
  { id: 27, student_id: 3, skill_id: 23, proficiency_level: 5, years_experience: 3.0, verified: true, created_at: '2026-02-02' }, // Docker
  { id: 28, student_id: 3, skill_id: 24, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-02' }, // Kubernetes
  { id: 29, student_id: 3, skill_id: 25, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-02' }, // AWS
  { id: 30, student_id: 3, skill_id: 27, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-02' }, // CI/CD
  { id: 31, student_id: 3, skill_id: 28, proficiency_level: 3, years_experience: 1.5, verified: false, created_at: '2026-02-15' }, // Terraform
  { id: 32, student_id: 3, skill_id: 36, proficiency_level: 4, years_experience: 2.0, verified: true, created_at: '2026-02-02' } // Network Security
];

export const INITIAL_JOB_POSTINGS: JobPostingRecord[] = [
  {
    id: 1,
    title: 'Junior Full-Stack Engineer',
    company: 'Stripe Ecosystem Partners',
    department: 'Core Product Engineering',
    location: 'San Francisco, CA (or Remote)',
    work_type: 'Remote',
    experience_level: 'Entry Level',
    salary_min: 115000,
    salary_max: 140000,
    description: 'Build responsive web interfaces and secure backend API endpoints. Collaborate with product design to deliver high-performance financial merchant tools.',
    deadline: '2026-10-31',
    posted_at: '2026-09-01 10:00:00',
    logo_bg: '#635BFF'
  },
  {
    id: 2,
    title: 'Frontend React Developer',
    company: 'Vercel Labs',
    department: 'Developer Experience',
    location: 'New York, NY (Hybrid)',
    work_type: 'Hybrid',
    experience_level: 'Entry Level',
    salary_min: 120000,
    salary_max: 145000,
    description: 'Craft cutting-edge client experiences using Next.js, React Server Components, and Tailwind CSS. Focus on web performance, accessibility, and micro-interactions.',
    deadline: '2026-11-15',
    posted_at: '2026-09-03 14:30:00',
    logo_bg: '#000000'
  },
  {
    id: 3,
    title: 'Associate Machine Learning Engineer',
    company: 'OpenHealth AI',
    department: 'Clinical Intelligence',
    location: 'Boston, MA (Hybrid)',
    work_type: 'Hybrid',
    experience_level: 'Entry Level',
    salary_min: 130000,
    salary_max: 155000,
    description: 'Fine-tune large language models and build high-throughput inference microservices in Python and PyTorch for clinical research insights.',
    deadline: '2026-10-25',
    posted_at: '2026-09-05 09:00:00',
    logo_bg: '#0EA5E9'
  },
  {
    id: 4,
    title: 'Cloud Infrastructure & DevOps Intern',
    company: 'Datadog Platforms',
    department: 'Site Reliability Engineering',
    location: 'Seattle, WA (On-site)',
    work_type: 'On-site',
    experience_level: 'Internship',
    salary_min: 85000,
    salary_max: 105000,
    description: 'Maintain production Kubernetes clusters, build automated CI/CD deployment pipelines, and optimize container resource utilization across AWS and GCP.',
    deadline: '2026-11-01',
    posted_at: '2026-09-06 16:00:00',
    logo_bg: '#7C3AED'
  },
  {
    id: 5,
    title: 'Backend Database & API Engineer',
    company: 'Shopify Core Services',
    department: 'Merchant Platform',
    location: 'Remote, US/Canada',
    work_type: 'Remote',
    experience_level: 'Entry Level',
    salary_min: 125000,
    salary_max: 150000,
    description: 'Design robust MySQL schema architectures, high-performance REST/GraphQL APIs, and asynchronous Redis caching layers processing millions of daily transactions.',
    deadline: '2026-10-20',
    posted_at: '2026-09-02 11:45:00',
    logo_bg: '#10B981'
  },
  {
    id: 6,
    title: 'Data Analyst & Insights Intern',
    company: 'Spotify Media Lab',
    department: 'Content Analytics',
    location: 'New York, NY (Hybrid)',
    work_type: 'Hybrid',
    experience_level: 'Internship',
    salary_min: 75000,
    salary_max: 95000,
    description: 'Leverage SQL and Python Pandas to extract actionable behavioral metrics from audio streaming datasets. Create dynamic executive dashboards.',
    deadline: '2026-11-10',
    posted_at: '2026-09-07 13:10:00',
    logo_bg: '#1DB954'
  },
  {
    id: 7,
    title: 'Application Security Engineer',
    company: 'CrowdStrike Intelligence',
    department: 'Cloud Defense',
    location: 'Austin, TX (Remote)',
    work_type: 'Remote',
    experience_level: 'Entry Level',
    salary_min: 128000,
    salary_max: 155000,
    description: 'Audit codebases for OWASP vulnerabilities, implement OAuth2/JWT security gateways, and automate vulnerability scanning across container pipelines.',
    deadline: '2026-10-28',
    posted_at: '2026-09-04 15:20:00',
    logo_bg: '#EF4444'
  },
  {
    id: 8,
    title: 'Junior Go Backend Systems Engineer',
    company: 'Cloudflare Edge Networks',
    department: 'Distributed Systems',
    location: 'San Francisco, CA (Hybrid)',
    work_type: 'Hybrid',
    experience_level: 'Entry Level',
    salary_min: 135000,
    salary_max: 160000,
    description: 'Develop low-latency distributed edge proxies in Go. Optimize network routing, socket buffers, and concurrent microservice communication.',
    deadline: '2026-11-05',
    posted_at: '2026-09-08 08:30:00',
    logo_bg: '#F97316'
  }
];

export const INITIAL_JOB_REQUIRED_SKILLS: JobRequiredSkillRecord[] = [
  // Job 1: Junior Full-Stack Engineer (Stripe)
  { id: 1, job_id: 1, skill_id: 1, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // JavaScript
  { id: 2, job_id: 1, skill_id: 2, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // TypeScript
  { id: 3, job_id: 1, skill_id: 8, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // React
  { id: 4, job_id: 1, skill_id: 13, importance: 'Required', min_proficiency: 3, weight: 1.1 }, // Node.js
  { id: 5, job_id: 1, skill_id: 19, importance: 'Required', min_proficiency: 3, weight: 1.0 }, // MySQL
  { id: 6, job_id: 1, skill_id: 15, importance: 'Required', min_proficiency: 3, weight: 1.0 }, // REST API
  { id: 7, job_id: 1, skill_id: 23, importance: 'Preferred', min_proficiency: 2, weight: 0.8 }, // Docker
  { id: 8, job_id: 1, skill_id: 38, importance: 'Preferred', min_proficiency: 3, weight: 0.7 }, // Testing

  // Job 2: Frontend React Developer (Vercel)
  { id: 9, job_id: 2, skill_id: 2, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // TypeScript
  { id: 10, job_id: 2, skill_id: 8, importance: 'Required', min_proficiency: 5, weight: 1.5 }, // React
  { id: 11, job_id: 2, skill_id: 10, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // Next.js
  { id: 12, job_id: 2, skill_id: 9, importance: 'Required', min_proficiency: 4, weight: 1.0 }, // Tailwind CSS
  { id: 13, job_id: 2, skill_id: 12, importance: 'Preferred', min_proficiency: 4, weight: 0.8 }, // Semantic HTML
  { id: 14, job_id: 2, skill_id: 38, importance: 'Preferred', min_proficiency: 3, weight: 0.7 }, // Testing

  // Job 3: Associate Machine Learning Engineer (OpenHealth AI)
  { id: 15, job_id: 3, skill_id: 3, importance: 'Required', min_proficiency: 5, weight: 1.5 }, // Python
  { id: 16, job_id: 3, skill_id: 30, importance: 'Required', min_proficiency: 4, weight: 1.4 }, // PyTorch
  { id: 17, job_id: 3, skill_id: 31, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // ML Fundamentals
  { id: 18, job_id: 3, skill_id: 29, importance: 'Required', min_proficiency: 4, weight: 1.1 }, // Pandas & NumPy
  { id: 19, job_id: 3, skill_id: 32, importance: 'Preferred', min_proficiency: 3, weight: 1.0 }, // LLMs
  { id: 20, job_id: 3, skill_id: 17, importance: 'Preferred', min_proficiency: 3, weight: 0.8 }, // FastAPI
  { id: 21, job_id: 3, skill_id: 23, importance: 'Preferred', min_proficiency: 2, weight: 0.7 }, // Docker

  // Job 4: Cloud Infrastructure & DevOps Intern (Datadog)
  { id: 22, job_id: 4, skill_id: 23, importance: 'Required', min_proficiency: 4, weight: 1.4 }, // Docker
  { id: 23, job_id: 4, skill_id: 24, importance: 'Required', min_proficiency: 3, weight: 1.4 }, // Kubernetes
  { id: 24, job_id: 4, skill_id: 25, importance: 'Required', min_proficiency: 3, weight: 1.2 }, // AWS
  { id: 25, job_id: 4, skill_id: 27, importance: 'Required', min_proficiency: 3, weight: 1.1 }, // CI/CD
  { id: 26, job_id: 4, skill_id: 3, importance: 'Preferred', min_proficiency: 3, weight: 0.9 }, // Python
  { id: 27, job_id: 4, skill_id: 5, importance: 'Preferred', min_proficiency: 3, weight: 0.8 }, // Go
  { id: 28, job_id: 4, skill_id: 28, importance: 'Preferred', min_proficiency: 2, weight: 0.8 }, // Terraform

  // Job 5: Backend Database & API Engineer (Shopify)
  { id: 29, job_id: 5, skill_id: 19, importance: 'Required', min_proficiency: 4, weight: 1.5 }, // MySQL
  { id: 30, job_id: 5, skill_id: 6, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // SQL
  { id: 31, job_id: 5, skill_id: 13, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // Node.js
  { id: 32, job_id: 5, skill_id: 15, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // REST API
  { id: 33, job_id: 5, skill_id: 22, importance: 'Required', min_proficiency: 3, weight: 1.0 }, // Redis
  { id: 34, job_id: 5, skill_id: 23, importance: 'Preferred', min_proficiency: 3, weight: 0.8 }, // Docker
  { id: 35, job_id: 5, skill_id: 16, importance: 'Preferred', min_proficiency: 3, weight: 0.8 }, // GraphQL

  // Job 6: Data Analyst & Insights Intern (Spotify)
  { id: 36, job_id: 6, skill_id: 6, importance: 'Required', min_proficiency: 4, weight: 1.5 }, // SQL
  { id: 37, job_id: 6, skill_id: 19, importance: 'Required', min_proficiency: 3, weight: 1.2 }, // MySQL
  { id: 38, job_id: 6, skill_id: 3, importance: 'Required', min_proficiency: 3, weight: 1.2 }, // Python
  { id: 39, job_id: 6, skill_id: 29, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // Pandas
  { id: 40, job_id: 6, skill_id: 33, importance: 'Required', min_proficiency: 4, weight: 1.2 }, // Data Viz
  { id: 41, job_id: 6, skill_id: 40, importance: 'Preferred', min_proficiency: 3, weight: 0.8 }, // Technical Communication

  // Job 7: Application Security Engineer (CrowdStrike)
  { id: 42, job_id: 7, skill_id: 34, importance: 'Required', min_proficiency: 4, weight: 1.5 }, // OWASP
  { id: 43, job_id: 7, skill_id: 35, importance: 'Required', min_proficiency: 4, weight: 1.4 }, // Auth & JWT/OAuth
  { id: 44, job_id: 7, skill_id: 36, importance: 'Required', min_proficiency: 4, weight: 1.3 }, // Network Security
  { id: 45, job_id: 7, skill_id: 3, importance: 'Preferred', min_proficiency: 3, weight: 0.9 }, // Python
  { id: 46, job_id: 7, skill_id: 23, importance: 'Preferred', min_proficiency: 2, weight: 0.7 }, // Docker

  // Job 8: Junior Go Backend Systems Engineer (Cloudflare)
  { id: 47, job_id: 8, skill_id: 5, importance: 'Required', min_proficiency: 4, weight: 1.6 }, // Go
  { id: 48, job_id: 8, skill_id: 36, importance: 'Required', min_proficiency: 3, weight: 1.2 }, // Network Security
  { id: 49, job_id: 8, skill_id: 18, importance: 'Required', min_proficiency: 3, weight: 1.2 }, // Microservices
  { id: 50, job_id: 8, skill_id: 23, importance: 'Preferred', min_proficiency: 3, weight: 0.9 }, // Docker
  { id: 51, job_id: 8, skill_id: 24, importance: 'Preferred', min_proficiency: 2, weight: 0.8 } // Kubernetes
];

export const INITIAL_JOB_APPLICATIONS: JobApplicationRecord[] = [
  {
    id: 1,
    student_id: 1,
    job_id: 2,
    match_percentage_at_apply: 92,
    status: 'Interviewing',
    notes: 'Technical screen scheduled for Next.js and frontend state architecture.',
    applied_at: '2026-09-08 11:00:00'
  }
];

export const MYSQL_DDL_AND_SEED_SQL = `
-- ==========================================================
-- SkillBridge: Student Skill & Career Matcher
-- Production MySQL Relational Database Schema & Seed Data
-- Target Engine: MySQL 8.0+ / InnoDB
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- ==========================================================

CREATE DATABASE IF NOT EXISTS skillbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillbridge_db;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('student', 'recruiter', 'admin') NOT NULL DEFAULT 'student',
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. Table: student_profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    university VARCHAR(255) NOT NULL,
    major VARCHAR(255) NOT NULL,
    degree VARCHAR(150) NOT NULL,
    graduation_year INT NOT NULL,
    gpa DECIMAL(3,2) NOT NULL DEFAULT 3.50,
    bio TEXT NULL,
    target_role VARCHAR(150) NOT NULL,
    github_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    portfolio_url VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_target_role (target_role),
    INDEX idx_grad_year (graduation_year)
) ENGINE=InnoDB;

-- 3. Table: skills
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    INDEX idx_category (category)
) ENGINE=InnoDB;

-- 4. Table: student_skills
CREATE TABLE IF NOT EXISTS student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT NOT NULL DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_student_skill (student_id, skill_id),
    INDEX idx_skill_proficiency (skill_id, proficiency_level)
) ENGINE=InnoDB;

-- 5. Table: job_postings
CREATE TABLE IF NOT EXISTS job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    work_type ENUM('Remote', 'Hybrid', 'On-site') NOT NULL DEFAULT 'Remote',
    experience_level ENUM('Internship', 'Entry Level', 'Mid Level', 'Senior') NOT NULL DEFAULT 'Entry Level',
    salary_min INT NOT NULL,
    salary_max INT NOT NULL,
    description TEXT NOT NULL,
    deadline DATE NOT NULL,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_work_type (work_type),
    INDEX idx_exp_level (experience_level)
) ENGINE=InnoDB;

-- 6. Table: job_required_skills
CREATE TABLE IF NOT EXISTS job_required_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    importance ENUM('Required', 'Preferred') NOT NULL DEFAULT 'Required',
    min_proficiency INT NOT NULL DEFAULT 3 CHECK (min_proficiency BETWEEN 1 AND 5),
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_job_skill (job_id, skill_id)
) ENGINE=InnoDB;

-- 7. Table: career_recommendations
CREATE TABLE IF NOT EXISTS career_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    match_percentage DECIMAL(5,2) NOT NULL,
    matched_skills_count INT NOT NULL,
    gap_skills_count INT NOT NULL,
    ai_analysis TEXT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    INDEX idx_match_score (student_id, match_percentage DESC)
) ENGINE=InnoDB;

-- 8. Table: job_applications
CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    match_percentage_at_apply DECIMAL(5,2) NOT NULL,
    status ENUM('Applied', 'Reviewing', 'Interviewing', 'Accepted', 'Rejected') DEFAULT 'Applied',
    notes VARCHAR(255) NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student_job_apply (student_id, job_id)
) ENGINE=InnoDB;
`;
