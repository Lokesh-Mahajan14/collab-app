// ─── Auth & Users ────────────────────────────────────────────────
export type UserRole = "ADMIN" | "MANAGER" | "USER";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// ─── Workspace ───────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: Date;
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: UserRole;
  user: User;
  joinedAt: Date;
}

// ─── Projects ────────────────────────────────────────────────────
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  coverColor: string;
  emoji: string;
  workspaceId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    tasks: number;
    members: number;
  };
}

// ─── Tasks ───────────────────────────────────────────────────────
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
  assignee: User | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: User;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  taskId: string;
  uploadedById: string;
  createdAt: Date;
}

// ─── Chat ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  content: string;
  projectId: string;
  authorId: string;
  author: User;
  createdAt: Date;
}

// ─── Notifications ───────────────────────────────────────────────
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "COMMENT_ADDED"
  | "WORKSPACE_INVITE"
  | "PROJECT_CREATED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  metadata: Record<string, string>;
  createdAt: Date;
}

// ─── API Responses ───────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ─── UI State ────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type SidebarState = "expanded" | "collapsed";

export interface PresenceUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
  cursor?: { x: number; y: number };
}
