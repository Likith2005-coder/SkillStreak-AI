/**
 * Phase 2 seed: 9 domains + 5 deeply curated roadmaps (~18 topics each).
 *
 * Idempotent — safe to re-run. Domains, roadmaps, and topics are upserted
 * by their natural keys (slug, domainId, (roadmapId, orderIndex)).
 *
 * Run with: `npm --workspace backend run db:seed`
 *
 * Per battleplan §2 risks: this is the starting set. Expand each deep
 * roadmap to 60-90 topics over Weeks 3-8 by appending entries below.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Phase = "foundations" | "core" | "advanced";
type Difficulty = "easy" | "standard" | "hard";

type SeedTopic = {
  title: string;
  summary: string;
  phase: Phase;
};

type SeedDomain = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "mixed";
  isCurated: boolean;
  orderIndex: number;
  roadmap?: {
    title: string;
    estimatedDays: number;
    topics: SeedTopic[];
  };
};

// Difficulty rolls up from phase: foundations=easy, core=standard, advanced=hard.
const DIFFICULTY_BY_PHASE: Record<Phase, Difficulty> = {
  foundations: "easy",
  core: "standard",
  advanced: "hard",
};

const DOMAINS: SeedDomain[] = [
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description:
      "Defend systems, networks, and data from attacks. From the CIA Triad to threat modeling and incident response.",
    icon: "shield-check",
    color: "rose",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 1,
    roadmap: {
      title: "Cybersecurity from Fundamentals to Defense",
      estimatedDays: 60,
      topics: [
        { phase: "foundations", title: "The CIA Triad", summary: "Confidentiality, Integrity, Availability — the three properties every security control protects." },
        { phase: "foundations", title: "Threats, Vulnerabilities, and Risk", summary: "How attackers, weaknesses, and impact combine into the risk equation that drives every decision." },
        { phase: "foundations", title: "Authentication vs Authorization", summary: "Proving who you are versus what you're allowed to do — and why mixing them up causes most access bugs." },
        { phase: "foundations", title: "Common Attack Vectors", summary: "Phishing, malware, social engineering, and credential reuse — the everyday ways breaches start." },
        { phase: "foundations", title: "Security Mindset and Defense in Depth", summary: "Layering controls so no single failure becomes a breach." },
        { phase: "foundations", title: "Cryptography Basics", summary: "Symmetric vs asymmetric encryption — what each is for and where they fit." },
        { phase: "core", title: "Hashing and Digital Signatures", summary: "One-way functions, integrity checks, and how signatures prove authenticity without revealing secrets." },
        { phase: "core", title: "TLS, HTTPS, and Public Key Infrastructure", summary: "How browsers and servers establish encrypted, authenticated channels using certificates and CAs." },
        { phase: "core", title: "OWASP Top 10 Web Vulnerabilities", summary: "The most common web app weaknesses and the patterns that prevent them." },
        { phase: "core", title: "SQL Injection and Prevention", summary: "How untrusted input becomes executable SQL, and why parameterized queries are the durable fix." },
        { phase: "core", title: "Cross-Site Scripting (XSS)", summary: "When attacker JavaScript runs in your users' browsers — reflected, stored, and DOM-based variants." },
        { phase: "core", title: "Network Fundamentals for Security", summary: "TCP/IP, DNS, firewalls, and segmentation — the substrate every network attack rides on." },
        { phase: "core", title: "Identity and Access Management (IAM)", summary: "Roles, least privilege, MFA, and the lifecycle of an identity from provisioning to revocation." },
        { phase: "advanced", title: "Penetration Testing Methodology", summary: "Recon, scanning, exploitation, post-exploitation, reporting — how authorized attackers work." },
        { phase: "advanced", title: "Threat Modeling with STRIDE", summary: "Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation — a structured way to find threats early." },
        { phase: "advanced", title: "Zero Trust Architecture", summary: "Never trust, always verify — assume breach and authenticate every request, every time." },
        { phase: "advanced", title: "Incident Response and Forensics", summary: "Detect, contain, eradicate, recover — and the evidence chain that survives in court." },
        { phase: "advanced", title: "Cloud Security and Shared Responsibility", summary: "What the cloud provider secures vs what you secure — and the misconfigurations that cause most breaches." },
      ],
    },
  },
  {
    slug: "web-development",
    name: "Web Development",
    description:
      "Build modern web apps from the browser to the database. HTTP, React, Next.js, auth, and deployment.",
    icon: "code-2",
    color: "blue",
    difficulty: "beginner",
    isCurated: true,
    orderIndex: 2,
    roadmap: {
      title: "Full-Stack Web Development",
      estimatedDays: 60,
      topics: [
        { phase: "foundations", title: "How the Web Works", summary: "HTTP requests, DNS, browsers, and servers — the round-trip that powers every page." },
        { phase: "foundations", title: "HTML Semantics and Accessibility", summary: "Using the right elements so the page is meaningful to humans, screen readers, and search engines." },
        { phase: "foundations", title: "CSS Layout: Flexbox and Grid", summary: "Two layout systems that replaced floats — when to use each and how they compose." },
        { phase: "foundations", title: "JavaScript Fundamentals", summary: "Types, scope, functions, closures — the language features behind every interactive page." },
        { phase: "foundations", title: "The DOM and Event Handling", summary: "How HTML becomes a tree of objects you can read, change, and listen to." },
        { phase: "foundations", title: "Modern JavaScript (ES6+)", summary: "Arrow functions, modules, destructuring, async/await — the syntax you'll see in every codebase." },
        { phase: "core", title: "HTTP Methods and REST Principles", summary: "GET, POST, PUT, DELETE — and the resource-oriented design that keeps APIs predictable." },
        { phase: "core", title: "JSON, APIs, and fetch", summary: "Talking to a backend from the browser and handling the responses sanely." },
        { phase: "core", title: "React Component Model", summary: "Composition, rendering, and the unidirectional data flow that makes React UIs reasonable." },
        { phase: "core", title: "State and Props in React", summary: "Where data lives, how it flows, and why lifting state up is usually the right move." },
        { phase: "core", title: "Forms, Validation, and Controlled Inputs", summary: "Reading user input reliably, validating it, and giving clear errors." },
        { phase: "core", title: "Server-Side Rendering with Next.js", summary: "Why SSR matters for SEO and performance — and how the App Router structures it." },
        { phase: "core", title: "SQL Database Fundamentals", summary: "Tables, relationships, queries, indexes — the durable foundation under every backend." },
        { phase: "advanced", title: "Authentication and Sessions", summary: "JWTs vs cookies, session storage, and the tradeoffs that affect security and UX." },
        { phase: "advanced", title: "Performance: Caching, CDNs, Code Splitting", summary: "Why your page is slow and the layered fixes — from network to bundle to runtime." },
        { phase: "advanced", title: "Web Security: CORS, CSP, OWASP for Frontend", summary: "The headers and policies that prevent the browser from being a vector." },
        { phase: "advanced", title: "Testing: Unit, Integration, E2E", summary: "The testing pyramid — what each layer catches and the tools that fit each role." },
        { phase: "advanced", title: "Deployment and CI/CD", summary: "From git push to live URL — pipelines, environments, and zero-downtime releases." },
      ],
    },
  },
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    description:
      "The big ideas: search, logic, knowledge representation, agents — the foundations that pre-date deep learning and still matter.",
    icon: "brain",
    color: "violet",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 3,
    roadmap: {
      title: "Foundations of Artificial Intelligence",
      estimatedDays: 60,
      topics: [
        { phase: "foundations", title: "What Is AI? Strong vs Weak", summary: "The classic split — narrow problem-solvers vs general intelligence — and where today's systems sit." },
        { phase: "foundations", title: "The Turing Test and AI History", summary: "From Dartmouth 1956 to LLMs — the ideas, winters, and breakthroughs that shape the field." },
        { phase: "foundations", title: "Intelligent Agents and Environments", summary: "The PEAS framework: Performance, Environment, Actuators, Sensors — how to specify any AI problem." },
        { phase: "foundations", title: "Problem Solving and State-Space Search", summary: "Reframing problems as graphs of states and actions — the universal AI representation." },
        { phase: "foundations", title: "Uninformed Search: BFS, DFS, UCS", summary: "Exploring without domain knowledge — completeness, optimality, time, and space tradeoffs." },
        { phase: "foundations", title: "Heuristic Search: A* and Greedy", summary: "Using domain estimates to find optimal paths fast — and what makes a heuristic admissible." },
        { phase: "core", title: "Adversarial Search and Minimax", summary: "Game trees, alpha-beta pruning, and how computers play chess and Go." },
        { phase: "core", title: "Constraint Satisfaction Problems", summary: "Sudoku, scheduling, map coloring — and the backtracking + arc consistency that solves them." },
        { phase: "core", title: "Knowledge Representation", summary: "Encoding what an agent knows so it can reason — semantic networks, frames, ontologies." },
        { phase: "core", title: "Propositional and First-Order Logic", summary: "The mathematical languages that let machines reason about truth and quantification." },
        { phase: "core", title: "Inference and Resolution", summary: "Mechanically deriving new facts from a knowledge base — the engine behind logic programming." },
        { phase: "core", title: "Bayesian Reasoning Under Uncertainty", summary: "Probabilities, priors, and updating beliefs as evidence arrives." },
        { phase: "core", title: "Markov Decision Processes", summary: "Sequential decisions under uncertainty — states, actions, rewards, policies, value functions." },
        { phase: "advanced", title: "Natural Language Processing Basics", summary: "Tokenization, parsing, language models — turning text into something a machine can compute on." },
        { phase: "advanced", title: "Word Embeddings and Vector Semantics", summary: "Word2Vec, GloVe, contextual embeddings — meaning as geometry." },
        { phase: "advanced", title: "Computer Vision Fundamentals", summary: "Pixels to features to objects — convolutions, edges, and the representational hierarchy." },
        { phase: "advanced", title: "Expert Systems and Rule-Based AI", summary: "MYCIN, DENDRAL, and the era of explicit knowledge bases — what worked and what didn't." },
        { phase: "advanced", title: "Ethics and Bias in AI", summary: "Where training data, deployment, and incentives create real-world harm — and how practitioners respond." },
      ],
    },
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    description:
      "Models that learn from data. Regression, classification, clustering, neural networks — and the math underneath.",
    icon: "trending-up",
    color: "emerald",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 4,
    roadmap: {
      title: "Machine Learning: Theory and Practice",
      estimatedDays: 60,
      topics: [
        { phase: "foundations", title: "Supervised vs Unsupervised Learning", summary: "Learning from labels versus discovering structure — and the third path: reinforcement learning." },
        { phase: "foundations", title: "Train/Test Split and Generalization", summary: "Why a model that memorizes the training set is useless — and how to measure real performance." },
        { phase: "foundations", title: "Bias-Variance Tradeoff", summary: "Underfitting vs overfitting — the central tension every ML model navigates." },
        { phase: "foundations", title: "Linear Regression", summary: "The simplest, most useful model — fitting a line, the assumptions it makes, and when it fails." },
        { phase: "foundations", title: "Logistic Regression and Classification", summary: "From regression to probabilities — and the workhorse classifier of practical ML." },
        { phase: "foundations", title: "Loss Functions and Gradient Descent", summary: "How a model learns: define error, follow the slope down, repeat." },
        { phase: "core", title: "Decision Trees and Random Forests", summary: "Splitting on features, ensembling many trees, and why this is still a top tabular-data baseline." },
        { phase: "core", title: "Support Vector Machines", summary: "Maximum-margin classification — the elegant pre-deep-learning champion of structured data." },
        { phase: "core", title: "K-Nearest Neighbors", summary: "The lazy learner — store the data, classify by neighbors, and the curse of dimensionality." },
        { phase: "core", title: "K-Means Clustering", summary: "Unsupervised grouping — initialization, the elbow method, and where it breaks down." },
        { phase: "core", title: "Principal Component Analysis", summary: "Compressing data while preserving structure — the eigenvectors of variance." },
        { phase: "core", title: "Cross-Validation and Hyperparameter Tuning", summary: "k-fold CV, grid vs random search, and avoiding the trap of test-set leakage." },
        { phase: "core", title: "Evaluation Metrics", summary: "Accuracy lies — when to use precision, recall, F1, ROC-AUC, and how to pick for your problem." },
        { phase: "advanced", title: "Neural Networks and Backpropagation", summary: "From perceptrons to deep nets — and the chain rule that made them trainable at scale." },
        { phase: "advanced", title: "Deep Learning Architectures", summary: "CNNs for images, RNNs/LSTMs for sequences, Transformers for everything." },
        { phase: "advanced", title: "Regularization", summary: "L1, L2, dropout, early stopping — making big models generalize." },
        { phase: "advanced", title: "Ensemble Methods", summary: "Bagging, boosting, stacking — why combining weak learners often beats a single strong one." },
        { phase: "advanced", title: "MLOps and Model Deployment", summary: "From notebook to production — versioning, monitoring, retraining, and the drift problem." },
      ],
    },
  },
  {
    slug: "data-science",
    name: "Data Science",
    description:
      "Turn raw data into decisions. Statistics, wrangling, visualization, experimentation, and the storytelling that makes it land.",
    icon: "database",
    color: "cyan",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 5,
    roadmap: {
      title: "Data Science from Stats to Storytelling",
      estimatedDays: 60,
      topics: [
        { phase: "foundations", title: "The Data Science Workflow", summary: "Question → data → cleaning → analysis → model → communicate. The loop every project follows." },
        { phase: "foundations", title: "Descriptive Statistics", summary: "Mean, median, variance, distributions — the summaries that describe a dataset before you model it." },
        { phase: "foundations", title: "Probability and Distributions", summary: "Random variables, the normal distribution, and the math that underpins every inferential claim." },
        { phase: "foundations", title: "Sampling and the Central Limit Theorem", summary: "Why averages of samples are nearly normal — and how that lets us reason about populations." },
        { phase: "foundations", title: "Hypothesis Testing", summary: "Null hypothesis, p-values, confidence intervals — and the misuses that make headlines." },
        { phase: "foundations", title: "Correlation vs Causation", summary: "When two things move together — and the rigorous reasons that doesn't mean one causes the other." },
        { phase: "core", title: "Data Wrangling with Pandas", summary: "DataFrames, joins, group-by, reshaping — the daily verbs of every data scientist." },
        { phase: "core", title: "Cleaning Missing and Inconsistent Data", summary: "Imputation strategies, dedup, type coercion — turning messy reality into something analyzable." },
        { phase: "core", title: "Exploratory Data Analysis (EDA)", summary: "Looking before modeling — distributions, outliers, relationships, and the stories they tell." },
        { phase: "core", title: "Data Visualization Principles", summary: "Tufte's rules, chart-type fit, and avoiding the 3D pie chart of shame." },
        { phase: "core", title: "Feature Engineering", summary: "The 80% of model performance that comes before the model — encoding, scaling, interactions." },
        { phase: "core", title: "Working with Categorical Data", summary: "One-hot, target encoding, embeddings — and the high-cardinality trap." },
        { phase: "core", title: "Time Series Basics", summary: "Trend, seasonality, autocorrelation — and why most ML rules don't apply when time matters." },
        { phase: "advanced", title: "A/B Testing and Experiment Design", summary: "Randomization, sample size, power, and the discipline that turns dashboards into decisions." },
        { phase: "advanced", title: "Causal Inference", summary: "Confounders, DAGs, instrumental variables — moving beyond correlation when you need real answers." },
        { phase: "advanced", title: "Working with Big Data", summary: "When pandas runs out of RAM — Spark, distributed compute, and partitioning strategies." },
        { phase: "advanced", title: "Communicating Insights", summary: "The presentation, the executive summary, the dashboard — making analysis change behavior." },
        { phase: "advanced", title: "Building a Data Science Portfolio", summary: "Picking projects that show the full workflow — and the writeup that makes them legible." },
      ],
    },
  },
  // Phase-2 catalog only — these four are served via the AI chatbot's
  // on-demand roadmap generation per battleplan §2 risks ("extensible
  // architecture" design choice). They appear in the gallery but lead
  // to a "coming via chatbot" prompt rather than a curated roadmap.
  {
    slug: "cloud-computing",
    name: "Cloud Computing",
    description:
      "Provision infrastructure on demand. AWS/Azure/GCP, IaaS/PaaS/SaaS, and the shared responsibility model.",
    icon: "cloud",
    color: "sky",
    difficulty: "intermediate",
    isCurated: false,
    orderIndex: 6,
  },
  {
    slug: "devops",
    name: "DevOps",
    description:
      "Ship faster, safer. CI/CD, Docker, Kubernetes, observability, and the cultural practices behind them.",
    icon: "git-branch",
    color: "orange",
    difficulty: "intermediate",
    isCurated: false,
    orderIndex: 7,
  },
  {
    slug: "blockchain",
    name: "Blockchain",
    description:
      "Decentralized ledgers. Cryptographic hashing, consensus, smart contracts, and the systems built on top.",
    icon: "link",
    color: "amber",
    difficulty: "intermediate",
    isCurated: false,
    orderIndex: 8,
  },
  {
    slug: "iot",
    name: "Internet of Things",
    description:
      "Connecting the physical world. Sensors, MQTT, edge computing, and the architectures that scale to billions of devices.",
    icon: "cpu",
    color: "teal",
    difficulty: "intermediate",
    isCurated: false,
    orderIndex: 9,
  },
];

async function upsertDomain(d: SeedDomain): Promise<string> {
  const domain = await prisma.domain.upsert({
    where: { slug: d.slug },
    create: {
      slug: d.slug,
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      difficulty: d.difficulty,
      isCurated: d.isCurated,
      orderIndex: d.orderIndex,
    },
    update: {
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      difficulty: d.difficulty,
      isCurated: d.isCurated,
      orderIndex: d.orderIndex,
    },
  });
  return domain.id;
}

async function upsertRoadmap(domainId: string, d: SeedDomain): Promise<void> {
  if (!d.roadmap) return;

  const total = d.roadmap.topics.length;

  const roadmap = await prisma.roadmap.upsert({
    where: { domainId },
    create: {
      domainId,
      title: d.roadmap.title,
      totalTopics: total,
      estimatedDays: d.roadmap.estimatedDays,
    },
    update: {
      title: d.roadmap.title,
      totalTopics: total,
      estimatedDays: d.roadmap.estimatedDays,
    },
  });

  // Upsert topics by (roadmapId, orderIndex). Don't delete existing topics —
  // user_progress rows reference them via FK with cascade, but rows on a
  // user's account would be lost. Adding new topics is safe.
  for (let i = 0; i < d.roadmap.topics.length; i++) {
    const t = d.roadmap.topics[i];
    const orderIndex = i + 1;
    const difficulty = DIFFICULTY_BY_PHASE[t.phase];

    await prisma.topic.upsert({
      where: {
        roadmapId_orderIndex: { roadmapId: roadmap.id, orderIndex },
      },
      create: {
        roadmapId: roadmap.id,
        orderIndex,
        title: t.title,
        summary: t.summary,
        difficulty,
        phase: t.phase,
      },
      update: {
        title: t.title,
        summary: t.summary,
        difficulty,
        phase: t.phase,
      },
    });
  }
}

async function main(): Promise<void> {
  console.log(`Seeding ${DOMAINS.length} domains…`);

  for (const d of DOMAINS) {
    const domainId = await upsertDomain(d);
    await upsertRoadmap(domainId, d);
    const topicCount = d.roadmap?.topics.length ?? 0;
    const tag = d.isCurated ? `curated · ${topicCount} topics` : "chatbot-served";
    console.log(`  ✓ ${d.name.padEnd(26)} ${tag}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
