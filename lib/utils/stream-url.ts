/**
 * Gets the base WebSocket URL for the video stream.
 * Prefers the passed argument, then the environment variable, then a hardcoded fallback (if acceptable).
 */
export function getStreamBaseUrl(overrideUrl?: string | null): string {
    if (overrideUrl && (overrideUrl.startsWith("ws") || overrideUrl.startsWith("http"))) {
        return overrideUrl;
    }
    return process.env.NEXT_PUBLIC_WS_URL || "wss://video-service-production-44b4.up.railway.app";
}

/**
 * Converts a WebSocket URL (ws/wss) to an HTTP URL (http/https).
 * Useful for WebRTC iframe sources.
 */
export function getHttpStreamUrl(wsUrl: string): string {
    return wsUrl.replace("wss://", "https://").replace("ws://", "http://");
}

/**
 * Converts an HTTP URL to a WebSocket URL.
 * Useful for JSMpeg players.
 */
export function getWsStreamUrl(httpUrl: string): string {
    return httpUrl.replace("https://", "wss://").replace("http://", "ws://");
}
