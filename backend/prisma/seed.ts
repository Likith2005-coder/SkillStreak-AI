/**
 * Seed: 9 domains + 5 deeply curated roadmaps (~60 topics each).
 *
 * Idempotent — safe to re-run. Domains, roadmaps, and topics are upserted
 * by their natural keys (slug, domainId, (roadmapId, orderIndex)).
 *
 * Run with: `npm --workspace backend run db:seed`
 *
 * Topic order: existing topics 1–18 are the original Phase 2 baseline.
 * Topics 19+ were appended later to expand each roadmap toward the
 * battleplan's 60-topic target. The roadmap UI groups by phase, so
 * new topics group naturally with their existing siblings regardless
 * of orderIndex.
 */

import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

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

        // Expansion — Foundations
        { phase: "foundations", title: "Symmetric Encryption: AES & ChaCha20", summary: "Block ciphers vs stream ciphers, modes (CBC, GCM), and how the same key encrypts and decrypts." },
        { phase: "foundations", title: "Asymmetric Encryption: RSA & ECC", summary: "Public/private keypairs, key exchange, and why elliptic curves give the same security with smaller keys." },
        { phase: "foundations", title: "Password Storage: bcrypt, Argon2, Salting", summary: "Why you never store passwords plain or with fast hashes — and how slow hashes + per-user salts defeat rainbow tables." },
        { phase: "foundations", title: "Random Numbers and Entropy", summary: "PRNGs vs CSPRNGs, why /dev/urandom matters, and how weak randomness cracks crypto." },
        { phase: "foundations", title: "Network Protocols Overview", summary: "TCP/IP, UDP, DNS, ARP — the protocols every attack and defense rides on." },
        { phase: "foundations", title: "Operating System Security Basics", summary: "Users, groups, permissions, capabilities — the OS-level model behind every privilege escalation." },

        // Expansion — Core
        { phase: "core", title: "Cross-Site Request Forgery (CSRF)", summary: "When the user's browser is the attack tool — and the SameSite cookies + token patterns that stop it." },
        { phase: "core", title: "Session Management Best Practices", summary: "Cookie flags, rotation, idle/absolute timeouts, and the lifecycle of a secure session." },
        { phase: "core", title: "API Security and Rate Limiting", summary: "Throttling, abuse prevention, API keys vs JWTs, and the OWASP API Top 10." },
        { phase: "core", title: "JSON Web Tokens (JWT) Security", summary: "Signing vs encryption, the alg:none disaster, key rotation, and when JWTs are the wrong tool." },
        { phase: "core", title: "OAuth 2.0 and OpenID Connect", summary: "Authorization vs authentication, flows (auth code, PKCE), scopes — the modern delegated-access standard." },
        { phase: "core", title: "Multi-Factor Authentication", summary: "Something you know/have/are — TOTP, U2F/WebAuthn, push notifications, and SMS's many problems." },
        { phase: "core", title: "Single Sign-On (SSO)", summary: "SAML, OIDC, and the federation patterns enterprises use to avoid 50 passwords per employee." },
        { phase: "core", title: "Access Control Models: RBAC vs ABAC", summary: "Roles vs attributes — when each fits, and why most apps end up combining them." },
        { phase: "core", title: "Wireless Network Security", summary: "WEP/WPA2/WPA3, evil twin attacks, and why public Wi-Fi is hostile by default." },
        { phase: "core", title: "VPNs and Encrypted Tunnels", summary: "IPsec, WireGuard, OpenVPN — what each protects and the threat models they don't address." },
        { phase: "core", title: "Firewall Types and Rule Design", summary: "Stateful vs stateless, packet vs application, and the principle of explicit deny." },
        { phase: "core", title: "Intrusion Detection and Prevention (IDS/IPS)", summary: "Signature vs anomaly detection, where to place sensors, and the noise problem." },
        { phase: "core", title: "Endpoint Detection and Response (EDR)", summary: "Beyond antivirus — telemetry collection, behavioral detection, and rapid containment." },
        { phase: "core", title: "Malware Analysis Basics", summary: "Static vs dynamic analysis, sandboxes, and the indicators-of-compromise that show up in IR." },
        { phase: "core", title: "Phishing and Social Engineering Defense", summary: "Why technical controls alone fail — and the user training + email auth (SPF/DKIM/DMARC) that helps." },
        { phase: "core", title: "Secure Coding Practices", summary: "The repeating patterns — input validation, output encoding, least privilege — across every language." },
        { phase: "core", title: "Input Validation and Sanitization", summary: "Allowlist vs blocklist, why output encoding is non-negotiable, and where validation belongs." },
        { phase: "core", title: "Logging and Audit Trails", summary: "What to log, what NOT to log, log integrity, and why your future incident response depends on it." },
        { phase: "core", title: "Data Loss Prevention (DLP)", summary: "Classifying sensitive data and the controls that stop it from leaving the perimeter." },
        { phase: "core", title: "Vulnerability Scanning Tools", summary: "Nessus, OpenVAS, Burp — what each finds, what each misses, and how to triage results." },
        { phase: "core", title: "Patch Management", summary: "The boring discipline that prevents most breaches — and the change-management tradeoffs." },

        // Expansion — Advanced
        { phase: "advanced", title: "Reverse Engineering Basics", summary: "Disassemblers, decompilers, and reading binaries to understand what untrusted code does." },
        { phase: "advanced", title: "Binary Exploitation and Buffer Overflows", summary: "Stack smashing, ROP chains, and the mitigations (ASLR, stack canaries, NX) that complicate them." },
        { phase: "advanced", title: "Web Application Penetration Testing", summary: "Burp Suite workflows, manual testing patterns, and the OWASP Testing Guide playbook." },
        { phase: "advanced", title: "Network Penetration Testing", summary: "Nmap, Metasploit, lateral movement, privilege escalation — the attacker's network playbook." },
        { phase: "advanced", title: "Active Directory Security", summary: "Kerberos, Golden Tickets, BloodHound — and why AD is the crown jewel in most enterprise breaches." },
        { phase: "advanced", title: "Container Security: Docker", summary: "Image scanning, minimal base images, runtime restrictions, and the daemon trust problem." },
        { phase: "advanced", title: "Kubernetes Security Hardening", summary: "RBAC, network policies, pod security standards, secrets management — and the misconfig defaults." },
        { phase: "advanced", title: "SIEM and Security Operations Centers", summary: "Splunk, Elastic, Sentinel — collecting telemetry and the alert-fatigue problem at scale." },
        { phase: "advanced", title: "Threat Intelligence and OSINT", summary: "MITRE ATT&CK, IoCs, threat feeds, and turning intel into actionable defenses." },
        { phase: "advanced", title: "Red Team vs Blue Team Operations", summary: "Adversary emulation, purple-team exercises, and the feedback loop that hardens orgs." },
        { phase: "advanced", title: "Bug Bounty Hunting", summary: "Reporting workflows, scope rules, payouts, and building a portfolio in HackerOne / Bugcrowd." },
        { phase: "advanced", title: "Compliance Frameworks", summary: "SOC 2, ISO 27001, PCI-DSS, HIPAA — what each requires and how they overlap." },
        { phase: "advanced", title: "GDPR and Privacy Regulations", summary: "Data subject rights, lawful basis, breach notification, and the cross-border data flow rules." },
        { phase: "advanced", title: "Supply Chain Security", summary: "SolarWinds, Log4Shell, dependency confusion — and SBOMs + signing as the modern response." },
        { phase: "advanced", title: "AI/ML Security and Adversarial Attacks", summary: "Model evasion, data poisoning, prompt injection — the new attack surface AI systems introduce." },
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

        // Expansion — Foundations
        { phase: "foundations", title: "HTML Forms in Depth", summary: "Input types, labels, validation attributes, and the form submission lifecycle." },
        { phase: "foundations", title: "CSS Box Model and Positioning", summary: "Margins, padding, borders, and the static/relative/absolute/fixed/sticky positioning that confuses everyone." },
        { phase: "foundations", title: "Responsive Design and Media Queries", summary: "Mobile-first methodology, breakpoints, and fluid typography for any screen." },
        { phase: "foundations", title: "TypeScript Basics", summary: "Types, interfaces, generics, and the structural type system that catches bugs at compile time." },
        { phase: "foundations", title: "Browser DevTools Mastery", summary: "Elements, console, network, performance, application — the daily debugging environment." },
        { phase: "foundations", title: "Git and GitHub for Developers", summary: "Branches, merges, rebases, PRs — the version-control workflow every team uses." },

        // Expansion — Core
        { phase: "core", title: "React Hooks Deep Dive", summary: "useState, useEffect, useRef, useMemo — when each is the right tool and the closure pitfalls." },
        { phase: "core", title: "useReducer and Complex State", summary: "When useState gets unwieldy — actions, reducers, and the dispatched-update pattern." },
        { phase: "core", title: "Custom Hooks", summary: "Extracting reusable stateful logic — composition over inheritance for the React era." },
        { phase: "core", title: "React Router and Client-Side Routing", summary: "Routes, params, nested layouts, and the SPA navigation that keeps the URL meaningful." },
        { phase: "core", title: "Context API and Prop Drilling", summary: "When passing props 5 levels deep gets ugly — and the cost of context updates." },
        { phase: "core", title: "Zustand, Redux, and State Management", summary: "Picking a state library — from simple stores to time-travel debugging." },
        { phase: "core", title: "Tailwind CSS and Utility-First Design", summary: "Why Tailwind feels weird at first and great after — composition, theming, and design systems." },
        { phase: "core", title: "CSS-in-JS Approaches", summary: "Styled-components, Emotion, vanilla-extract — the runtime/buildtime tradeoffs." },
        { phase: "core", title: "GraphQL vs REST", summary: "Schema-first APIs, over/under-fetching solved, and the operational complexity tradeoffs." },
        { phase: "core", title: "TanStack Query (React Query)", summary: "Server state vs client state — caching, refetching, optimistic updates done right." },
        { phase: "core", title: "Form Libraries", summary: "React Hook Form, Formik, native form actions — picking based on complexity and DX." },
        { phase: "core", title: "Validation with Zod and Yup", summary: "Schema-driven validation — one source of truth for client + server + types." },
        { phase: "core", title: "Node.js Fundamentals", summary: "Event loop, modules, streams — the runtime that powers most JavaScript backends." },
        { phase: "core", title: "Express.js Routing and Middleware", summary: "The minimal Node web framework — request lifecycle, error handling, and composing middleware." },
        { phase: "core", title: "NoSQL Databases", summary: "MongoDB, Redis, DynamoDB — when document/key-value stores beat relational and where they don't." },
        { phase: "core", title: "Prisma and Modern ORMs", summary: "Type-safe queries, migrations, the n+1 problem, and the abstractions that pay off." },
        { phase: "core", title: "Database Migrations", summary: "Schema versioning, forward + backward compatibility, and zero-downtime deploys." },
        { phase: "core", title: "WebSockets and Real-Time Communication", summary: "Duplex channels, Socket.IO, server-sent events — picking the right transport." },
        { phase: "core", title: "File Uploads and Storage", summary: "Multipart, signed URLs, S3 + CloudFront — the architecture behind every avatar upload." },
        { phase: "core", title: "Image Optimization in Next.js", summary: "next/image, AVIF/WebP, responsive sources, lazy loading — and the LCP wins." },

        // Expansion — Advanced
        { phase: "advanced", title: "Server Components and Streaming", summary: "React Server Components, Suspense boundaries, and the rendering model that changes data fetching." },
        { phase: "advanced", title: "Edge Functions and Edge Runtime", summary: "Geo-distributed compute — what runs at the edge, what doesn't, and the latency wins." },
        { phase: "advanced", title: "Static Site Generation vs ISR", summary: "Build-time, request-time, revalidation — picking the right rendering for each page." },
        { phase: "advanced", title: "Internationalization (i18n)", summary: "Locale routing, message catalogs, RTL support, and the surprising complexity of plurals." },
        { phase: "advanced", title: "Progressive Web Apps (PWAs)", summary: "Manifests, install prompts, app-like behavior — and the iOS limitations." },
        { phase: "advanced", title: "Service Workers and Offline Support", summary: "Cache strategies, background sync, push notifications — making the web work without network." },
        { phase: "advanced", title: "Web Performance Metrics: Core Web Vitals", summary: "LCP, INP, CLS — what Google measures and the techniques that move each needle." },
        { phase: "advanced", title: "Accessibility Audit and WCAG", summary: "ARIA, keyboard nav, screen reader testing, color contrast — and axe-core in CI." },
        { phase: "advanced", title: "SEO Fundamentals for Modern Apps", summary: "Meta tags, sitemaps, structured data, and how SPAs solve the indexing problem." },
        { phase: "advanced", title: "Microservices and Backend Architecture", summary: "When monoliths break, when microservices break worse, and the modular monolith middle ground." },
        { phase: "advanced", title: "Database Sharding and Replication", summary: "Horizontal scaling, read replicas, and the consistency tradeoffs that come with each." },
        { phase: "advanced", title: "Message Queues and Event-Driven Design", summary: "Kafka, RabbitMQ, SQS — decoupling services and the at-least-once / exactly-once spectrum." },
        { phase: "advanced", title: "Monitoring and Observability", summary: "Logs, metrics, traces — the three pillars and the OpenTelemetry standard tying them together." },
        { phase: "advanced", title: "Build Tools: Webpack, Vite, esbuild", summary: "Bundler architectures — what each prioritizes (DX, speed, output size) and when to switch." },
        { phase: "advanced", title: "Micro-Frontends", summary: "Splitting a frontend into independently-shipped pieces — when it's worth the integration cost." },
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

        // Expansion — Foundations
        { phase: "foundations", title: "AI Problem Categories", summary: "Classification vs prediction vs generation vs control — the rough taxonomy of what AI does." },
        { phase: "foundations", title: "Rationality and Optimal Behavior", summary: "What it means for an agent to be 'rational' — and why omniscience and rationality are different." },
        { phase: "foundations", title: "Discrete vs Continuous Environments", summary: "When state and action spaces are countable vs not — and the algorithms that fit each." },
        { phase: "foundations", title: "Performance Measures in AI", summary: "How do you score an agent? Cumulative reward, episode length, win rate — picking the right metric." },
        { phase: "foundations", title: "Search Tree vs Search Graph", summary: "Avoiding repeated states with closed sets — and the memory/time tradeoffs." },
        { phase: "foundations", title: "Iterative Deepening Search", summary: "BFS's optimality with DFS's memory footprint — the underrated workhorse of bounded search." },

        // Expansion — Core
        { phase: "core", title: "Local Search and Hill Climbing", summary: "When the state space is too big to enumerate — moving from neighbor to neighbor." },
        { phase: "core", title: "Simulated Annealing", summary: "Escaping local optima by accepting worse moves with decreasing probability." },
        { phase: "core", title: "Genetic Algorithms", summary: "Evolution as optimization — populations, crossover, mutation, and where they shine." },
        { phase: "core", title: "Game Theory Basics", summary: "Nash equilibria, dominant strategies, and the math behind multi-agent decisions." },
        { phase: "core", title: "Multi-Agent Systems", summary: "Coordination, communication, competition — when one agent isn't enough." },
        { phase: "core", title: "Bayesian Networks", summary: "Directed graphical models for joint probability distributions — efficient inference and intuitive structure." },
        { phase: "core", title: "Hidden Markov Models", summary: "Sequential probabilistic models — speech recognition, gene prediction, and the Viterbi algorithm." },
        { phase: "core", title: "Kalman Filters", summary: "Optimal state estimation under Gaussian noise — the math behind every GPS and self-driving car." },
        { phase: "core", title: "Particle Filters", summary: "Monte Carlo state estimation — when distributions aren't Gaussian and you need a sample-based approximation." },
        { phase: "core", title: "Decision Theory and Utility", summary: "Maximizing expected utility under uncertainty — the formal underpinning of rational choice." },
        { phase: "core", title: "Value Iteration and Policy Iteration", summary: "Solving Markov Decision Processes — Bellman equations and the convergence guarantees." },
        { phase: "core", title: "Q-Learning Basics", summary: "Model-free reinforcement learning — learning the action-value function from experience alone." },
        { phase: "core", title: "Classical Planning Algorithms", summary: "STRIPS, partial-order planning, GraphPlan — moving beyond search to structured action sequences." },
        { phase: "core", title: "Hierarchical Planning", summary: "Decomposing goals into subgoals — HTN planning and abstraction." },
        { phase: "core", title: "Symbolic vs Subsymbolic AI", summary: "The classic split — explicit reasoning vs learned representations, and the modern hybrid push." },
        { phase: "core", title: "Description Logics and Ontologies", summary: "OWL, RDF, the semantic web — and the formal foundation behind knowledge graphs." },
        { phase: "core", title: "Default Reasoning and Belief Revision", summary: "Reasoning with incomplete information — birds fly, but penguins don't." },
        { phase: "core", title: "Fuzzy Logic", summary: "Truth as a continuum — when binary logic doesn't fit reality." },
        { phase: "core", title: "Production Rule Systems", summary: "If-then rules at scale — the Rete algorithm and forward chaining inference." },
        { phase: "core", title: "Expert System Design", summary: "Knowledge engineering, inference engines, explanation facilities — what made MYCIN work." },
        { phase: "core", title: "Case-Based Reasoning", summary: "Solving new problems by adapting solutions from similar past problems — the AI of analogy." },

        // Expansion — Advanced
        { phase: "advanced", title: "Speech Recognition Foundations", summary: "From audio waveforms to phonemes to words — acoustic models, language models, and end-to-end systems." },
        { phase: "advanced", title: "Robotics and Motion Planning", summary: "Configuration spaces, RRTs, PRM — moving a robot from A to B without hitting things." },
        { phase: "advanced", title: "SLAM: Simultaneous Localization and Mapping", summary: "Building a map while figuring out where you are in it — the core problem of mobile robots." },
        { phase: "advanced", title: "Reinforcement Learning Theory", summary: "Exploration vs exploitation, on-policy vs off-policy, the theoretical foundations beyond Q-learning." },
        { phase: "advanced", title: "Deep Reinforcement Learning", summary: "DQN, PPO, A3C — combining neural networks with RL and the breakthroughs they enabled." },
        { phase: "advanced", title: "AlphaGo and Self-Play", summary: "Monte Carlo Tree Search + deep nets + self-play — the architecture that beat human Go champions." },
        { phase: "advanced", title: "Large Language Models Architecture", summary: "Tokenization, embeddings, transformer blocks, decoding — what's actually happening inside GPT." },
        { phase: "advanced", title: "Attention Mechanism Explained", summary: "Queries, keys, values, and why scaled dot-product attention changed everything." },
        { phase: "advanced", title: "Transformers Demystified", summary: "Multi-head attention, position encodings, layer norms — the architecture under every modern AI system." },
        { phase: "advanced", title: "Prompt Engineering", summary: "Few-shot, chain-of-thought, role prompting — coaxing better behavior from black-box models." },
        { phase: "advanced", title: "RAG: Retrieval-Augmented Generation", summary: "Grounding LLMs in your documents — embeddings, vector DBs, and the hallucination tradeoff." },
        { phase: "advanced", title: "AI Agents and Tool Use", summary: "ReAct, function calling, tool routing — LLMs that can take actions in the world." },
        { phase: "advanced", title: "Multimodal AI Systems", summary: "Combining text, image, audio, video — CLIP, GPT-4V, and the unified-representation push." },
        { phase: "advanced", title: "Generative AI Applications", summary: "Image gen (Stable Diffusion, DALL·E), code gen, music — the practical surface of generative models." },
        { phase: "advanced", title: "AI Safety and Alignment", summary: "RLHF, constitutional AI, the orthogonality thesis — how to build AI that does what we mean." },
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

        // Expansion — Foundations
        { phase: "foundations", title: "Feature Scaling and Normalization", summary: "Min-max, z-score, robust scaling — when each matters and which models are scale-sensitive." },
        { phase: "foundations", title: "Categorical vs Numerical Features", summary: "Different beasts requiring different treatment — and why mixing them up tanks model performance." },
        { phase: "foundations", title: "ML Pipelines and Workflow", summary: "From raw data to deployed model — the steps that always exist and the tools that automate them." },
        { phase: "foundations", title: "Data Splitting Strategies", summary: "Train/val/test, time-based splits, stratified splits — and why random splitting can lie to you." },
        { phase: "foundations", title: "Probability Refresher for ML", summary: "Independence, conditional probability, Bayes' theorem — the math language ML actually uses." },
        { phase: "foundations", title: "Linear Algebra for ML", summary: "Vectors, matrices, dot products, eigenvalues — the math behind every neural network and dimensionality reducer." },

        // Expansion — Core
        { phase: "core", title: "Naive Bayes Classifier", summary: "The probabilistic classifier that's surprisingly good at spam filtering and document classification." },
        { phase: "core", title: "Gradient Boosting (XGBoost, LightGBM, CatBoost)", summary: "The tabular-data champions — sequential weak learners that dominate Kaggle." },
        { phase: "core", title: "Hierarchical Clustering", summary: "Agglomerative vs divisive, dendrograms, linkage criteria — clustering when k is unknown." },
        { phase: "core", title: "DBSCAN: Density-Based Clustering", summary: "Finding clusters of arbitrary shape and identifying noise — what k-means can't do." },
        { phase: "core", title: "Gaussian Mixture Models", summary: "Soft clustering with EM — probabilistic membership and the maximum likelihood framework." },
        { phase: "core", title: "t-SNE and UMAP", summary: "Visualizing high-dimensional data in 2D — preserving local structure for human eyes." },
        { phase: "core", title: "Feature Selection Techniques", summary: "Filter, wrapper, embedded methods — picking which inputs actually carry signal." },
        { phase: "core", title: "Class Imbalance Handling", summary: "When 99% of examples are one class — and why accuracy becomes meaningless." },
        { phase: "core", title: "SMOTE and Resampling", summary: "Synthetic minority oversampling, undersampling, weighting — fighting imbalance at the data level." },
        { phase: "core", title: "Confusion Matrix and Multi-Class Metrics", summary: "TP/FP/TN/FN, macro/micro/weighted averaging — the building blocks of every classification metric." },
        { phase: "core", title: "ROC Curves and AUC", summary: "Visualizing the precision/recall tradeoff across thresholds — and what AUC actually means." },
        { phase: "core", title: "Precision-Recall Curves", summary: "When ROC misleads (imbalanced data) and PR curves tell the truth." },
        { phase: "core", title: "Calibration of Probabilistic Models", summary: "When 0.7 doesn't actually mean 70% — and Platt scaling / isotonic regression to fix it." },
        { phase: "core", title: "Recommender Systems Overview", summary: "Content-based vs collaborative filtering vs hybrid — the architectures behind Netflix and Amazon." },
        { phase: "core", title: "Collaborative Filtering", summary: "User-user vs item-item, the cold start problem, and matrix factorization at scale." },
        { phase: "core", title: "Content-Based Filtering", summary: "Recommending based on item features — TF-IDF, embeddings, and the diversity problem." },
        { phase: "core", title: "Matrix Factorization", summary: "SVD, ALS, and the low-rank decomposition that powers most recommender systems." },
        { phase: "core", title: "Anomaly Detection", summary: "Isolation forests, one-class SVMs, autoencoders — finding the needle when you have no labels." },
        { phase: "core", title: "Time Series Forecasting", summary: "ARIMA, Prophet, and the deep-learning challengers (N-BEATS, Temporal Fusion)." },
        { phase: "core", title: "Bayesian Optimization", summary: "Hyperparameter search done smart — Gaussian processes and acquisition functions." },
        { phase: "core", title: "Active Learning", summary: "When labels are expensive — picking the next example to label to maximize learning." },

        // Expansion — Advanced
        { phase: "advanced", title: "Convolutional Neural Networks", summary: "Convolutions, pooling, the architectures (LeNet → ResNet → EfficientNet) that solved vision." },
        { phase: "advanced", title: "Recurrent Neural Networks and LSTMs", summary: "Sequence models with memory — vanishing gradients, gated cells, and what they handle well." },
        { phase: "advanced", title: "Transformer Architecture", summary: "Self-attention, positional encodings, and the architecture that ate the deep learning world." },
        { phase: "advanced", title: "Transfer Learning and Fine-Tuning", summary: "Reusing pre-trained models — feature extraction, fine-tuning strategies, and PEFT/LoRA." },
        { phase: "advanced", title: "Generative Adversarial Networks", summary: "Generator vs discriminator — the adversarial training that produced the first photorealistic synthetic images." },
        { phase: "advanced", title: "Variational Autoencoders", summary: "Probabilistic generative models with latent spaces — the principled cousin of GANs." },
        { phase: "advanced", title: "Diffusion Models", summary: "Denoising score matching — the architecture behind Stable Diffusion and modern image gen." },
        { phase: "advanced", title: "Self-Supervised Learning", summary: "Learning representations without labels — contrastive learning (SimCLR, BYOL, MAE)." },
        { phase: "advanced", title: "Few-Shot and Zero-Shot Learning", summary: "Generalizing from very few or zero examples — meta-learning and prompt-based methods." },
        { phase: "advanced", title: "Federated Learning", summary: "Training across decentralized data without centralizing it — the privacy-preserving paradigm." },
        { phase: "advanced", title: "Model Interpretability: SHAP & LIME", summary: "Explaining individual predictions — feature attributions and the Shapley value framework." },
        { phase: "advanced", title: "Fairness and Bias in ML", summary: "Disparate impact, equalized odds, the impossibility theorems — and the practical mitigations." },
        { phase: "advanced", title: "Adversarial ML and Robustness", summary: "Evasion attacks, FGSM, defensive distillation — the cat-and-mouse of model security." },
        { phase: "advanced", title: "Distributed Training", summary: "Data parallel, model parallel, ZeRO, FSDP — scaling beyond a single GPU." },
        { phase: "advanced", title: "Production ML Monitoring", summary: "Data drift, concept drift, prediction drift — and the alerting that catches degradation early." },
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

        // Expansion — Foundations
        { phase: "foundations", title: "Types of Data: Quantitative vs Qualitative", summary: "Nominal, ordinal, interval, ratio — and the operations each scale supports." },
        { phase: "foundations", title: "Measures of Central Tendency", summary: "Mean, median, mode — when each is the right summary and when the others lie." },
        { phase: "foundations", title: "Measures of Spread", summary: "Range, variance, standard deviation, IQR — quantifying how spread out a distribution is." },
        { phase: "foundations", title: "Skewness and Kurtosis", summary: "Asymmetry and tail-heaviness — diagnosing distributions beyond mean and variance." },
        { phase: "foundations", title: "Common Probability Distributions", summary: "Normal, binomial, Poisson, exponential — recognising which fits your data." },
        { phase: "foundations", title: "Conditional Probability and Bayes' Theorem", summary: "Updating beliefs given evidence — the backbone of medical testing and spam filters." },

        // Expansion — Core
        { phase: "core", title: "NumPy Fundamentals", summary: "ndarrays, vectorization, broadcasting — the foundation under every Python data tool." },
        { phase: "core", title: "SQL for Data Analysis", summary: "SELECT, JOIN, GROUP BY, window functions — the language of every analytics warehouse." },
        { phase: "core", title: "Joining and Aggregating Data", summary: "Inner/outer/cross joins, group-by patterns, and the index-vs-column distinction in pandas." },
        { phase: "core", title: "Pivot Tables and Reshape", summary: "Long vs wide format, melt and pivot — getting data into the shape your tool wants." },
        { phase: "core", title: "Plotly and Interactive Charts", summary: "Hover, zoom, drill-down — when a static chart isn't enough." },
        { phase: "core", title: "Matplotlib Customization", summary: "Subplots, titles, axes, themes — beating matplotlib into looking professional." },
        { phase: "core", title: "Seaborn Statistical Visuals", summary: "Distribution plots, regression plots, heatmaps — fast EDA visuals out of the box." },
        { phase: "core", title: "Dashboards with Streamlit", summary: "Turning a Python script into a deployable web dashboard with zero web dev." },
        { phase: "core", title: "Excel for Data Analysis", summary: "Pivot tables, lookups, what-if — the most-used data tool on Earth, used well." },
        { phase: "core", title: "Power BI vs Tableau", summary: "BI tool selection — data sources, modeling, governance, and the pricing reality." },
        { phase: "core", title: "Statistical Tests in Practice", summary: "t-test, chi-squared, ANOVA — picking the right test and interpreting the output." },
        { phase: "core", title: "Confidence Intervals", summary: "Range estimates instead of point estimates — and what '95% confidence' actually means." },
        { phase: "core", title: "Bootstrap Resampling", summary: "Estimating uncertainty by resampling — when classical formulas don't fit your data." },
        { phase: "core", title: "Linear and Logistic Regression in Practice", summary: "Reading coefficients, checking assumptions, multicollinearity — the practitioner's lens." },
        { phase: "core", title: "Tree-Based Models for Tabular Data", summary: "Random forests and gradient boosting — what to reach for when you don't need neural nets." },
        { phase: "core", title: "Cluster Analysis Applications", summary: "Customer segmentation, anomaly detection, image quantization — what clustering actually solves." },
        { phase: "core", title: "Outlier Detection", summary: "Z-score, IQR, isolation forests — finding the points that don't belong." },
        { phase: "core", title: "Web Scraping with BeautifulSoup", summary: "Extracting data from HTML — selectors, pagination, and respecting robots.txt." },
        { phase: "core", title: "APIs and Public Data Sources", summary: "REST, pagination, rate limits, and the public datasets that bootstrap most projects." },
        { phase: "core", title: "Data Storage Formats", summary: "CSV, Parquet, JSON, Avro — picking based on size, schema evolution, and read patterns." },
        { phase: "core", title: "Working with Geospatial Data", summary: "Coordinate systems, GeoPandas, choropleth maps — the basics of doing analysis on maps." },

        // Expansion — Advanced
        { phase: "advanced", title: "Multi-Armed Bandits", summary: "Beyond A/B — adaptive allocation that converges on the winner faster (epsilon-greedy, Thompson sampling)." },
        { phase: "advanced", title: "Bayesian A/B Testing", summary: "Posterior probabilities instead of p-values — earlier decisions with quantified uncertainty." },
        { phase: "advanced", title: "Survival Analysis", summary: "Time-to-event modeling — Kaplan-Meier, Cox proportional hazards, censoring." },
        { phase: "advanced", title: "Cohort Analysis", summary: "Tracking groups over time — retention curves, the unit-economics framework behind product analytics." },
        { phase: "advanced", title: "Funnel Analysis", summary: "Step-by-step conversion measurement — finding where users drop off and why." },
        { phase: "advanced", title: "Customer Segmentation", summary: "Clustering customers for targeting — k-means, RFM, behavioral segmentation." },
        { phase: "advanced", title: "RFM Analysis", summary: "Recency, Frequency, Monetary — the three-axis customer scoring used in every CRM." },
        { phase: "advanced", title: "Customer Lifetime Value Models", summary: "Predicting LTV — the metric that drives every paid-acquisition decision." },
        { phase: "advanced", title: "Churn Prediction", summary: "Survival models vs classification — predicting who's about to leave and why." },
        { phase: "advanced", title: "Marketing Mix Modeling", summary: "Attributing sales lift across channels — the regression that defends the marketing budget." },
        { phase: "advanced", title: "Pricing Analytics", summary: "Price elasticity, willingness-to-pay surveys, dynamic pricing — turning data into revenue." },
        { phase: "advanced", title: "Network Analysis", summary: "Graphs, centrality, communities — the math behind social network analysis and recommendation graphs." },
        { phase: "advanced", title: "Text Mining and Topic Modeling", summary: "TF-IDF, LDA, BERTopic — extracting structure from unstructured text at scale." },
        { phase: "advanced", title: "NLP for Data Science", summary: "Sentiment, classification, NER — the everyday NLP tasks data scientists ship." },
        { phase: "advanced", title: "Productionizing Data Pipelines", summary: "Airflow, dbt, scheduling, idempotency — moving from notebooks to reliable production data flows." },
      ],
    },
  },
  // Originally Phase-2 chatbot-served only. Promoted to curated in a later
  // expansion — each now has a full ~60-topic roadmap.
  {
    slug: "cloud-computing",
    name: "Cloud Computing",
    description:
      "Provision infrastructure on demand. AWS/Azure/GCP, IaaS/PaaS/SaaS, and the shared responsibility model.",
    icon: "cloud",
    color: "sky",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 6,
    roadmap: {
      title: "Cloud Computing: Fundamentals to Architectures",
      estimatedDays: 60,
      topics: [
        // Foundations
        { phase: "foundations", title: "What Is Cloud Computing?", summary: "On-demand compute, storage, and services over the internet — and the historical shift from owning servers." },
        { phase: "foundations", title: "IaaS vs PaaS vs SaaS", summary: "The three abstraction levels — what each gives up vs gets, with concrete examples." },
        { phase: "foundations", title: "The Shared Responsibility Model", summary: "What the cloud provider secures vs what you secure — the diagram every architect memorises." },
        { phase: "foundations", title: "AWS vs Azure vs GCP", summary: "The big three providers compared on services, pricing, market position, and cultural fit." },
        { phase: "foundations", title: "Regions, AZs, and Edge Locations", summary: "The physical hierarchy — geographic regions, isolated AZs, and CDN PoPs at the edge." },
        { phase: "foundations", title: "Public, Private, Hybrid, Multi-Cloud", summary: "The four deployment models and the business reasons each gets picked." },
        { phase: "foundations", title: "Capex vs Opex Cloud Pricing", summary: "Why finance treats cloud spend differently — and how that reshapes engineering decisions." },
        { phase: "foundations", title: "Identity and Access Management Basics", summary: "Users, groups, roles, policies — the access-control vocabulary that's the same across providers." },
        { phase: "foundations", title: "Virtualization and Hypervisors", summary: "Type-1 vs type-2 hypervisors and the abstraction that makes a single physical server look like many." },
        { phase: "foundations", title: "Containers vs VMs", summary: "Different isolation, different overhead — when to reach for each." },
        { phase: "foundations", title: "Cloud Networking Fundamentals", summary: "Virtual networks, subnets, routing tables, NAT — the cloud's recreation of the data centre LAN." },
        { phase: "foundations", title: "Storage Tiers and Object Storage", summary: "Hot/warm/cold/archive tiers and S3-style object storage vs block storage vs file storage." },

        // Core
        { phase: "core", title: "AWS Core Services Overview", summary: "EC2, S3, RDS, Lambda, IAM — the small set of services every AWS workload uses." },
        { phase: "core", title: "Azure Core Services Overview", summary: "VMs, Blob Storage, Azure SQL, Functions, Entra ID — Microsoft's equivalent of the AWS core." },
        { phase: "core", title: "GCP Core Services Overview", summary: "Compute Engine, Cloud Storage, BigQuery, Cloud Functions — Google's data-first cloud." },
        { phase: "core", title: "VPC Networking and Subnetting", summary: "Designing an isolated network — public vs private subnets, CIDR ranges, route tables." },
        { phase: "core", title: "Security Groups and Network ACLs", summary: "Stateful vs stateless firewalls in the cloud — and how rules compose." },
        { phase: "core", title: "Load Balancers", summary: "ALB vs NLB vs classic — layer 7 routing, layer 4 TCP, and the health-check model." },
        { phase: "core", title: "Auto Scaling Groups", summary: "Reactive vs predictive scaling, target tracking, and the cost vs latency tradeoff." },
        { phase: "core", title: "Elastic Compute (EC2 Instance Types)", summary: "General/compute/memory/storage-optimized families and how to pick without overpaying." },
        { phase: "core", title: "Object Storage in Depth (S3)", summary: "Buckets, prefixes, lifecycle policies, versioning, replication — the workhorse of cloud storage." },
        { phase: "core", title: "Block Storage Performance (EBS)", summary: "gp3, io2, throughput vs IOPS, snapshots — tuning storage for the workload." },
        { phase: "core", title: "Relational Databases as a Service", summary: "RDS, Aurora, Cloud SQL — managed Postgres/MySQL with backups, failover, and patching done for you." },
        { phase: "core", title: "NoSQL Databases as a Service", summary: "DynamoDB, Cosmos DB, Bigtable — when to reach for them and the consistency model differences." },
        { phase: "core", title: "Serverless Functions", summary: "Lambda, Azure Functions, Cloud Run — pricing per invocation, cold starts, and what fits the model." },
        { phase: "core", title: "Container Orchestration", summary: "ECS, EKS, AKS, GKE — managed Kubernetes and the platform-specific equivalents." },
        { phase: "core", title: "Container Registries", summary: "ECR, ACR, Artifact Registry — image storage, scanning, and access control." },
        { phase: "core", title: "Infrastructure as Code: Terraform", summary: "HCL, providers, state files, modules — declarative cloud infra that's actually reviewable." },
        { phase: "core", title: "CloudFormation and ARM Templates", summary: "Provider-native IaC tools — when to use them vs Terraform." },
        { phase: "core", title: "IAM Policies and Roles in Depth", summary: "Resource policies vs identity policies, least privilege, and the trust-relationship model." },
        { phase: "core", title: "Encryption at Rest and in Transit", summary: "Provider-managed keys, customer-managed keys, and where TLS is enforced by default." },
        { phase: "core", title: "Key Management Services (KMS)", summary: "Envelope encryption, key rotation, and the audit trails that compliance demands." },
        { phase: "core", title: "Secrets Management", summary: "Secrets Manager, Key Vault, Secret Manager — keeping API keys and DB passwords out of code." },
        { phase: "core", title: "API Gateway Patterns", summary: "Routing, throttling, auth integration — the entry point for serverless APIs." },
        { phase: "core", title: "Message Queues (SQS, Service Bus)", summary: "Decoupling producers from consumers — at-least-once delivery and visibility timeouts." },
        { phase: "core", title: "Pub/Sub Messaging", summary: "SNS, EventBridge, Pub/Sub — fan-out, filtering, and event-driven plumbing." },
        { phase: "core", title: "Event-Driven Architecture", summary: "Sources, buses, targets — the cloud-native pattern that ties serverless services together." },
        { phase: "core", title: "CDN and Edge Caching", summary: "CloudFront, Cloud CDN, Front Door — pushing content close to users for latency wins." },
        { phase: "core", title: "DNS as a Service (Route 53)", summary: "Hosted zones, routing policies (latency/geo/failover), and health checks." },
        { phase: "core", title: "Monitoring and Logging Services", summary: "CloudWatch, Stackdriver, Monitor — metrics, logs, alarms, and the cost of cardinality." },
        { phase: "core", title: "Cost Optimization Strategies", summary: "Reserved instances, spot/preemptible, rightsizing, and the cost-allocation tags that make it possible." },

        // Advanced
        { phase: "advanced", title: "Multi-Region Architectures", summary: "Active-active vs active-passive, replication latency, and the global routing layer." },
        { phase: "advanced", title: "Disaster Recovery and Backup", summary: "RPO/RTO, backup strategies, and pilot-light vs warm-standby vs hot-standby tradeoffs." },
        { phase: "advanced", title: "High Availability Patterns", summary: "Multi-AZ deployments, leader election, the redundancy patterns that hit 99.99% uptime." },
        { phase: "advanced", title: "Cloud-Native Application Design", summary: "12-factor app, statelessness, externalized config — building for the cloud, not lifting from on-prem." },
        { phase: "advanced", title: "Microservices on the Cloud", summary: "Service decomposition, communication patterns, and where the cloud fits each piece." },
        { phase: "advanced", title: "Service Mesh: Istio and App Mesh", summary: "Sidecar proxies, mTLS, traffic shifting — networking concerns lifted out of app code." },
        { phase: "advanced", title: "Kubernetes on the Cloud", summary: "Managed control planes, cluster autoscaling, and the operational reality vs the marketing." },
        { phase: "advanced", title: "Serverless End-to-End Architectures", summary: "Building entire apps with Lambda + API Gateway + DynamoDB — wins, gotchas, and cold-start strategies." },
        { phase: "advanced", title: "Data Lakes and Data Warehouses", summary: "S3 + Glue + Athena vs Redshift/BigQuery/Snowflake — picking the right analytics architecture." },
        { phase: "advanced", title: "Big Data on the Cloud", summary: "EMR, Dataproc, HDInsight — managed Spark/Hadoop and when serverless analytics replaces them." },
        { phase: "advanced", title: "Machine Learning Services", summary: "SageMaker, Vertex AI, Azure ML — managed training, hosting, and pipelines for ML workloads." },
        { phase: "advanced", title: "Edge Computing and IoT Hubs", summary: "Greengrass, IoT Hub, IoT Core — running compute close to devices and the data-flow patterns." },
        { phase: "advanced", title: "FinOps: Cloud Cost Management", summary: "The discipline that pairs engineers with finance — budgets, anomalies, and showback/chargeback." },
        { phase: "advanced", title: "Security Posture Management", summary: "AWS Config, Azure Policy, Security Hub — continuous compliance scanning at scale." },
        { phase: "advanced", title: "Compliance in the Cloud", summary: "HIPAA, GDPR, SOC 2, FedRAMP — what the provider gives you vs what you still owe." },
        { phase: "advanced", title: "Hybrid and Multi-Cloud Strategies", summary: "When multi-cloud is genuine resilience vs vendor-lock-in fear — and the operational tax." },
        { phase: "advanced", title: "Cloud Migration Patterns (6 R's)", summary: "Rehost, replatform, refactor, repurchase, retire, retain — picking the strategy per workload." },
        { phase: "advanced", title: "DevOps on the Cloud", summary: "CodePipeline, Azure DevOps, Cloud Build — provider-native CI/CD vs third-party." },
        { phase: "advanced", title: "Observability at Scale", summary: "Centralized logging, distributed tracing, the OpenTelemetry standard, and the cardinality cost." },
        { phase: "advanced", title: "Becoming Cloud Certified", summary: "AWS SAA, Azure AZ-104, GCP ACE — what each cert covers and the study path." },
      ],
    },
  },
  {
    slug: "devops",
    name: "DevOps",
    description:
      "Ship faster, safer. CI/CD, Docker, Kubernetes, observability, and the cultural practices behind them.",
    icon: "git-branch",
    color: "orange",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 7,
    roadmap: {
      title: "DevOps: Culture, Practice, Tools",
      estimatedDays: 60,
      topics: [
        // Foundations
        { phase: "foundations", title: "What Is DevOps?", summary: "Culture + practice + tools — the goal is faster, safer flow from idea to production." },
        { phase: "foundations", title: "The Three Ways", summary: "Flow, feedback, continual learning — the principles from The Phoenix Project that anchor every DevOps movement." },
        { phase: "foundations", title: "Lean Software Development", summary: "Eliminate waste, amplify learning, decide late, deliver fast — the manufacturing principles ported to software." },
        { phase: "foundations", title: "The CALMS Framework", summary: "Culture, Automation, Lean, Measurement, Sharing — the five-pillar self-assessment for DevOps maturity." },
        { phase: "foundations", title: "Site Reliability Engineering Basics", summary: "Google's framing of DevOps — error budgets, SLOs, toil reduction, and the ops-as-software mindset." },
        { phase: "foundations", title: "Linux Command Line Essentials", summary: "ls, grep, awk, sed, find, ssh, journalctl — the daily vocabulary of every server interaction." },
        { phase: "foundations", title: "Bash Scripting Fundamentals", summary: "Variables, conditionals, loops, pipes — the glue holding every CI pipeline together." },
        { phase: "foundations", title: "Networking for DevOps", summary: "TCP/IP, DNS, ports, firewalls, load balancers — the network layer behind every deploy." },
        { phase: "foundations", title: "Version Control with Git", summary: "Commits, branches, remotes, history — the substrate of every modern engineering workflow." },
        { phase: "foundations", title: "Branching Strategies", summary: "GitFlow vs trunk-based vs GitHub Flow — picking based on team size and release cadence." },
        { phase: "foundations", title: "Code Review Best Practices", summary: "Small PRs, fast turnaround, kind feedback, and what NOT to bikeshed about." },
        { phase: "foundations", title: "Pair and Mob Programming", summary: "Two/many heads on one keyboard — when it's a force multiplier and when it's a tax." },

        // Core
        { phase: "core", title: "Continuous Integration Fundamentals", summary: "Every commit triggers build + test — and why the trunk should always be green." },
        { phase: "core", title: "Continuous Delivery vs Deployment", summary: "Always shippable vs always shipped — the org maturity step between them." },
        { phase: "core", title: "Build Tools (Maven, Gradle, Make)", summary: "Declarative vs imperative builds — the tool families and what each language community uses." },
        { phase: "core", title: "GitHub Actions Pipelines", summary: "Workflows, jobs, steps, runners — the most common CI today." },
        { phase: "core", title: "Jenkins and Pipeline as Code", summary: "Jenkinsfile, declarative vs scripted, agents — the elder statesman of CI." },
        { phase: "core", title: "GitLab CI/CD", summary: ".gitlab-ci.yml, stages, runners, environments — integrated CI/CD that ships with the SCM." },
        { phase: "core", title: "CircleCI and Other CI Platforms", summary: "Buildkite, Drone, Travis — the evolving CI landscape and what makes each different." },
        { phase: "core", title: "Artifact Repositories", summary: "Nexus, Artifactory, GitHub Packages — versioned binary storage and dependency proxying." },
        { phase: "core", title: "Containerization with Docker", summary: "Images, layers, registries — the abstraction that ate ops over the last decade." },
        { phase: "core", title: "Dockerfiles and Multi-Stage Builds", summary: "Writing efficient Dockerfiles — small images, fast builds, no secrets in layers." },
        { phase: "core", title: "Docker Compose for Local Dev", summary: "Multi-container local stacks — postgres + redis + app in one yaml." },
        { phase: "core", title: "Container Image Best Practices", summary: "Distroless bases, non-root users, signed images, minimal attack surface." },
        { phase: "core", title: "Kubernetes Architecture", summary: "Control plane, kubelet, scheduler, etcd — what each component does and how requests flow." },
        { phase: "core", title: "Pods, Services, Deployments, ConfigMaps", summary: "The core K8s objects every workload uses — and the relationships between them." },
        { phase: "core", title: "Ingress Controllers", summary: "Routing external traffic into the cluster — nginx, Traefik, ALB ingress." },
        { phase: "core", title: "Helm Charts", summary: "Templated K8s manifests, releases, dependencies — the package manager for Kubernetes." },
        { phase: "core", title: "Terraform Fundamentals", summary: "Providers, resources, state, plan/apply — declarative infra as code." },
        { phase: "core", title: "Ansible for Configuration Management", summary: "Playbooks, roles, inventories — agentless config management for fleets of servers." },
        { phase: "core", title: "Puppet and Chef Overview", summary: "The earlier generation of config management — what they got right and why agentless won." },
        { phase: "core", title: "Secrets Management with Vault", summary: "Dynamic secrets, leasing, rotation — and why .env files in git are a career-limiting move." },
        { phase: "core", title: "Logging Strategies", summary: "ELK stack, Loki, structured logging, log levels — and what to NOT log." },
        { phase: "core", title: "Metrics with Prometheus", summary: "Time-series scraping, PromQL, exporters — the open metrics standard." },
        { phase: "core", title: "Visualization with Grafana", summary: "Dashboards, alerting, datasources — turning raw metrics into something humans read." },
        { phase: "core", title: "Distributed Tracing", summary: "Jaeger, Zipkin, OpenTelemetry — following a request across microservices." },
        { phase: "core", title: "Application Performance Monitoring", summary: "DataDog, New Relic, Dynatrace — turnkey observability for full-stack apps." },
        { phase: "core", title: "Chaos Engineering Basics", summary: "Game days, failure injection, hypothesis-driven experiments — Netflix's gift to ops." },
        { phase: "core", title: "Feature Flags and Toggle Strategies", summary: "Decoupling deploy from release — LaunchDarkly, Flagsmith, and rollout patterns." },
        { phase: "core", title: "Blue-Green and Canary Deployments", summary: "Two parallel environments vs incremental rollouts — risk-reduction deploy patterns." },

        // Advanced
        { phase: "advanced", title: "GitOps with ArgoCD and Flux", summary: "Git as the source of truth for infra and apps — declarative, auditable, reversible." },
        { phase: "advanced", title: "Service Mesh: Istio Deep Dive", summary: "Sidecar proxies, mTLS, traffic shaping, observability — and the operational complexity tax." },
        { phase: "advanced", title: "Kubernetes Operators", summary: "Encoding operational knowledge as software — the controller pattern at scale." },
        { phase: "advanced", title: "Custom Resource Definitions", summary: "Extending the K8s API with your own object types — the foundation of every operator." },
        { phase: "advanced", title: "Multi-Cluster Kubernetes", summary: "Federation, fleet management, and the cross-cluster networking patterns." },
        { phase: "advanced", title: "Progressive Delivery", summary: "Beyond canary — automated promotion based on metrics, with Argo Rollouts and Flagger." },
        { phase: "advanced", title: "Platform Engineering and IDPs", summary: "Internal Developer Platforms — the team that gives every other team a paved road." },
        { phase: "advanced", title: "Backstage and Developer Portals", summary: "Spotify's open-source service catalog — making your platform discoverable." },
        { phase: "advanced", title: "Database Migrations in CI/CD", summary: "Schema changes that survive zero-downtime deploys — Liquibase, Flyway, expand/contract." },
        { phase: "advanced", title: "Zero-Downtime Database Changes", summary: "Online schema changes, backfills, dual writes — and the discipline to ship them safely." },
        { phase: "advanced", title: "Infrastructure Testing", summary: "Terratest, Inspec, kitchen — testing your IaC before it touches production." },
        { phase: "advanced", title: "Security in CI/CD", summary: "SAST, DAST, SCA, signed builds — shifting security left without slowing the pipeline." },
        { phase: "advanced", title: "Secrets Scanning", summary: "git-secrets, gitleaks, GitHub secret scanning — catching credentials before they ship." },
        { phase: "advanced", title: "Container Security Scanning", summary: "Trivy, Snyk, Grype — finding CVEs in base images and the patch-cadence question." },
        { phase: "advanced", title: "SLOs, SLIs, and Error Budgets", summary: "Defining reliability quantitatively — and when an error budget says STOP shipping." },
        { phase: "advanced", title: "Incident Management and Postmortems", summary: "Severity tiers, on-call rotations, blameless postmortems — the cultural feedback loop." },
        { phase: "advanced", title: "On-Call and PagerDuty", summary: "Schedules, escalation policies, runbooks — surviving and improving the on-call experience." },
        { phase: "advanced", title: "Capacity Planning", summary: "Headroom modelling, queueing theory, and how to predict the next infra bottleneck." },
        { phase: "advanced", title: "Disaster Recovery Drills", summary: "Tabletops, region failovers, restore-from-backup tests — practising the things you hope never happen." },
        { phase: "advanced", title: "Building a DevOps Culture", summary: "Incentives, blamelessness, ownership, the org-design constraints — culture beats tools every time." },
      ],
    },
  },
  {
    slug: "blockchain",
    name: "Blockchain",
    description:
      "Decentralized ledgers. Cryptographic hashing, consensus, smart contracts, and the systems built on top.",
    icon: "link",
    color: "amber",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 8,
    roadmap: {
      title: "Blockchain: From Hashing to DeFi",
      estimatedDays: 60,
      topics: [
        // Foundations
        { phase: "foundations", title: "What Is a Blockchain?", summary: "An append-only ledger of cryptographically-linked blocks — and why \"distributed\" is the load-bearing word." },
        { phase: "foundations", title: "Distributed Ledger Technology", summary: "Beyond Bitcoin — DLT as a category, with permissioned and permissionless variants." },
        { phase: "foundations", title: "Cryptographic Hashing", summary: "SHA-256, deterministic outputs, avalanche effect — the primitive that holds blocks together." },
        { phase: "foundations", title: "Public and Private Keys", summary: "Asymmetric cryptography for ownership — your wallet IS your private key." },
        { phase: "foundations", title: "Digital Signatures", summary: "Proving ownership without revealing the key — ECDSA, EdDSA, and signature replay protection." },
        { phase: "foundations", title: "Merkle Trees", summary: "The data structure that makes light clients possible — proving inclusion without the whole chain." },
        { phase: "foundations", title: "Blocks, Transactions, and Chains", summary: "How txs aggregate into blocks and blocks chain via hashes — the immutability mechanism." },
        { phase: "foundations", title: "Consensus Mechanisms Overview", summary: "PoW, PoS, PoA, BFT — the algorithms that let strangers agree on the next block." },
        { phase: "foundations", title: "The Bitcoin Whitepaper", summary: "Satoshi's 9 pages — what it actually says vs the maximalist mythology around it." },
        { phase: "foundations", title: "Ethereum and Smart Contracts Intro", summary: "Programmable money — the EVM, gas, and the transition from currency to platform." },
        { phase: "foundations", title: "Wallets: Hot vs Cold", summary: "Browser/mobile wallets, hardware wallets, multisig — the security/convenience spectrum." },
        { phase: "foundations", title: "Mining vs Staking", summary: "PoW miners burn energy; PoS validators lock capital — the incentive mechanics of each." },

        // Core
        { phase: "core", title: "Proof of Work in Depth", summary: "Difficulty adjustment, nonce search, hash rate, and why ASICs took over." },
        { phase: "core", title: "Proof of Stake and Variants", summary: "Slashing, finality, validator economics — and the energy-efficiency win over PoW." },
        { phase: "core", title: "Other Consensus (PoA, PoH, BFT)", summary: "Authority-based, history-based, Byzantine fault tolerance — non-PoW/PoS alternatives." },
        { phase: "core", title: "The Mempool and Transaction Lifecycle", summary: "Submission, gossiping, inclusion, finality — what happens between \"send\" and \"confirmed\"." },
        { phase: "core", title: "Block Structure and Mining", summary: "Headers, transactions, merkle roots — the bytes that get hashed and the work to find them." },
        { phase: "core", title: "Bitcoin Script", summary: "Stack-based, non-Turing-complete — limitations as features, and the transactions you can build." },
        { phase: "core", title: "UTXO vs Account Model", summary: "Bitcoin's unspent outputs vs Ethereum's account state — the fundamental design split." },
        { phase: "core", title: "Solidity Fundamentals", summary: "Types, modifiers, events, inheritance — Ethereum's smart contract language." },
        { phase: "core", title: "Smart Contract Patterns", summary: "Withdrawal pattern, pull-over-push, state machines, proxies — the building blocks." },
        { phase: "core", title: "Security: Reentrancy", summary: "The DAO hack pattern — and the checks-effects-interactions discipline that prevents it." },
        { phase: "core", title: "Security: Integer Overflow", summary: "Pre-Solidity-0.8 disasters and SafeMath — and what changed when overflow checks became default." },
        { phase: "core", title: "ERC-20 Token Standard", summary: "transfer/approve/balanceOf — the interface every fungible token implements." },
        { phase: "core", title: "ERC-721 NFTs", summary: "Non-fungible tokens — uniqueness, metadata, and what's actually \"on chain\" vs IPFS." },
        { phase: "core", title: "ERC-1155 Multi-Tokens", summary: "Batched transfers, fungible + non-fungible in one contract — the gas-efficient successor." },
        { phase: "core", title: "Decentralized Exchanges (DEX)", summary: "Uniswap, Curve, Balancer — order books vs AMMs, and why on-chain trading needed a new model." },
        { phase: "core", title: "Automated Market Makers", summary: "x*y=k constant product, liquidity pools, impermanent loss — the math behind Uniswap." },
        { phase: "core", title: "Stablecoins", summary: "Fiat-backed (USDC), crypto-backed (DAI), algorithmic (failed) — pegging mechanics and depeg risks." },
        { phase: "core", title: "DeFi Primitives: Lending and Borrowing", summary: "Aave, Compound — collateralized loans, liquidation, and interest rate models." },
        { phase: "core", title: "Yield Farming and Liquidity Mining", summary: "Earning tokens by providing liquidity — and where the yields actually come from." },
        { phase: "core", title: "Layer 2 Scaling: Rollups", summary: "Bundling many txs into one L1 commitment — the scaling consensus that won." },
        { phase: "core", title: "Optimistic vs ZK Rollups", summary: "Fraud proofs vs validity proofs — different security models, different latency, different costs." },
        { phase: "core", title: "Sidechains and Bridges", summary: "Polygon, Ronin, the bridge hacks — connecting separate chains and the trust assumptions involved." },
        { phase: "core", title: "Cross-Chain Communication", summary: "IBC, LayerZero, Wormhole — the protocols moving messages and value between chains." },
        { phase: "core", title: "Web3.js and Ethers.js", summary: "JavaScript libraries to interact with Ethereum — providers, signers, contracts." },
        { phase: "core", title: "Hardhat and Foundry", summary: "Modern Solidity dev environments — testing, deployment, and the Foundry speed advantage." },
        { phase: "core", title: "Truffle and Remix", summary: "The earlier-generation tooling — and why most teams have moved on." },
        { phase: "core", title: "IPFS and Decentralized Storage", summary: "Content-addressed storage — the way NFT metadata is supposed to be hosted." },
        { phase: "core", title: "Oracles (Chainlink)", summary: "Bringing off-chain data on-chain — price feeds, VRF, and the oracle problem." },

        // Advanced
        { phase: "advanced", title: "Zero-Knowledge Proofs", summary: "Proving you know something without revealing it — and the cryptographic primitives that make it real." },
        { phase: "advanced", title: "ZK-SNARKs vs ZK-STARKs", summary: "Trusted setup vs transparent, proof size vs prover time — the tradeoffs of each ZK family." },
        { phase: "advanced", title: "Privacy Coins: Monero, Zcash", summary: "Ring signatures, stealth addresses, ZK-shielded txs — the privacy techniques behind each." },
        { phase: "advanced", title: "DAOs and Governance Tokens", summary: "On-chain governance, proposal mechanics, voter apathy — the operational reality vs the manifesto." },
        { phase: "advanced", title: "DAO Frameworks", summary: "Aragon, Snapshot, Tally — building DAOs without writing the governance contracts from scratch." },
        { phase: "advanced", title: "MEV: Maximal Extractable Value", summary: "Front-running, sandwich attacks, the dark forest — the parallel game played in the mempool." },
        { phase: "advanced", title: "Flash Loans and Attacks", summary: "Uncollateralized loans within one tx — legitimate uses and the multi-million-dollar exploits." },
        { phase: "advanced", title: "The DAO Hack and Lessons", summary: "$60M drained in 2016, the Ethereum hard fork, and the precedents that still echo." },
        { phase: "advanced", title: "Smart Contract Auditing", summary: "What auditors check, manual review vs automated tools, and reading an audit report critically." },
        { phase: "advanced", title: "Formal Verification", summary: "Mathematical proofs of contract correctness — Certora, K framework, and the cost vs assurance tradeoff." },
        { phase: "advanced", title: "Tokenomics Design", summary: "Supply schedules, vesting, sinks, sources — designing a token that doesn't dump in 6 months." },
        { phase: "advanced", title: "Game Theory in Blockchain", summary: "Incentive design, nothing-at-stake, slashing economics — making honest behavior the rational choice." },
        { phase: "advanced", title: "Modular Blockchains", summary: "Celestia, EigenLayer — separating execution, settlement, consensus, and data availability." },
        { phase: "advanced", title: "Restaking and EigenLayer", summary: "Reusing staked ETH to secure other systems — and the systemic risk concerns." },
        { phase: "advanced", title: "Account Abstraction (ERC-4337)", summary: "Smart-contract wallets, sponsored gas, social recovery — the UX leap blockchains needed." },
        { phase: "advanced", title: "Cross-Chain Standards", summary: "CCIP, IBC, LayerZero — competing standards for chain interoperability." },
        { phase: "advanced", title: "Blockchain Privacy and Compliance", summary: "Tornado Cash, OFAC sanctions, privacy pools — the unresolved tension between transparency and privacy." },
        { phase: "advanced", title: "Central Bank Digital Currencies", summary: "CBDCs vs crypto vs stablecoins — design choices and the political economy." },
        { phase: "advanced", title: "Real-World Asset Tokenization", summary: "On-chain bonds, real estate, commodities — the bridge between TradFi and DeFi." },
        { phase: "advanced", title: "Career Paths in Web3", summary: "Smart contract dev, security, protocol research, ops — the roles and how comp differs from Web2." },
      ],
    },
  },
  {
    slug: "iot",
    name: "Internet of Things",
    description:
      "Connecting the physical world. Sensors, MQTT, edge computing, and the architectures that scale to billions of devices.",
    icon: "cpu",
    color: "teal",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 9,
    roadmap: {
      title: "IoT: From Sensors to the Cloud",
      estimatedDays: 60,
      topics: [
        // Foundations
        { phase: "foundations", title: "What Is IoT?", summary: "The internet's growth from screens to sensors — and what makes a device \"smart\"." },
        { phase: "foundations", title: "IoT Architecture: Devices, Gateways, Cloud", summary: "The 3-tier (or 4-tier) reference architecture every IoT system follows." },
        { phase: "foundations", title: "Microcontrollers vs Microprocessors", summary: "ESP32 / Arduino vs Raspberry Pi — when to use each based on power, cost, and capability." },
        { phase: "foundations", title: "Arduino Fundamentals", summary: "The IDE, sketches, digital/analog I/O — the gateway hardware platform for hobbyists." },
        { phase: "foundations", title: "Raspberry Pi Basics", summary: "Full Linux on a $40 SBC — when an MCU isn't enough." },
        { phase: "foundations", title: "Sensors and Actuators", summary: "Inputs (temp, humidity, motion, light) and outputs (motors, relays, displays) — the IoT vocabulary." },
        { phase: "foundations", title: "Analog vs Digital Signals", summary: "ADCs, DACs, sampling rate, resolution — and why your sensor reading isn't quite what you measured." },
        { phase: "foundations", title: "Power Considerations and Battery Life", summary: "Sleep modes, duty cycles, energy harvesting — the design constraint that drives everything." },
        { phase: "foundations", title: "Embedded C Basics", summary: "Memory layout, volatile, interrupts, no-malloc constraints — the language of microcontrollers." },
        { phase: "foundations", title: "Soldering and Hardware Prototyping", summary: "Breadboards, perfboards, basic soldering — taking a project from breadboard to permanent." },
        { phase: "foundations", title: "IoT vs Industrial IoT (IIoT)", summary: "Consumer scale vs factory floor — different reliability bars, different protocols, different budgets." },
        { phase: "foundations", title: "Privacy and Ethics in IoT", summary: "Always-on sensors in the home — what gets collected, who owns it, and the consent gap." },

        // Core
        { phase: "core", title: "IoT Communication Protocols Overview", summary: "MQTT, CoAP, HTTP, AMQP — the protocols and what each optimizes for." },
        { phase: "core", title: "MQTT in Depth", summary: "Pub/sub, QoS levels, retained messages, last will — the protocol every IoT project ends up using." },
        { phase: "core", title: "CoAP Protocol", summary: "REST-like, UDP-based, designed for constrained devices — when HTTP is too heavy." },
        { phase: "core", title: "HTTP for IoT", summary: "When the simplicity wins — and the bandwidth/battery tax." },
        { phase: "core", title: "LoRaWAN", summary: "Long-range, low-power wide-area networking — the wireless protocol for outdoor IoT." },
        { phase: "core", title: "Zigbee and Z-Wave", summary: "Mesh protocols for smart home — strengths, vendor ecosystems, and the Matter convergence." },
        { phase: "core", title: "Bluetooth and BLE", summary: "Personal-area, low-energy — beacons, wearables, and the GATT model." },
        { phase: "core", title: "WiFi for IoT", summary: "When the easy choice is also the right choice — and the power/range constraints." },
        { phase: "core", title: "Cellular IoT (NB-IoT, LTE-M)", summary: "Carrier-grade IoT — when you need coverage everywhere and can pay per byte." },
        { phase: "core", title: "5G and IoT", summary: "Massive machine-type communications, network slicing, ultra-low latency — what 5G enables for IoT." },
        { phase: "core", title: "Mesh Networks", summary: "Devices relaying for each other — Thread, Zigbee, BLE Mesh and the routing tradeoffs." },
        { phase: "core", title: "Edge Computing for IoT", summary: "Processing at the device or gateway — latency, bandwidth, privacy, resilience wins." },
        { phase: "core", title: "IoT Gateways", summary: "Bridging device protocols to cloud protocols, doing local processing, handling intermittent connectivity." },
        { phase: "core", title: "AWS IoT Core", summary: "Device shadow, rules engine, fleet provisioning — Amazon's managed IoT platform." },
        { phase: "core", title: "Azure IoT Hub", summary: "Device twins, direct methods, jobs — Microsoft's managed IoT broker." },
        { phase: "core", title: "Google Cloud IoT", summary: "Pub/Sub-centric architecture — and the discontinuation announcement and migration paths." },
        { phase: "core", title: "IoT Device Provisioning", summary: "Zero-touch onboarding, x.509 certificates, SCEP — getting devices into the fleet at scale." },
        { phase: "core", title: "Over-the-Air (OTA) Updates", summary: "Firmware updates from the cloud — image signing, atomic deploys, rollback strategies." },
        { phase: "core", title: "Time-Series Data and IoT", summary: "Why IoT generates time-series — and the storage/query patterns it demands." },
        { phase: "core", title: "InfluxDB for Sensor Data", summary: "Buckets, retention policies, downsampling — purpose-built TSDB for IoT telemetry." },
        { phase: "core", title: "Stream Processing for IoT", summary: "Kafka Streams, Flink, AWS Kinesis — processing events as they arrive instead of in batches." },
        { phase: "core", title: "Real-Time Dashboards", summary: "Grafana, Kibana, custom dashboards — turning streams of telemetry into something humans see." },
        { phase: "core", title: "IoT with Node-RED", summary: "Flow-based programming for IoT integrations — drag, drop, deploy." },
        { phase: "core", title: "Home Assistant", summary: "The open-source smart home hub — supporting hundreds of integrations and a YAML config DSL." },
        { phase: "core", title: "Smart Home Standards (Matter)", summary: "The cross-industry standard finally fixing smart-home interop — what it solves and what it doesn't." },
        { phase: "core", title: "Industrial Protocols (Modbus, OPC-UA)", summary: "The protocols PLCs and industrial gear actually speak — and the bridges to IT systems." },
        { phase: "core", title: "IoT Device Lifecycle Management", summary: "Provisioning → operation → decommissioning — managing fleets of millions of devices." },
        { phase: "core", title: "IoT Cost Optimization", summary: "Per-device cloud costs add up fast — message batching, edge filtering, and cellular plans." },

        // Advanced
        { phase: "advanced", title: "IoT Security Threats", summary: "Mirai, default passwords, unpatched firmware — why IoT is the soft underbelly of the internet." },
        { phase: "advanced", title: "Securing MQTT", summary: "TLS, client certificates, ACLs — and the reality of brokers exposed without auth." },
        { phase: "advanced", title: "Device Identity and PKI", summary: "X.509 at the edge, hardware-backed keys, attestation — strong identity for billions of devices." },
        { phase: "advanced", title: "Secure Boot and Trusted Execution", summary: "Verifying firmware authenticity at boot — TPMs, TrustZone, and the chain of trust." },
        { phase: "advanced", title: "Penetration Testing IoT Devices", summary: "Hardware ports, firmware extraction, fuzzing — the IoT pentester's playbook." },
        { phase: "advanced", title: "IoT Botnets (Mirai)", summary: "How weak IoT security armed the largest DDoS in history — and what changed after." },
        { phase: "advanced", title: "Privacy by Design in IoT", summary: "Data minimization, on-device processing, federated patterns — engineering privacy in." },
        { phase: "advanced", title: "Federated Learning on Edge", summary: "Training models across devices without centralizing data — the privacy-preserving ML for IoT." },
        { phase: "advanced", title: "TinyML and Edge AI", summary: "ML inference on microcontrollers — quantized models, sub-MB footprints, and the use cases." },
        { phase: "advanced", title: "TensorFlow Lite for Microcontrollers", summary: "Running a neural net in 256 KB — the framework and the optimisation tricks." },
        { phase: "advanced", title: "Embedded Vision", summary: "OpenMV, ESP32-CAM — image processing at the edge for sub-$10 devices." },
        { phase: "advanced", title: "Voice Interfaces", summary: "Wake-word detection on-device, cloud-side ASR/NLU — Alexa/Google/Siri's architecture." },
        { phase: "advanced", title: "Wearable Computing", summary: "Wrist-worn sensors, BLE-tethered devices, the OS landscape (WatchOS, Wear OS, RTOS)." },
        { phase: "advanced", title: "Healthcare IoT (Medical Devices)", summary: "FDA approval, HIPAA, the regulatory bar that consumer IoT never has to clear." },
        { phase: "advanced", title: "Smart City Architectures", summary: "Citywide sensor networks — traffic, parking, air quality — and the data-governance models." },
        { phase: "advanced", title: "Connected Vehicles", summary: "OBD-II, CAN bus, V2X, OTA updates for cars — the IoT problem with the highest stakes." },
        { phase: "advanced", title: "Agriculture IoT", summary: "Precision farming, soil sensors, drones, irrigation control — the rural IoT story." },
        { phase: "advanced", title: "Manufacturing 4.0", summary: "IIoT on the factory floor — predictive maintenance, digital twins, OEE." },
        { phase: "advanced", title: "Building an IoT Product End-to-End", summary: "Hardware design, firmware, cloud, app, manufacturing — the full path from idea to ship." },
        { phase: "advanced", title: "Career Paths in IoT and Embedded", summary: "Firmware, hardware, cloud, security, product — the roles and the unique skill mixes." },
      ],
    },
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

/** Split an array into fixed-size chunks. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Cap rows per multi-row INSERT so a large roadmap can't build one oversized
// statement (Postgres caps parameters at 65535; 7 params/row) or hold a long
// write lock. Roadmaps top out around 60 topics today, so this is a single
// round trip in practice, with headroom to chunk anything larger.
const TOPIC_BATCH_SIZE = 100;

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
  //
  // One multi-row `INSERT ... ON CONFLICT DO UPDATE` per chunk — a single
  // round trip for the whole chunk instead of one per topic. `id` is only
  // consumed on insert (kept as-is on conflict); `created_at` uses its DB
  // default.
  const rows = d.roadmap.topics.map((t, i) =>
    Prisma.sql`(${randomUUID()}, ${roadmap.id}, ${i + 1}, ${t.title}, ${t.summary}, ${DIFFICULTY_BY_PHASE[t.phase]}, ${t.phase})`
  );

  for (const batch of chunk(rows, TOPIC_BATCH_SIZE)) {
    await prisma.$executeRaw`
      INSERT INTO topics (id, roadmap_id, order_index, title, summary, difficulty, phase)
      VALUES ${Prisma.join(batch)}
      ON CONFLICT (roadmap_id, order_index) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        difficulty = EXCLUDED.difficulty,
        phase = EXCLUDED.phase
    `;
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
