import { createCheerioRouter } from "crawlee";
import { SearchType, Output, RouteHandlerLabels, ServerDetail } from "./types.js";
import { getUrlFromSearchType, linkGenerators } from "./helpers.js";
import { dataset, input } from "./main.js";
import { serverStore } from "./stores/server-store.js";

export const router = createCheerioRouter();

// router.addHandler(RouteLabels.ServerList, async ({ $, crawler, request }) => {
//     console.log(`Current page number: ${request.userData.currentPageNumber}/${input.endPageNumber}`);
//     console.log(`Crawling page "${request.url}"`);

//     // Firstly add all detail routes
//     const listingCards = $('.listing-card');

//     for (const card of listingCards) {
//         const a = $(card).find('.server-name a');
//         const relativeUri = $(a).attr('href');
//         const name = $(a).text().trim();
//         const bumpedAtText = $(card).find('.server-bumped-at').attr('title');

//         if (!relativeUri) {
//             console.log(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Skipping.`);
//             continue;
//         }

//         const url = new URL(relativeUri, linkGenerators.rootUrl());
//         const absoluteUrlString = url.href;

//         const bumpedAtReplaced = bumpedAtText?.replace('(', '')?.replace(')', '');
//         const bumpedAtISO = (bumpedAtReplaced && new Date(bumpedAtReplaced).toISOString()) || null;

//         await crawler.addRequests([
//             {
//                 url: absoluteUrlString,
//                 label: RouteLabels.ServerDetail,
//                 userData: {
//                     bumpedAt: bumpedAtISO
//                 }
//             }
//         ]);
//     }

//     if (request.userData.currentPageNumber >= input.endPageNumber) {
//         // Don't do anything, we are finished
//         console.log('Crawler has reached the end page.');
//         return;
//     }

//     const currentPageNumber = request.userData.currentPageNumber + 1;

//     // Then next page until we satisfy the input
//     await crawler.addRequests([
//         {
//             url: linkGenerators.serverList({...input, page: currentPageNumber}),
//             label: RouteLabels.ServerList,
//             userData: {
//                 ...request.userData,
//                 currentPageNumber: currentPageNumber
//             }
//         }
//     ]);
// });


// router.addHandler(RouteHandlerLabels.ServerSearchRedirectCheck, async ({ $, crawler, request }) => {
//     // Should fix the issue of losing query params when searching for keywords
//     const { url, loadedUrl, userData } = request;

    
//     if (url != loadedUrl) {
//         // It was redirected to the tag list - compile URL with the search params for tag
//         const serverListUrl = linkGenerators.serverList({
//             ...input,
//             entity: { type: SearchType.Tag, name: userData.keyword },
//             page: userData.currentPageNumber
//         });
//         console.log(url, loadedUrl, 'redirecting to ' + serverListUrl);
        
//         await crawler.addRequests([
//             {
//                 url: serverListUrl,
//                 label: RouteHandlerLabels.ServerSearch,
//                 userData: {
//                     ...userData,
//                     searchType: SearchType.Tag
//                 }
//             }
//         ]);
//         return;
//     }

//     console.log(url, loadedUrl, 'passing on');
//     // Pass it on - CHECK IF REQUEST QUEUE MAKES THIS A PROBLEM
//     await crawler.addRequests([
//         {
//             url,
//             label: RouteHandlerLabels.ServerSearch,
//             userData: {
//                 ...userData,
//                 searchType: SearchType.Search
//             }
//         }
//     ]);
// });

// router.addHandler(RouteHandlerLabels.ServerSearch, async ({ $, crawler, request }) => {
//     console.log(`Current page number: ${request.userData.currentPageNumber}`);
//     console.log(`Crawling page "${request.url}"`);

//     const loadedUrl = request.loadedUrl;
//     if (!loadedUrl) throw 'Loaded URL is undefined.';
//     const searchType = getSearchTypeFromUrl(loadedUrl); // TODO - rewrite it ALL

//     // Firstly add all detail routes
//     const listingCards = $('.listing-card');

//     for (const card of listingCards) {
//         const a = $(card).find('.server-name a');
//         const relativeUri = $(a).attr('href');
//         const name = $(a).text().trim();
//         const bumpedAtText = $(card).find('.server-bumped-at').attr('title');

//         if (!relativeUri) {
//             console.log(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Skipping.`);
//             continue;
//         }

//         const url = new URL(relativeUri, linkGenerators.rootUrl());
//         const absoluteUrlString = url.href;

//         const bumpedAtReplaced = bumpedAtText?.replace('(', '')?.replace(')', '');
//         const bumpedAtISO = (bumpedAtReplaced && new Date(bumpedAtReplaced).toISOString()) || null;

//         await crawler.addRequests([
//             {
//                 url: absoluteUrlString,
//                 label: RouteHandlerLabels.ServerDetail,
//                 userData: {
//                     bumpedAt: bumpedAtISO
//                 }
//             }
//         ]);
//     }

//     // Check if we are being shown results
//     if ($('.summary').length == 0 || $('.listing').length == 0) {
//         // Something happened
//         throw 'Crawler is not on the search results page.';
//     }

//     // If we are also being shown no results, stop the search
//     if ($('.pagination > .next.disabled').length >= 1 || listingCards.length == 0) {
//         console.log(`Crawler has reached the end page for keyword '${request.userData.keyword}'.`);
//         return;
//     }

//     const currentPageNumber = request.userData.currentPageNumber + 1;

//     // Then next page based on the type
//     const url = request.userData.searchType == SearchType.Search ? (
//         linkGenerators.search({...input, keyword: request.userData.keyword, page: currentPageNumber })
//     ) : (
//         linkGenerators.serverList({
//             ...input,
//             entity: { type: SearchType.Tag, name: request.userData.keyword },
//             page: request.userData.currentPageNumber
//         })
//     );

//     await crawler.addRequests([
//         {
//             url: url,
//             label: RouteHandlerLabels.ServerSearch,
//             userData: {
//                 ...request.userData,
//                 currentPageNumber: currentPageNumber
//             }
//         }
//     ]);
// });




// New
router.addHandler(RouteHandlerLabels.GetSearchType, async ({ $, crawler, request }) => {
    const { url, loadedUrl, userData } = request;

    const searchType = url != loadedUrl ? SearchType.Tag : SearchType.Search;

    const newUrl = getUrlFromSearchType({
        ...input,
        keyword: userData.keyword,
        page: userData.currentPageNumber
    }, searchType);

    await crawler.addRequests([
        {
            url: newUrl,
            label: RouteHandlerLabels.ServerList,
            userData: {
                ...userData,
                searchType
            }
        }
    ]);
});

router.addHandler(RouteHandlerLabels.ServerList, async ({ $, crawler, request }) => {
    const { keyword, currentPageNumber, searchType } = request.userData;

    const listingCards = $('.listing-card');

    for (const card of listingCards) {
        const a = $(card).find('.server-name a');
        const relativeUri = $(a).attr('href');
        const name = $(a).text().trim();
        const bumpedAtText = $(card).find('.server-bumped-at').attr('title');

        if (!relativeUri) {
            console.log(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Skipping.`);
            continue;
        }

        const url = new URL(relativeUri, linkGenerators.rootUrl());
        const absoluteUrlString = url.href;

        const bumpedAtReplaced = bumpedAtText?.replace('(', '')?.replace(')', '');
        const bumpedAtISO = (bumpedAtReplaced && new Date(bumpedAtReplaced).toISOString()) || null;

        await crawler.addRequests([
            {
                url: absoluteUrlString,
                label: RouteHandlerLabels.ServerDetail,
                userData: {
                    bumpedAt: bumpedAtISO,
                    keyword
                }
            }
        ]);
    }

    // Check if we are being shown results
    if ($('.summary').length == 0 || $('.listing').length == 0) {
        // Something happened
        throw 'Crawler is not on the search results page.';
    }

    // If we are also being shown no results, stop the search
    if ($('.pagination > .next.disabled').length >= 1 || listingCards.length == 0) {
        console.log(`Crawler has reached the end page for keyword '${request.userData.keyword}'.`);
        return;
    }

    if (input.endPageNumber && currentPageNumber >= input.endPageNumber) {
        // Don't do anything, we are finished
        console.log(`Crawler has reached the end page for keyword '${keyword}'`);
        return;
    }

    const nextPageNumber = currentPageNumber + 1;

    // Then next page based on the search type
    const url = getUrlFromSearchType({
        ...input,
        keyword,
        page: nextPageNumber
    }, searchType);

    await crawler.addRequests([
        {
            url: url,
            label: RouteHandlerLabels.ServerList,
            userData: {
                ...request.userData,
                currentPageNumber: nextPageNumber
            }
        }
    ]);
});

router.addHandler(RouteHandlerLabels.ServerDetail, async ({ $, crawler, request, response }) => {

    // If the status is 404, just ignore it, because this happens only when the server detail is somehow not available
    // How do I access the status code
    if (response.statusCode == 404) {
        console.log(`Request for URL '${request.url}' returned 404, skipping...`);
        return;
    }

    const id = request.url.match(/.+?(\d+)\/?/)?.[1];
    const name = $('.server-name').text().trim();
    const description = $('.server-body').text().trim();
    const category = $('.server-category').text().trim();
    const tags = $('.server-tags .name').toArray().map(e => $(e).text().trim());
    const userCount = {
        online: parseInt($('.online-member-count').text().trim().replace(',','')),
        total: parseInt($('.member-count').text().trim().replace(',',''))
    };

    if (!id) {
        // It would proably be better if I just stored the data without id, but I want clean data and there is a big probability that this works.
        // What if by skipping this, I actually lose potencial data...shouldn't I throw an error so that this request is retried?
        // console.log(`Could not get id from '${request.url}'. Skipping server.`);
        // return;
        throw `Could not get id from '${request.url}'.`;
    }
    if (serverStore.contains(id)) {
        // Skip if the store already contains this server
        console.log(`Server with id '${id}' is already in the collection, skipping...`)
        return;
    }

    // Icon
    const iconUrlString = $('.server-icon img').attr('data-src'); // It is lazy-loaded, so I need to access this attribute, for src attribute is not set because of that
    // const iconBlob = iconUrlString ? await fetchImageBlob(iconUrlString) : null; // Lets not do it rn

    // Join link
    const joinRelativeUri = $('.fixed-join-button a').attr('href');
    if (!joinRelativeUri) {
        // Same thing here  as with the id?
        console.log(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Setting to null.`);
    }
    const joinUrlString = joinRelativeUri ? new URL(joinRelativeUri, linkGenerators.rootUrl()).href : null;

    // Save it to a dataset
    const serverData: ServerDetail = {
        id,
        name,
        description,
        category,
        tags,
        userCount,
        iconUrl: iconUrlString || null,
        joinLinkUrl: joinUrlString,
        bumpedAt: request.userData.bumpedAt
    };

    await dataset.pushData(serverData);

    // Save the server ID to the store
    serverStore.push(id);
});