import {
  Brain,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "code-2": Code2,
  brain: Brain,
  "trending-up": TrendingUp,
  database: Database,
  cloud: Cloud,
  "git-branch": GitBranch,
  link: LinkIcon,
  cpu: Cpu,
};

export function DomainIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
