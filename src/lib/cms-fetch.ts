// The CMS runs on shared hosting and a burst of requests pushes it into its
// memory and CPU limits, where it answers 503. So a production build sends one
// request at a time, fetches each URL once, and waits and retries when the CMS
// is struggling. Dev keeps plain fetches so edits in WordPress show up on reload.

const REQUEST_TIMEOUT_MS = 60_000;
const RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 40_000];

const responses = new Map<string, Promise<Response>>();
let queue: Promise<unknown> = Promise.resolve();

const headers = { Accept: "application/json" };

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The fetch helpers fall back to demo content when a request fails, and nothing
 * in the built HTML gives that away. Stop the build so demo content can't reach
 * the live site. Local builds without a CMS can opt out with
 * ALLOW_UNREACHABLE_CMS=1.
 */
function stopBuild(url: string, reason: string): void {
    const message = `CMS request failed: ${reason} - ${url}`;
    if (process.env.ALLOW_UNREACHABLE_CMS === "1") {
        console.warn(`${message} (continuing: ALLOW_UNREACHABLE_CMS=1)`);
        return;
    }
    console.error(`${message}\nStopping the build so demo content can't ship.`);
    process.exit(1);
}

async function fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
        let reason: string;
        try {
            const response = await fetch(url, {
                headers,
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
            // 404 is an answer: callers treat it as "doesn't exist".
            if (response.ok || response.status === 404) return response;
            reason = `HTTP ${response.status}`;
            const canRetry = response.status === 429 || response.status >= 500;
            if (!canRetry || attempt >= RETRY_DELAYS_MS.length) {
                stopBuild(url, reason);
                return response;
            }
        } catch (error) {
            reason = error instanceof Error ? error.message : String(error);
            if (attempt >= RETRY_DELAYS_MS.length) {
                stopBuild(url, reason);
                throw error;
            }
        }

        const delay = RETRY_DELAYS_MS[attempt];
        console.warn(`CMS request failed (${reason}); retrying in ${delay / 1000}s - ${url}`);
        await wait(delay);
    }
}

export function cmsFetch(url: string): Promise<Response> {
    if (!import.meta.env.PROD) return fetch(url, { headers });

    let response = responses.get(url);
    if (!response) {
        response = queue.then(() => fetchWithRetry(url));
        // A failed request must not block the ones queued behind it.
        queue = response.catch(() => undefined);
        responses.set(url, response);
    }
    // Each caller reads its own copy of the body.
    return response.then((result) => result.clone());
}
