import type { LucideIcon } from "lucide-react";
import { Anchor, Braces, Package } from "lucide-react";

import { DEVOPS_TOOLS } from "./devops-tools";

export interface MarketplaceTool {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  /** Real shell command, sent verbatim into the live terminal session. */
  command: string;
  preinstalled?: boolean;
}

function toolMeta(id: string) {
  const tool = DEVOPS_TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return { icon: tool.icon, color: tool.color };
}

// The full DevOps toolchain — Docker (+ Compose), Git, curl/wget, Nano/Vim,
// unzip, jq, Python3/pip, Node/npm, AWS CLI, kubectl, Helm, Terraform,
// Ansible — is baked into the base image at build time now (see
// server/docker/base-image/Dockerfile), not installed live on first use.
// A container-startup toolchain install was the wrong trade-off for a
// platform whose whole premise is "real workstation": every session would
// have paid apt/curl-CDN latency (and been at the mercy of those mirrors
// being reachable at that exact moment) for tools most learners expect to
// just be there, the same way they are on a real machine. `preinstalled`
// entries below show as "Included" with no button; their `command` is a
// harmless, non-mutating version check, not an install step. What's left
// installable on demand is genuinely optional/heavy tooling (Jenkins) or
// extra utilities beyond the required baseline (htop/tree/net-tools).
export const MARKETPLACE_TOOLS: MarketplaceTool[] = [
  {
    id: "docker",
    name: "Docker + Compose",
    ...toolMeta("docker"),
    command: "docker --version && docker compose version",
    preinstalled: true,
  },
  {
    id: "kubernetes",
    name: "Kubernetes (kubectl)",
    ...toolMeta("kubernetes"),
    command: "kubectl version --client",
    preinstalled: true,
  },
  {
    id: "terraform",
    name: "Terraform",
    ...toolMeta("terraform"),
    command: "terraform version",
    preinstalled: true,
  },
  {
    id: "ansible",
    name: "Ansible",
    ...toolMeta("ansible"),
    command: "ansible --version",
    preinstalled: true,
  },
  {
    id: "jenkins",
    name: "Jenkins",
    ...toolMeta("jenkins"),
    command:
      'apt-get update && apt-get install -y openjdk-17-jre gnupg && curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | gpg --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg && echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list && apt-get update && apt-get install -y jenkins',
  },
  {
    id: "helm",
    name: "Helm",
    icon: Anchor,
    color: "#0F1689",
    command: "helm version",
    preinstalled: true,
  },
  {
    id: "git",
    name: "Git",
    ...toolMeta("git"),
    command: "git --version",
    preinstalled: true,
  },
  {
    id: "python",
    name: "Python 3 + pip",
    icon: Braces,
    color: "#3776AB",
    command: "python3 --version && pip3 --version",
    preinstalled: true,
  },
  {
    id: "node",
    name: "Node.js + npm",
    icon: Package,
    color: "#5FA04E",
    command: "node --version && npm --version",
    preinstalled: true,
  },
  {
    id: "linux-tools",
    name: "Extra Linux Tools",
    ...toolMeta("linux"),
    // vim/unzip/jq/nano are already in the base image — this installs the
    // handful of genuinely optional extras (system monitoring, tree view,
    // legacy net-tools) that most workstations don't ship with by default
    // either.
    command: "apt-get update && apt-get install -y htop tree net-tools",
  },
  {
    id: "aws-cli",
    name: "AWS CLI",
    ...toolMeta("aws"),
    command: "aws --version",
    preinstalled: true,
  },
];
