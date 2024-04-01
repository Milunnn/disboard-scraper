import { Actor, Dataset, RequestQueue } from 'apify';
import { CheerioCrawler, KeyValueStore, RequestProvider } from 'crawlee';
import { InputSearch, RouteHandlerLabels } from './types.js';
import { router } from './routes.js';
import { initForKeyword, linkGenerators } from './helpers.js';
import { serverStore } from './stores/server-store.js';

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

export const input = ((await KeyValueStore.getInput()) || {}) as InputSearch;
export const keyValueStore = await Actor.openKeyValueStore(input.sessionId || undefined);
export const dataset = await Actor.openDataset(input.sessionId || undefined);

// Init store
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