import type { LucideIcon } from "lucide-react";
import { Workflow, Network, SquareTerminal } from "lucide-react";

import { DEVOPS_TOOLS } from "./devops-tools";

export interface LabCheckpoint {
  id: string;
  label: string;
}

export interface Lab {
  id: string;
  name: string;
  /** Short card copy. */
  description: string;
  /** Longer overview shown on the lab's own page. */
  intro: string;
  icon: LucideIcon;
  color: string;
  objectives: string[];
  checkpoints: LabCheckpoint[];
}

function toolMeta(id: string) {
  const tool = DEVOPS_TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return { icon: tool.icon, color: tool.color };
}

// Labs is the academy: real instructional content (objectives + a
// self-reported checkpoint checklist) paired with the same real
// interactive terminal Playgrounds uses. No quiz engine yet — grading
// free-form answers correctly is a real content/grading system in its
// own right, not something worth faking with a trivial multiple-choice
// stub.
export const LABS: Lab[] = [
  {
    id: "linux",
    name: "Linux",
    description: "Navigate the filesystem, permissions, and processes in a real Ubuntu shell.",
    intro:
      "Get comfortable in a real Ubuntu shell: navigating the filesystem, managing files and permissions, and running processes — the foundation every other lab builds on.",
    ...toolMeta("linux"),
    objectives: [
      "Navigate the filesystem with cd, ls, and pwd",
      "Create, move, and permission files with chmod/chown",
      "Manage running processes with ps and kill",
      "Redirect output and chain commands with pipes",
    ],
    checkpoints: [
      { id: "first-commands", label: "Run your first five shell commands" },
      { id: "mkdir-tree", label: "Create a directory structure three levels deep" },
      { id: "chmod-chown", label: "Change a file's permissions and ownership" },
      { id: "kill-process", label: "Find and kill a running process" },
    ],
  },
  {
    id: "docker",
    name: "Docker",
    description: "Install Docker from scratch, then build, run, and network real containers.",
    intro:
      "Install Docker for real, then build, run, and network your own containers — no pre-baked image, just you and a fresh Ubuntu box.",
    ...toolMeta("docker"),
    objectives: [
      "Install Docker Engine from scratch",
      "Run and inspect your first container",
      "Write a Dockerfile and build a custom image",
      "Connect two containers over a Docker network",
    ],
    checkpoints: [
      { id: "install", label: "Install Docker with the official script" },
      { id: "run", label: "Run hello-world and a detached container" },
      { id: "build", label: "Build an image from a Dockerfile" },
      { id: "volume", label: "Persist data with a named volume" },
    ],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Install kubectl and a local cluster to learn how Kubernetes schedules workloads.",
    intro:
      "Install kubectl and stand up a lightweight local cluster to learn how Kubernetes schedules, exposes, and scales workloads.",
    ...toolMeta("kubernetes"),
    objectives: [
      "Install kubectl and a local cluster (kind/minikube)",
      "Deploy a pod and a Deployment",
      "Expose a service internally and externally",
      "Scale a Deployment and watch rollout behavior",
    ],
    checkpoints: [
      { id: "install-kubectl", label: "Install kubectl" },
      { id: "local-cluster", label: "Bring up a local cluster" },
      { id: "first-pod", label: "Deploy your first pod" },
      { id: "expose", label: "Expose it with a Service" },
    ],
  },
  {
    id: "aws",
    name: "AWS",
    description: "Install and configure the AWS CLI, then practice S3, EC2, and IAM.",
    intro:
      "Install and configure the AWS CLI, then practice the commands you'll actually use day to day: S3, EC2, and IAM.",
    ...toolMeta("aws"),
    objectives: [
      "Install and configure the AWS CLI",
      "List and manage S3 buckets from the CLI",
      "Describe and tag EC2 instances",
      "Understand IAM users, roles, and policies",
    ],
    checkpoints: [
      { id: "install", label: "Install the AWS CLI" },
      { id: "configure", label: "Run aws configure" },
      { id: "s3-list", label: "List an S3 bucket's contents" },
      { id: "iam-describe", label: "Describe your account's IAM users" },
    ],
  },
  {
    id: "terraform",
    name: "Terraform",
    description: "Install Terraform and run the init / plan / apply / destroy loop for real.",
    intro:
      "Install Terraform and write your first configuration — init, plan, apply, destroy — the loop you'll repeat for every piece of infrastructure you ever manage.",
    ...toolMeta("terraform"),
    objectives: [
      "Install Terraform from HashiCorp's official repo",
      "Write a basic .tf configuration",
      "Run init, plan, and apply",
      "Manage and destroy state safely",
    ],
    checkpoints: [
      { id: "install", label: "Install Terraform" },
      { id: "first-resource", label: "Write your first resource block" },
      { id: "plan", label: "Run terraform plan" },
      { id: "apply-destroy", label: "Apply and then destroy your infrastructure" },
    ],
  },
  {
    id: "ansible",
    name: "Ansible",
    description: "Install Ansible and write a playbook that configures a machine reliably.",
    intro:
      "Install Ansible and write a playbook that configures a machine the same way, every time — no manual steps, no drift.",
    ...toolMeta("ansible"),
    objectives: [
      "Install Ansible",
      "Understand inventories and modules",
      "Write and run your first playbook",
      "Use variables and handlers",
    ],
    checkpoints: [
      { id: "install", label: "Install Ansible" },
      { id: "inventory", label: "Define a local inventory" },
      { id: "first-playbook", label: "Run your first playbook" },
      { id: "handler", label: "Add a handler triggered by a task" },
    ],
  },
  {
    id: "jenkins",
    name: "Jenkins",
    description: "Install Jenkins from scratch and build your first CI pipeline.",
    intro:
      "Install Jenkins from scratch and build your first pipeline — the same install flow you'd run on a real CI server.",
    ...toolMeta("jenkins"),
    objectives: [
      "Install Java and Jenkins from the official repo",
      "Unlock and configure Jenkins",
      "Create a freestyle job",
      "Write a basic declarative Jenkinsfile",
    ],
    checkpoints: [
      { id: "install", label: "Install Jenkins" },
      { id: "setup-wizard", label: "Complete the setup wizard" },
      { id: "first-job", label: "Run your first job" },
      { id: "jenkinsfile", label: "Write a Jenkinsfile with two stages" },
    ],
  },
  {
    id: "git",
    name: "Git",
    description: "Branch, merge, resolve conflicts, and work with remotes like an engineer.",
    intro:
      "Git is already on your machine — this lab is about using it like an engineer: branching, merging, and resolving conflicts with confidence.",
    ...toolMeta("git"),
    objectives: [
      "Initialize a repo and make your first commits",
      "Branch, merge, and resolve a conflict",
      "Understand rebase vs. merge",
      "Work with remotes: push, pull, fetch",
    ],
    checkpoints: [
      { id: "first-commits", label: "Make your first three commits" },
      { id: "branch-merge", label: "Create a branch and merge it back" },
      { id: "conflict", label: "Deliberately cause and resolve a merge conflict" },
      { id: "remote", label: "Push to a remote" },
    ],
  },
  {
    id: "cicd",
    name: "CI/CD",
    description: "Tie source control, builds, tests, and deploys into one pipeline.",
    intro:
      "Tie the pieces together: source control, automated builds, tests, and deployment — the pipeline concept that sits behind every tool you've installed so far.",
    icon: Workflow,
    color: "#14B8A6",
    objectives: [
      "Understand the stages of a CI/CD pipeline",
      "Trigger a build on every push",
      "Run automated tests in a pipeline",
      "Automate a deployment step",
    ],
    checkpoints: [
      { id: "diagram", label: "Diagram a basic pipeline" },
      { id: "trigger", label: "Configure a build trigger" },
      { id: "test-stage", label: "Add a test stage" },
      { id: "deploy-stage", label: "Add a deploy stage" },
    ],
  },
  {
    id: "networking",
    name: "Networking",
    description: "IP addressing, DNS, ports, and how containers actually talk to each other.",
    intro:
      "Learn the networking fundamentals every DevOps engineer needs: IP addressing, DNS, ports, and how containers and services actually talk to each other.",
    icon: Network,
    color: "#3B82F6",
    objectives: [
      "Understand IP addressing and subnets",
      "Resolve and debug DNS",
      "Inspect open ports and running services",
      "Trace how a request reaches a container",
    ],
    checkpoints: [
      { id: "interfaces", label: "Inspect your container's network interfaces" },
      { id: "dns", label: "Resolve a domain with dig or nslookup" },
      { id: "ports", label: "Check open ports with ss or netstat" },
      { id: "trace", label: "Trace a request with curl -v" },
    ],
  },
  {
    id: "bash-scripting",
    name: "Bash Scripting",
    description: "Move from typing commands to writing real, reusable automation scripts.",
    intro:
      "Move from typing commands one at a time to writing real scripts: variables, conditionals, loops, and functions that automate the boring parts of the job.",
    icon: SquareTerminal,
    color: "#84CC16",
    objectives: [
      "Write a script with variables and arguments",
      "Use conditionals and exit codes",
      "Loop over files and command output",
      "Write reusable functions",
    ],
    checkpoints: [
      { id: "first-script", label: "Write and run your first script" },
      { id: "conditional", label: "Add an if/else based on an exit code" },
      { id: "loop", label: "Loop over a directory of files" },
      { id: "function", label: "Extract a block into a reusable function" },
    ],
  },
];

export function getLabById(id: string): Lab | undefined {
  return LABS.find((lab) => lab.id === id);
}
