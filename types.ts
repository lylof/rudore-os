export enum Status {
  GROWTH = 'Croissance',
  DEVELOPMENT = 'Développement',
  MVP = 'MVP',
  PLANNING = 'Planification',
  ACTIVE = 'Actif'
}

export enum Department {
  DESIGN = 'Design',
  MARKETING = 'Marketing & Com',
  TECH = 'Tech & Dév',
  R_AND_D = 'R&D',
  MANAGEMENT = 'Management'
}

export enum Level {
  JUNIOR = 'Junior',
  CONFIRMED = 'Confirmé',
  SENIOR = 'Senior',
  EXPERT = 'Expert'
}

export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
}

export interface Wallet {
  totalPoints: number;
  currentMonthPoints: number;
  equityValue: number; // Estimated value in XOF
}

export interface Member {
  id: string;
  name: string;
  email: string; // Added email for login
  role: string; // Rider Role
  department: Department;
  avatarInitials: string;
  level: Level;
  skills: Skill[]; // Updated to detailed skills
  availability: number; // 0 to 100 percentage
  wallet: Wallet;
  isLead?: boolean;
  bio?: string; // Added bio
  academicRole?: string; // Added academic/external role
  externalRole?: string; // Added external role (e.g. Accountant)
  isAdmin?: boolean; // Admin role
  accessRoleId?: string; // Links to AccessRole.id
  joinedAt: string; // ISO Date for vesting calculation
  permissions?: string[]; // List of allowed ViewStates (e.g. ['DASHBOARD', 'STUDIO'])
  hasLPT?: boolean; // Liquidity Preference Token holder
}

export interface ProjectFinancials {
  budget: number;
  spent: number;
  revenue: number;
  equityPool: number; // Percentage of project shares allocated to the team
}

export interface ProjectRoadmapStep {
  phase: string;
  status: 'DONE' | 'IN_PROGRESS' | 'TODO';
  date: string;
}

export interface KillGateThresholds {
  budgetOverrunEnabled: boolean;
  delayEnabled: boolean;
  delayDaysThreshold: number;
  revenueStagnationEnabled: boolean;
  revenueStagnationMonths: number;
}

export interface Project {
  id: string;
  name: string;
  type: 'STUDIO' | 'AGENCY';
  status: Status;
  leadId: string;
  deadline?: string;
  description: string;
  squadIds: string[]; // Member IDs
  financials: ProjectFinancials;
  roadmap: ProjectRoadmapStep[];
}

export interface Action {
  id: string;
  taskName: string;
  project: string;
  points: number;
  status: 'PENDING' | 'VALIDATED';
  date: string;
  assigneeId: string;
}

// --- KANBAN & POINTS SYSTEM TYPES ---

export enum TaskComplexity {
  VERY_SIMPLE = 'VERY_SIMPLE',
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  COMPLEX = 'COMPLEX',
  VERY_COMPLEX = 'VERY_COMPLEX',
  CRITICAL = 'CRITICAL',
}

export enum QualityRating {
  REFUSED = 'REFUSED',
  ACCEPTABLE = 'ACCEPTABLE',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT',
  EXCEPTIONAL = 'EXCEPTIONAL',
}

export enum KanbanTaskStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  VALIDATED = 'VALIDATED',
  ARCHIVED = 'ARCHIVED',
}

export const COMPLEXITY_LABELS: Record<TaskComplexity, string> = {
  [TaskComplexity.VERY_SIMPLE]: 'Très Simple',
  [TaskComplexity.SIMPLE]: 'Simple',
  [TaskComplexity.MEDIUM]: 'Moyen',
  [TaskComplexity.COMPLEX]: 'Complexe',
  [TaskComplexity.VERY_COMPLEX]: 'Très Complexe',
  [TaskComplexity.CRITICAL]: 'Critique',
};

export const QUALITY_LABELS: Record<QualityRating, string> = {
  [QualityRating.REFUSED]: 'Refusé',
  [QualityRating.ACCEPTABLE]: 'Acceptable',
  [QualityRating.GOOD]: 'Bon',
  [QualityRating.EXCELLENT]: 'Excellent',
  [QualityRating.EXCEPTIONAL]: 'Exceptionnel',
};

export const KANBAN_STATUS_LABELS: Record<KanbanTaskStatus, string> = {
  [KanbanTaskStatus.BACKLOG]: 'Backlog',
  [KanbanTaskStatus.IN_PROGRESS]: 'En Cours',
  [KanbanTaskStatus.REVIEW]: 'Review',
  [KanbanTaskStatus.VALIDATED]: 'Validé',
  [KanbanTaskStatus.ARCHIVED]: 'Archivé',
};

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  projectId: string;       // links to Project.id or project name
  assigneeId: string;      // links to Member.id
  status: KanbanTaskStatus;
  complexity: TaskComplexity;
  qualityRating?: QualityRating; // set during Review/Validation
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  tags?: string[];
}

export interface PointsConfig {
  basePoints: Record<TaskComplexity, number>;
  qualityMultipliers: Record<QualityRating, number>;
  roleMultipliers: Record<string, number>; // keyed by Level enum value
  bonusPercentage: number;       // % of agency revenue allocated to bonuses
  equityPoolPercentage: number;  // Builder equity pool %
  vestingMonths: number;
  cliffMonths: number;
  agencyMonthlyRevenue: number;  // in FCFA, for bonus calculation
  studioFundPercentage: number;   // 20% to Studio Fund
  agencyOpsPercentage: number;    // 80% to Operations
  killGateThresholds: KillGateThresholds;
}

export type ViewState = 'DASHBOARD' | 'STUDIO' | 'AGENCY' | 'SQUADS' | 'TALENTS' | 'CONTRIBUTIONS' | 'SETTINGS' | 'PROFILE' | 'KANBAN';

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_STUDIO'
  | 'VIEW_AGENCY'
  | 'VIEW_SQUADS'
  | 'VIEW_TALENTS'
  | 'VIEW_CONTRIBUTIONS'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_ROLES'
  | 'MANAGE_USERS';

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}