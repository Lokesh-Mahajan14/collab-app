import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

// Reusable rate limiters
export const inviteRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 invites per minute
      analytics: true,
      prefix: "@collab/invites",
    })
  : null;

export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 uploads per minute
      analytics: true,
      prefix: "@collab/uploads",
    })
  : null;

export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 login attempts per minute
      analytics: true,
      prefix: "@collab/auth",
    })
  : null;

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  if (!limiter) {
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open if Redis has a network hiccup
    return { success: true };
  }
}
