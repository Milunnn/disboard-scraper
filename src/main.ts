import { Actor } from 'apify';
import { CheerioCrawler, KeyValueStore } from 'crawlee';
import { initForKeyword } from './helpers.js';
import { router } from './routes.js';
import { serverStore } from './stores/server-store.js';
import { InputSearch } from './types.js';

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
    
    // Overrides
    ...((await KeyValueStore.getInput()) || {}) as Partial<InputSearch> & Pick<InputSearch, "keywords"> // Keywords is required
};
export const keyValueStore = await Actor.openKeyValueStore(input.sessionId || undefined);
export const dataset = await Actor.openDataset(input.sessionId || undefined);


await serverStore.initStore(keyValueStore, -1);

const crawler = new CheerioCrawler({
    requestHandler: router,
    failedRequestHandler: () => {

    },
    proxyConfiguration: await Actor.createProxyConfiguration({
        groups: ['RESIDENTIAL']
    }),
    useSessionPool: true,
    sessionPoolOptions: {
        sessionOptions: {
            maxUsageCount: 5,
            maxErrorScore: 1
        }
    },
    maxRequestRetries: 10,
    requestQueue: await Actor.openRequestQueue(input.sessionId || undefined) // Handle the session ID
});

for (const keyword of input.keywords) {
    await initForKeyword(crawler, {
        ...input,
        page: input.startPageNumber || 1,
        keyword
    }, keyword);
}


console.log("Starting crawler...");
await crawler.run();
console.log("Crawler has finished its queue.");

await Actor.exit();