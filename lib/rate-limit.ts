import { redis } from './redis';

interface RateLimitResult {
    success: boolean;
    count: number;
}

/**
 * Checks if an identifier has exceeded the rate limit.
 * @param identifier Unique identifier for the user/IP/resource
 * @param limit Max number of requests allowed
 * @param windowSeconds Time window in seconds
 * @returns {Promise<RateLimitResult>}
 */
export async function checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;

    // Atomically increment and set expiry if it's a new key
    // Using a simple pipeline to ensure commands are sent together
    // However, to conditionally expire only on the first increment strictly atomically requires Lua
    // But for a simple effective rate limiter, we can use the result of increment.
    
    // Efficient Lua script to atomically increment and set expiry if not exists
    const script = `
        var current = redis.call("INCR", KEYS[1])
        if tonumber(current) == 1 then
            redis.call("EXPIRE", KEYS[1], ARGV[1])
        end
        return current
    `;

    try {
        const count = (await redis.eval(script, 1, key, windowSeconds)) as number;

        return {
            success: count <= limit,
            count: count,
        };
    } catch (error) {
        console.error('Rate Limit Error (Fail-Open):', error);
        // Fail-open strategy: Allow traffic if rate limiter fails
        return {
            success: true,
            count: 0,
        };
    }
}
