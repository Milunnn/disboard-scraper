import { Actor } from 'apify';
import { CheerioCrawler, KeyValueStore } from 'crawlee';
import { EntityType, Input, RouteLabels, ServerListSort } from './types.js';
import { router } from './routes.js';
import { linkGenerators } from './helpers.js';

/**
 * The plan
 * 
 * What functionality to implement:
 *      1) Search
 *          - keyword search - somehow does not show all of the results (maybe a faulty search algo)
 *          - Filter for languages
 *          - Sort
 *          - Paging
 *      2) Server list PRIMARY
 *          - by tags and categories
 *          - firstly could create another endpoint to just scrape the tags/categories? (idk - probably would only scrape popular tags)
 *          - Filter for languages
 *          - Sort
 *          - Paging
 *          - ISSUE - it limits the number of pages that are accessible to 50 per tag
 *      3) Suggestion extractor
 *          - would return all of the tags and count of servers with the current tag
 *          - the endpoint internally limits the amount of results to 5
 *          - probably some depth-first algorithm (a->aa, ab, ac->aca, acb...)
 *      2) Detail - extract data
 *          - member count (currently online/total)
 *          - name
 *          - category
 *          - tags
 *          - description
 *          - bumped datetime (probably convert it into iso)
 *          - server image
 *          - language
 *          - extract the join link (but not the discord invite link - that could expire, if the Disboard bot actually generates the invite - TODO figure it out)
 *          - maybe reviews
 * 
 * Some possible issues:
 *  - popup ads
 *  - sometimes throws bad gateway for some amount of time (server shuts down?) - code 502
 */

/**
 * New ideas:
 *  Based on the INPUT entityType and entityName properties, it will either look only for that entity, or just start gathering all of the available servers.
 * 
 * What I need to check:
 *  Duplicate server entries. Need to check IDs and store them in some persisted store in memory. Do this always.
 *  A new value in INPUT called 'session'?
 *      Which will hold the key to the KeyValueStore, so that the process can be resumed. (the KeyValueStore will hold the server IDs)
 *      Maybe it could also hold RequestQueue key (the keys would be the same)? That would be awesome.
 */

await Actor.init();

const input = ((await KeyValueStore.getInput()) || {}) as Input;

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
    maxRequestRetries: 10
});

await crawler.addRequests([
    {
        url: linkGenerators.serverList({...input, page: input.startPageNumber }),
        label: RouteLabels.ServerList,
        userData: {
            currentPageNumber: input.startPageNumber,
            input
        }
    }
]);

console.log("Starting crawler...");
await crawler.run();
console.log("Crawler has finished its queue.");

await Actor.exit();