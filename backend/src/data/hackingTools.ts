/**
 * Ethical Hacking Arsenal — curated catalogue.
 *
 * A pedagogical reference organised by the classic penetration-testing
 * methodology (recon → scanning → exploitation → post-exploitation →
 * reporting). The catalogue is curated (accurate names, categories, official
 * links); the detailed step-by-step guide for each tool is generated on demand
 * by the LLM and cached (see toolkit.service.ts), the same pattern used for
 * topic explanations.
 *
 * Educational, authorized-testing context only. Guides are framed around
 * lawful use on systems you own or are explicitly permitted to test.
 */

export type ToolDifficulty = "beginner" | "intermediate" | "advanced";

export type HackingPhase = {
  slug: string;
  order: number;
  name: string;
  icon: string; // lucide-react icon name
  color: string; // tailwind hue used by domain-style
  summary: string;
  objective: string;
};

export type HackingTool = {
  slug: string;
  name: string;
  phase: string; // phase slug
  category: string;
  tagline: string;
  difficulty: ToolDifficulty;
  officialUrl: string;
  tags: string[];
  /**
   * Optional steering for the AI guide: an explicit list of the capabilities,
   * flags, scan types, scripts/modules, etc. the cheat-sheet MUST cover so the
   * generated guide is comprehensive for the flagship tools.
   */
  guideFocus?: string;
};

// Comprehensive coverage hints for the flagship tools — keyed by slug and
// merged onto the tool below.
const GUIDE_FOCUS: Record<string, string> = {
  nmap:
    "Cover EVERYTHING: target specs (single IP, ranges, CIDR, -iL file); host discovery (-sn, -Pn, -PS/-PA/-PU/-PE/-PP); scan types (-sS SYN, -sT connect, -sU UDP, -sA ACK, -sW window, -sM Maimon, -sN/-sF/-sX null/FIN/Xmas); port selection (-p, -p-, --top-ports, -F fast, --exclude-ports); service/version detection (-sV, --version-intensity, --version-all); OS detection (-O, --osscan-guess); the NSE scripting engine in depth (-sC, --script, all script CATEGORIES: auth, broadcast, brute, default, discovery, dos, exploit, external, fuzzer, intrusive, malware, safe, version, vuln — with real examples like --script vuln, --script http-enum, --script smb-os-discovery, --script 'ssl-*', --script-args, --script-help, updating with nmap --script-updatedb); timing & performance (-T0..-T5, --min-rate, --max-rate, --min-parallelism, --host-timeout); firewall/IDS evasion (-f fragment, --mtu, -D decoys, -S spoof source, --spoof-mac, --source-port/-g, --data-length, --badsum); output formats (-oN, -oX, -oG, -oA, -v/-vv, -d, --reason, --open); and a few full 'recipe' commands combining these. Include a large grouped command cheat-sheet.",
  sqlmap:
    "Cover: targeting (-u URL, --data POST, -r request file, --cookie, --headers); detection/risk/level (--level, --risk); enumeration flags (--dbs, --tables, --columns, --dump, --dump-all, --current-user, --current-db, --passwords, --schema, -D/-T/-C); techniques (--technique BEUSTQ); tampers (--tamper, list common tamper scripts); --batch, --threads, --os-shell, --sql-shell, --file-read/--file-write, WAF bypass, --proxy, --random-agent. Big cheat-sheet.",
  hydra:
    "Cover: syntax basics (-l/-L user(s), -p/-P password(s), -C combo), targeting service://host, common modules (ssh, ftp, http-get/http-post-form, rdp, smb, mysql, telnet), the tricky http-post-form syntax with failure string, -t threads, -f stop-on-found, -s port, -V verbose, -o output. Many per-protocol examples.",
  metasploit:
    "Cover: msfconsole basics (search, use, info, show options, set/setg, run/exploit); module types (exploit, auxiliary, payload, post, encoder, nop); payloads & msfvenom (generating reverse/bind shells, staged vs stageless, formats); handlers (multi/handler, LHOST/LPORT); sessions & post-exploitation; workspaces & db_nmap; resource scripts. Include a full end-to-end workflow.",
  hashcat:
    "Cover: attack modes (-a 0 straight, -a 1 combinator, -a 3 mask/brute, -a 6/-a 7 hybrid); common hash modes -m (0 MD5, 100 SHA1, 1000 NTLM, 1800 sha512crypt, 22000 WPA); wordlists + rules (-r, best64), masks (?l?u?d?s?a and custom charsets), --increment; performance (-w, -O, -d); --show, --username, --potfile, restore/session. Cheat-sheet of common -m modes.",
  john:
    "Cover: basic usage, wordlist mode (--wordlist, --rules), incremental mode, single mode, --format list & choosing format, using *2john helpers (zip2john, ssh2john, rar2john, etc.), --show, --pot, sessions/--restore, unshadow. Examples for several hash types.",
  gobuster:
    "Cover: modes (dir, dns, vhost, fuzz, s3); dir flags (-u, -w, -x extensions, -t threads, -s/-b status codes, -k, -o output, --wildcard); dns flags (-d, -w, -i show-ips); common wordlists (SecLists paths). Examples per mode.",
  "burp-suite":
    "Cover: setting the browser proxy (127.0.0.1:8080) + installing the CA cert; the core tabs — Proxy/intercept, Target/site map & scope, Repeater, Intruder (attack types: sniper, battering ram, pitchfork, cluster bomb), Decoder, Comparer, Sequencer; Community vs Pro (active scanner); a realistic workflow of intercept → send to Repeater → tamper → Intruder fuzz.",
  "aircrack-ng": "Cover the full suite workflow: airmon-ng (monitor mode), airodump-ng (capture + target BSSID/channel), aireplay-ng (deauth to capture handshake), aircrack-ng (crack the .cap with a wordlist), plus WPA vs WEP notes and hashcat 22000 handoff.",
  netcat: "Cover: connect (nc host port), listen (-l -p), reverse shell vs bind shell patterns, file transfer, port scanning (-z -v), banner grabbing, -e vs the mkfifo backpipe trick, ncat TLS options. Give both attacker- and listener-side commands.",
  meterpreter: "Cover core commands: sysinfo, getuid, getprivs, ps, migrate, hashdump, screenshot, keyscan, download/upload, shell, portfwd, run post/* modules, background & sessions, getsystem privilege escalation, persistence considerations.",
  wpscan: "Cover: --url target, enumeration flags (-e vp/vt/u/ap/at — vulnerable plugins/themes, users, all plugins/themes), --api-token for vuln data, password attack (--passwords, --usernames), --plugins-detection modes, output/format.",
};

export const PHASES: HackingPhase[] = [
  {
    slug: "reconnaissance",
    order: 1,
    name: "Reconnaissance",
    icon: "search",
    color: "sky",
    summary: "Gather information about the target — passively and actively — before touching it.",
    objective:
      "Build a map of the target's assets, people, technologies, and exposure using open sources and light probing.",
  },
  {
    slug: "scanning",
    order: 2,
    name: "Scanning & Enumeration",
    icon: "radar",
    color: "violet",
    summary: "Discover live hosts, open ports, services, versions, and misconfigurations.",
    objective:
      "Turn the recon map into concrete attack surface: what's running, which versions, and where the weak spots are.",
  },
  {
    slug: "gaining-access",
    order: 3,
    name: "Gaining Access",
    icon: "key-round",
    color: "rose",
    summary: "Exploit the weaknesses found to get an initial foothold.",
    objective:
      "Use exploits, credential attacks, and web/app vulnerabilities to obtain access — always within scope.",
  },
  {
    slug: "maintaining-access",
    order: 4,
    name: "Maintaining Access",
    icon: "network",
    color: "amber",
    summary: "Establish stable, repeatable access and escalate privileges (post-exploitation).",
    objective:
      "Demonstrate impact: persistence, privilege escalation, lateral movement, and pivoting through the network.",
  },
  {
    slug: "covering-tracks",
    order: 5,
    name: "Covering Tracks & Reporting",
    icon: "file-text",
    color: "emerald",
    summary: "Understand anti-forensics (to defend against it) and deliver a professional report.",
    objective:
      "Learn how attackers hide — so blue teams can detect it — then document findings clearly and responsibly.",
  },
];

export const TOOLS: HackingTool[] = [
  // ── Reconnaissance ──────────────────────────────────────────
  { slug: "whois", name: "Whois", phase: "reconnaissance", category: "OSINT", tagline: "Look up domain registration and ownership records.", difficulty: "beginner", officialUrl: "https://www.whois.com/", tags: ["dns", "osint", "passive"] },
  { slug: "theharvester", name: "theHarvester", phase: "reconnaissance", category: "OSINT", tagline: "Gather emails, subdomains, and hosts from public sources.", difficulty: "beginner", officialUrl: "https://github.com/laramies/theHarvester", tags: ["email", "subdomains", "osint"] },
  { slug: "recon-ng", name: "Recon-ng", phase: "reconnaissance", category: "Framework", tagline: "Modular web reconnaissance framework with a Metasploit-like console.", difficulty: "intermediate", officialUrl: "https://github.com/lanmaster53/recon-ng", tags: ["framework", "osint"] },
  { slug: "maltego", name: "Maltego", phase: "reconnaissance", category: "OSINT", tagline: "Visual link-analysis for mapping relationships between entities.", difficulty: "intermediate", officialUrl: "https://www.maltego.com/", tags: ["osint", "graph", "visual"] },
  { slug: "shodan", name: "Shodan", phase: "reconnaissance", category: "OSINT", tagline: "Search engine for internet-connected devices and services.", difficulty: "beginner", officialUrl: "https://www.shodan.io/", tags: ["osint", "iot", "search"] },
  { slug: "amass", name: "OWASP Amass", phase: "reconnaissance", category: "Enumeration", tagline: "In-depth subdomain enumeration and attack-surface mapping.", difficulty: "intermediate", officialUrl: "https://github.com/owasp-amass/amass", tags: ["subdomains", "dns"] },
  { slug: "sublist3r", name: "Sublist3r", phase: "reconnaissance", category: "Enumeration", tagline: "Fast subdomain enumeration using search engines.", difficulty: "beginner", officialUrl: "https://github.com/aboul3la/Sublist3r", tags: ["subdomains", "dns"] },
  { slug: "dnsenum", name: "DNSenum", phase: "reconnaissance", category: "DNS", tagline: "Enumerate DNS info: records, subdomains, zone transfers.", difficulty: "beginner", officialUrl: "https://github.com/fwaeytens/dnsenum", tags: ["dns"] },
  { slug: "google-dorking", name: "Google Dorking", phase: "reconnaissance", category: "OSINT", tagline: "Advanced search operators to surface exposed files and pages.", difficulty: "beginner", officialUrl: "https://www.exploit-db.com/google-hacking-database", tags: ["osint", "search", "passive"] },

  // ── Scanning & Enumeration ──────────────────────────────────
  { slug: "nmap", name: "Nmap", phase: "scanning", category: "Port Scanner", tagline: "The industry-standard network mapper and port/service scanner.", difficulty: "beginner", officialUrl: "https://nmap.org/", tags: ["ports", "services", "scanning"] },
  { slug: "masscan", name: "Masscan", phase: "scanning", category: "Port Scanner", tagline: "Internet-scale port scanner — extremely fast SYN scanning.", difficulty: "intermediate", officialUrl: "https://github.com/robertdavidgraham/masscan", tags: ["ports", "fast"] },
  { slug: "nessus", name: "Nessus", phase: "scanning", category: "Vuln Scanner", tagline: "Comprehensive commercial vulnerability scanner.", difficulty: "intermediate", officialUrl: "https://www.tenable.com/products/nessus", tags: ["vulnerability", "scanner"] },
  { slug: "openvas", name: "OpenVAS / GVM", phase: "scanning", category: "Vuln Scanner", tagline: "Open-source vulnerability scanning framework.", difficulty: "intermediate", officialUrl: "https://www.openvas.org/", tags: ["vulnerability", "scanner", "open-source"] },
  { slug: "nikto", name: "Nikto", phase: "scanning", category: "Web Scanner", tagline: "Web server scanner for known vulnerabilities and misconfigs.", difficulty: "beginner", officialUrl: "https://github.com/sullo/nikto", tags: ["web", "scanner"] },
  { slug: "gobuster", name: "Gobuster", phase: "scanning", category: "Content Discovery", tagline: "Brute-force directories, files, DNS subdomains, and vhosts.", difficulty: "beginner", officialUrl: "https://github.com/OJ/gobuster", tags: ["web", "fuzzing", "directories"] },
  { slug: "enum4linux", name: "enum4linux", phase: "scanning", category: "SMB Enumeration", tagline: "Enumerate SMB shares, users, and policies on Windows/Samba.", difficulty: "intermediate", officialUrl: "https://github.com/CiscoCXSecurity/enum4linux", tags: ["smb", "windows", "enumeration"] },
  { slug: "wpscan", name: "WPScan", phase: "scanning", category: "Web Scanner", tagline: "WordPress vulnerability scanner (plugins, themes, users).", difficulty: "beginner", officialUrl: "https://wpscan.com/", tags: ["web", "wordpress"] },
  { slug: "netdiscover", name: "Netdiscover", phase: "scanning", category: "Host Discovery", tagline: "Active/passive ARP reconnaissance to find live hosts on a LAN.", difficulty: "beginner", officialUrl: "https://github.com/netdiscover-scanner/netdiscover", tags: ["arp", "lan", "discovery"] },

  // ── Gaining Access ──────────────────────────────────────────
  { slug: "metasploit", name: "Metasploit Framework", phase: "gaining-access", category: "Exploitation", tagline: "The most widely used exploitation framework.", difficulty: "intermediate", officialUrl: "https://www.metasploit.com/", tags: ["exploit", "framework", "payloads"] },
  { slug: "sqlmap", name: "sqlmap", phase: "gaining-access", category: "Web Exploitation", tagline: "Automated SQL injection detection and exploitation.", difficulty: "intermediate", officialUrl: "https://sqlmap.org/", tags: ["web", "sqli", "database"] },
  { slug: "burp-suite", name: "Burp Suite", phase: "gaining-access", category: "Web Proxy", tagline: "The go-to web application testing proxy and scanner.", difficulty: "intermediate", officialUrl: "https://portswigger.net/burp", tags: ["web", "proxy", "intercept"] },
  { slug: "hydra", name: "Hydra", phase: "gaining-access", category: "Password Attack", tagline: "Fast network login brute-forcer across many protocols.", difficulty: "beginner", officialUrl: "https://github.com/vanhauser-thc/thc-hydra", tags: ["brute-force", "passwords", "network"] },
  { slug: "john", name: "John the Ripper", phase: "gaining-access", category: "Password Cracking", tagline: "Classic offline password hash cracker.", difficulty: "intermediate", officialUrl: "https://www.openwall.com/john/", tags: ["hashes", "cracking", "offline"] },
  { slug: "hashcat", name: "Hashcat", phase: "gaining-access", category: "Password Cracking", tagline: "GPU-accelerated, high-performance hash cracker.", difficulty: "advanced", officialUrl: "https://hashcat.net/hashcat/", tags: ["hashes", "gpu", "cracking"] },
  { slug: "aircrack-ng", name: "Aircrack-ng", phase: "gaining-access", category: "Wireless", tagline: "Wi-Fi security auditing suite (capture + crack WPA/WEP).", difficulty: "advanced", officialUrl: "https://www.aircrack-ng.org/", tags: ["wireless", "wifi", "cracking"] },
  { slug: "searchsploit", name: "SearchSploit / Exploit-DB", phase: "gaining-access", category: "Exploit Database", tagline: "Search a local copy of the Exploit Database from the CLI.", difficulty: "beginner", officialUrl: "https://www.exploit-db.com/searchsploit", tags: ["exploits", "cve", "database"] },
  { slug: "set", name: "Social-Engineer Toolkit (SET)", phase: "gaining-access", category: "Social Engineering", tagline: "Framework for simulating social-engineering attacks in tests.", difficulty: "intermediate", officialUrl: "https://github.com/trustedsec/social-engineer-toolkit", tags: ["phishing", "social-engineering"] },

  // ── Maintaining Access ──────────────────────────────────────
  { slug: "meterpreter", name: "Meterpreter", phase: "maintaining-access", category: "Payload", tagline: "Metasploit's in-memory post-exploitation payload.", difficulty: "intermediate", officialUrl: "https://docs.metasploit.com/docs/using-metasploit/advanced/meterpreter/meterpreter.html", tags: ["post-exploitation", "payload"] },
  { slug: "netcat", name: "Netcat", phase: "maintaining-access", category: "Networking", tagline: "The 'TCP/IP Swiss Army knife' — reverse/bind shells and more.", difficulty: "beginner", officialUrl: "https://nmap.org/ncat/", tags: ["shells", "networking"] },
  { slug: "mimikatz", name: "Mimikatz", phase: "maintaining-access", category: "Credential Access", tagline: "Extract Windows credentials from memory (privilege demo).", difficulty: "advanced", officialUrl: "https://github.com/gentilkiwi/mimikatz", tags: ["windows", "credentials"] },
  { slug: "empire", name: "PowerShell Empire", phase: "maintaining-access", category: "C2 Framework", tagline: "Post-exploitation and C2 framework for red teams.", difficulty: "advanced", officialUrl: "https://github.com/BC-SECURITY/Empire", tags: ["c2", "post-exploitation"] },
  { slug: "chisel", name: "Chisel", phase: "maintaining-access", category: "Pivoting", tagline: "Fast TCP/UDP tunnel over HTTP for pivoting through networks.", difficulty: "advanced", officialUrl: "https://github.com/jpillora/chisel", tags: ["tunneling", "pivoting"] },
  { slug: "linpeas", name: "LinPEAS / WinPEAS", phase: "maintaining-access", category: "Privilege Escalation", tagline: "Scripts that surface privilege-escalation paths on a host.", difficulty: "intermediate", officialUrl: "https://github.com/carlospolop/PEASS-ng", tags: ["privesc", "enumeration"] },

  // ── Covering Tracks & Reporting ─────────────────────────────
  { slug: "log-analysis", name: "Log Tampering & Detection", phase: "covering-tracks", category: "Anti-Forensics", tagline: "How attackers alter logs — and how defenders detect it.", difficulty: "advanced", officialUrl: "https://attack.mitre.org/tactics/TA0005/", tags: ["anti-forensics", "blue-team", "detection"] },
  { slug: "mitre-attack", name: "MITRE ATT&CK", phase: "covering-tracks", category: "Framework", tagline: "The knowledge base of adversary tactics and techniques.", difficulty: "intermediate", officialUrl: "https://attack.mitre.org/", tags: ["framework", "ttp", "blue-team"] },
  { slug: "dradis", name: "Dradis", phase: "covering-tracks", category: "Reporting", tagline: "Collaboration and reporting platform for security teams.", difficulty: "beginner", officialUrl: "https://dradisframework.com/", tags: ["reporting", "collaboration"] },
  { slug: "faraday", name: "Faraday", phase: "covering-tracks", category: "Reporting", tagline: "Collaborative pentest platform that aggregates tool output.", difficulty: "intermediate", officialUrl: "https://faradaysec.com/", tags: ["reporting", "management"] },
];

export function getPhases(): HackingPhase[] {
  return [...PHASES].sort((a, b) => a.order - b.order);
}

export function getToolsForPhase(phaseSlug: string): HackingTool[] {
  return TOOLS.filter((t) => t.phase === phaseSlug);
}

export function findTool(slug: string): HackingTool | undefined {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return undefined;
  return GUIDE_FOCUS[slug] ? { ...tool, guideFocus: GUIDE_FOCUS[slug] } : tool;
}

export function findPhase(slug: string): HackingPhase | undefined {
  return PHASES.find((p) => p.slug === slug);
}
