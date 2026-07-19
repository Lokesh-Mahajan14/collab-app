import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getInitials } from "@/lib/utils";
import type { User } from "@/types";

// ─── Badge ───────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline:
          "border-border text-foreground bg-transparent",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// ─── Avatar ──────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
];

function getAvatarColor(seed: string | null | undefined): string {
  const seedStr = seed || "user";
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

interface AvatarProps {
  user: Pick<User, "name" | "image" | "email">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTooltip?: boolean;
}

const AVATAR_SIZE = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-14 h-14 text-lg",
};

export function Avatar({ user, size = "md", className }: AvatarProps) {
  const initials = getInitials(user.name);
  const colorClass = getAvatarColor(user.email || user.name);

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name ?? "User"}
        className={cn(
          "rounded-full object-cover ring-2 ring-background",
          AVATAR_SIZE[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold ring-2 ring-background flex-shrink-0",
        AVATAR_SIZE[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
}: {
  users: Pick<User, "name" | "image" | "email">[];
  max?: number;
  size?: AvatarProps["size"];
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex -space-x-2 items-center">
      {visible.map((user) => (
        <Avatar key={user.email} user={user} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold bg-muted text-muted-foreground ring-2 ring-background text-[10px]",
            AVATAR_SIZE[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4 animate-spin text-muted-foreground", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Empty state ─────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus-visible:ring-red-500",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = "Input";

// ─── Textarea ────────────────────────────────────────────────────
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ─── Select ──────────────────────────────────────────────────────
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

// ─── Label ───────────────────────────────────────────────────────
export function Label({
  children,
  htmlFor,
  className,
  required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

// ─── Divider ─────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) {
    return <div className="h-px bg-border w-full" />;
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
