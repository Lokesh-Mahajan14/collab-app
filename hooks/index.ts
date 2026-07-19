"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, Task, Notification } from "@/types";

// ─── useLocalStorage ─────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      console.warn(`Error reading localStorage key "${key}"`);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        console.warn(`Error setting localStorage key "${key}"`);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

// ─── useDebounce ─────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useKeyboard ─────────────────────────────────────────────────
export function useKeyboard(
  key: string,
  callback: () => void,
  meta = false
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (meta && !e.metaKey && !e.ctrlKey) return;
      if (e.key === key) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, meta]);
}

// ─── useProjects ─────────────────────────────────────────────────
interface UseProjectsOptions {
  workspaceId?: string;
}

export function useProjects({ workspaceId }: UseProjectsOptions = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch(
        `/api/projects?workspaceId=${workspaceId}`
      );
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createProject = useCallback(
    async (payload: Pick<Project, "name" | "description" | "emoji" | "coverColor">) => {
      const res = await window.fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = await res.json();
      setProjects((prev) => [data.data, ...prev]);
      return data.data as Project;
    },
    [workspaceId]
  );

  return { projects, loading, error, refetch: fetch, createProject };
}

// ─── useTasks ────────────────────────────────────────────────────
interface UseTasksOptions {
  projectId?: string;
  assigneeId?: string;
}

export function useTasks({ projectId, assigneeId }: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (assigneeId) params.set("assigneeId", assigneeId);

    try {
      const res = await window.fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId, assigneeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const res = await window.fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update task");
    const data = await res.json();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data.data } : t))
    );
    return data.data as Task;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const res = await window.fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete task");
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, refetch: fetchTasks, updateTask, deleteTask };
}

// ─── useNotifications ────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    await window.fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await window.fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}

// ─── useMediaQuery ───────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
