import type { LucideIcon } from "lucide-react";
import {
  Container,
  Boxes,
  Cloud,
  Layers,
  Compass,
  Wrench,
  GitBranch,
  TerminalSquare,
} from "lucide-react";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface DevOpsTool {
  id: string;
  /** Short label used in the dashboard dock, e.g. "Docker". */
  dockLabel: string;
  /** Full card title on the Playgrounds page, e.g. "Docker Playground". */
  playgroundName: string;
  description: string;
  icon: LucideIcon;
  /** Brand accent color — badge background, hover glow, dock icon tint. */
  color: string;
  estimatedStartup: string;
  difficulty: Difficulty;
  /** Static ranking used by the "Most Popular" sort on /playgrounds. */
  popularity: number;
}

// Single source of truth for every tool surfaced in the product — the
// dashboard dock and the Playgrounds grid both read from this array so
// their icon/color/copy can never drift apart.
export const DEVOPS_TOOLS: DevOpsTool[] = [
  {
    id: "docker",
    dockLabel: "Docker",
    playgroundName: "Docker Playground",
    description: "Learn containers, images, volumes and Docker networking in a safe sandbox.",
    icon: Container,
    color: "#2496ED",
    estimatedStartup: "2-3 min",
    difficulty: "Beginner",
    popularity: 98,
  },
  {
    id: "kubernetes",
    dockLabel: "Kubernetes",
    playgroundName: "Kubernetes Playground",
    description: "Deploy, manage and scale containerized applications in a Kubernetes cluster.",
    icon: Boxes,
    color: "#326CE5",
    estimatedStartup: "4-6 min",
    difficulty: "Intermediate",
    popularity: 91,
  },
  {
    id: "aws",
    dockLabel: "AWS",
    playgroundName: "AWS CLI Playground",
    description: "Practice AWS CLI commands, IAM, S3, EC2 and more in an isolated environment.",
    icon: Cloud,
    color: "#FF9900",
    estimatedStartup: "3-5 min",
    difficulty: "Beginner",
    popularity: 87,
  },
  {
    id: "terraform",
    dockLabel: "Terraform",
    playgroundName: "Terraform Playground",
    description: "Write, plan and apply infrastructure with Terraform in a safe sandbox.",
    icon: Layers,
    color: "#7B42BC",
    estimatedStartup: "4-6 min",
    difficulty: "Intermediate",
    popularity: 84,
  },
  {
    id: "linux",
    dockLabel: "Linux",
    playgroundName: "Linux Playground",
    description: "Master Linux commands, file systems, permissions and process management.",
    icon: TerminalSquare,
    color: "#FCC624",
    estimatedStartup: "1-2 min",
    difficulty: "Beginner",
    popularity: 95,
  },
  {
    id: "ansible",
    dockLabel: "Ansible",
    playgroundName: "Ansible Playground",
    description: "Automate configuration management tasks with Ansible playbooks.",
    icon: Compass,
    color: "#EE0000",
    estimatedStartup: "3-5 min",
    difficulty: "Intermediate",
    popularity: 72,
  },
  {
    id: "jenkins",
    dockLabel: "Jenkins",
    playgroundName: "Jenkins Playground",
    description: "Build CI/CD pipelines, automate builds and deployments with Jenkins.",
    icon: Wrench,
    color: "#D24939",
    estimatedStartup: "4-6 min",
    difficulty: "Advanced",
    popularity: 68,
  },
  {
    id: "git",
    dockLabel: "Git",
    playgroundName: "Git Playground",
    description: "Practice Git commands, branching, merging and collaboration workflows.",
    icon: GitBranch,
    color: "#F05032",
    estimatedStartup: "1-2 min",
    difficulty: "Beginner",
    popularity: 93,
  },
];
