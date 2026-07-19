import { addDays, endOfDay, formatISO, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";

import { db } from "@/lib/db";

type TaskNoteDelegate = {
  upsert: (args: {
    where: {
      taskId_userId: {
        taskId: string;
        userId: string;
      };
    };
    create: {
      taskId: string;
      userId: string;
      content: string;
    };
    update: {
      content: string;
    };
    select: {
      id: true;
      content: true;
      createdAt: true;
      updatedAt: true;
    };
  }) => Promise<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type MyTaskStatus = "todo" | "in_progress" | "in_review" | "done" | "completed";
export type MyTaskPriority = "low" | "medium" | "high" | "urgent";

export type MyTaskNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type MyTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  workspaceName: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  latestNote: MyTaskNote | null;
};

export type MyTaskCalendarDay = {
  date: string;
  total: number;
  completed: number;
  overdue: number;
};

function normalizeStatus(status: string) {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus === "completed") {
    return "done";
  }

  return lowerStatus;
}

function toISOString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  workspace: { name: string };
  createdBy: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  notes: Array<{ id: string; content: string; createdAt: Date; updatedAt: Date }>;
}): MyTask {
  const latestNote = task.notes[0] ?? null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: normalizeStatus(task.status),
    priority: task.priority.toLowerCase(),
    dueDate: toISOString(task.dueDate),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    workspaceId: task.workspaceId,
    workspaceName: task.workspace.name,
    createdBy: task.createdBy,
    assignedTo: task.assignedTo,
    latestNote: latestNote
      ? {
          id: latestNote.id,
          content: latestNote.content,
          createdAt: latestNote.createdAt.toISOString(),
          updatedAt: latestNote.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function fetchMyTasks(workspaceId: string, userId: string) {
  const tasks = await db.task.findMany({
    where: {
      workspaceId,
      assignedToId: userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      workspaceId: true,
      workspace: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      notes: {
        where: {
          userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [
      { dueDate: "asc" },
      { updatedAt: "desc" },
    ],
  });

  return tasks.map(serializeTask);
}

export async function updateTaskStatus({
  workspaceId,
  taskId,
  userId,
  status,
}: {
  workspaceId: string;
  taskId: string;
  userId: string;
  status: string;
}) {
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      workspaceId,
      assignedToId: userId,
    },
    select: {
      id: true,
      assignedToId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const normalizedStatus = normalizeStatus(status);

  if (!["todo", "in_progress", "in_review", "done"].includes(normalizedStatus)) {
    throw new Error("Invalid task status");
  }

  return db.task.update({
    where: {
      id: taskId,
    },
    data: {
      status: normalizedStatus,
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function addTaskNote({
  workspaceId,
  taskId,
  userId,
  content,
}: {
  workspaceId: string;
  taskId: string;
  userId: string;
  content: string;
}) {
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      workspaceId,
      assignedToId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Note content is required");
  }

  return (db as typeof db & { taskNote: TaskNoteDelegate }).taskNote.upsert({
    where: {
      taskId_userId: {
        taskId,
        userId,
      },
    },
    create: {
      taskId,
      userId,
      content: trimmedContent,
    },
    update: {
      content: trimmedContent,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUpcomingDeadlines(workspaceId: string, userId: string) {
  const now = new Date();
  const nextFiveDays = addDays(now, 5);

  const tasks = await fetchMyTasks(workspaceId, userId);

  return tasks.filter((task) => {
    if (!task.dueDate) {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    const overdue = isBefore(dueDate, startOfDay(now)) && normalizeStatus(task.status) !== "done";
    const withinWindow = !isBefore(dueDate, startOfDay(now)) && !isAfter(dueDate, endOfDay(nextFiveDays));

    return overdue || withinWindow;
  });
}

export async function getTasksByDate({
  workspaceId,
  userId,
  date,
}: {
  workspaceId: string;
  userId: string;
  date: Date;
}) {
  const tasks = await fetchMyTasks(workspaceId, userId);

  return tasks.filter((task) => {
    if (!task.dueDate) {
      return false;
    }

    return isSameDay(new Date(task.dueDate), date);
  });
}

export function getTaskCompletionRatio(tasks: MyTask[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => normalizeStatus(task.status) === "done").length;

  return Math.round((completed / tasks.length) * 100);
}

export function getProductivityStreak(tasks: MyTask[]) {
  const completedDays = new Set(
    tasks
      .filter((task) => normalizeStatus(task.status) === "done")
      .map((task) => formatISO(startOfDay(new Date(task.updatedAt)), { representation: "date" }))
  );

  let streak = 0;
  let cursor = startOfDay(new Date());

  while (completedDays.has(formatISO(cursor, { representation: "date" }))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getMyTaskAnalytics(tasks: MyTask[]) {
  const now = new Date();
  const nextSevenDays = addDays(now, 7);

  const total = tasks.length;
  const inProgress = tasks.filter((task) => normalizeStatus(task.status) === "in_progress").length;
  const completed = tasks.filter((task) => normalizeStatus(task.status) === "done").length;
  const overdue = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return isBefore(dueDate, startOfDay(now)) && normalizeStatus(task.status) !== "done";
  }).length;
  const dueThisWeek = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return !isBefore(dueDate, startOfDay(now)) && !isAfter(dueDate, endOfDay(nextSevenDays));
  }).length;

  return {
    total,
    inProgress,
    completed,
    overdue,
    dueThisWeek,
  };
}
