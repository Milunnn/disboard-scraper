import { Actor } from 'apify';
import { CheerioCrawler, KeyValueStore, log, sleep } from 'crawlee';
import { initForKeyword } from './helpers.js';
import { router } from './routes.js';
import { serverStore } from './stores/server-store.js';
import { InputSearch, RouteHandlerLabels } from './types.js';

/**
 * The plan for now:
 *      Have keywords array as the input
 *      Go through all of them
 * 
 * By keyword/tag:
 *      1) Search the keyword, use a custom URL search param so that the RequestQueue does not cache this request
 *      2) Check for redirection
 *          - If redirected, then use the Tag search URL
 *          - If not redirected, use the keyword search
 *      3) Scrape all data using given settings as the search params
 */

await Actor.init();

export const input: InputSearch = {
    // The defaults here
    startPageNumber: null,
    endPageNumber: null,
    langCode: null,
    sort: null,
    scrapeReviews: null,
    sessionId: null,
    scrapeDetail: null,
    
    // Overrides
    ...((await KeyValueStore.getInput()) || {}) as Partial<InputSearch> & Pick<InputSearch, "keywords"> // Keywords is required
};
export const keyValueStore = await Actor.openKeyValueStore(input.sessionId || undefined);
export const dataset = await Actor.openDataset(input.sessionId || undefined);


await serverStore.initStore(keyValueStore, -1);

const crawler = new CheerioCrawler({
    requestHandler: router,
    failedRequestHandler: async ({ request }) => {
        if (request.userData.label === RouteHandlerLabels.ServerReviewList && request.userData.serverData) {
            // If it crashes on reviews, push the data to the dataset anyway - even though not all were successful
            log.warning(`Failed request handler for server "${request.userData.serverData.name}" while scraping reviews. Saving the intermediate.`);
            await dataset.pushData(request.userData.serverData);
        }
    },
    errorHandler: async ({ response, session, request }) => {
        if (session && response?.statusCode == 403) {
            session.markBad();

            if ((request.retryCount + 1) % 5 == 0) {
                const waitInterval = 5000 * ((request.retryCount + 1) - 5 + 1) + Math.floor(Math.random() * 1000);
                log.info(`[BACKOFF] Waiting for ${waitInterval} ms...`);
                await sleep(waitInterval);
            }
        }
    },
    preNavigationHooks: [
        (_, got) => {
            got.headerGeneratorOptions = {
                browsers: [
                    {
                        name: 'chrome',
                        minVersion: 122,
                        maxVersion: 122,
                    }
                ],
                devices: ['desktop'],
                locales: ['en-US'],
                operatingSystems: ['linux','macos']
            };
            got.headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Host': 'disboard.org',

                'Upgrade-Insecure-Requests': '1',

            };
        }
    ],
    proxyConfiguration: await Actor.createProxyConfiguration({
        groups: ['RESIDENTIAL']
    }),
    sessionPoolOptions: {
        sessionOptions: {
            maxUsageCount: 50, 
            maxErrorScore: 1 // Heavily rate limited, need to rotate sessions (throws 403)
        }
    },
    maxRequestRetries: 20,
    requestQueue: await Actor.openRequestQueue(input.sessionId || undefined) // Handle the session ID
});

for (const keyword of input.keywords) {
    await initForKeyword(crawler, {
        ...input,
        page: input.startPageNumber || 1,
        keyword
    }, keyword);
}


log.info("Starting crawler...");
await crawler.run();
log.info("Crawler has finished its queue.");

await Actor.exit();