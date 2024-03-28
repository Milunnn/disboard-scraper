import { createCheerioRouter } from "crawlee";
import { Output, RouteLabels, ServerDetail } from "./types.js";
import { fetchImageBlob, linkGenerators } from "./helpers.js";
import { Actor } from "apify";

export const router = createCheerioRouter();

router.addHandler(RouteLabels.ServerList, async ({ $, crawler, request }) => {
    console.log(`Current page number: ${request.userData.currentPageNumber}/${request.userData.input.endPageNumber}`);
    console.log(`Crawling page "${request.url}"`);

    // Firstly add all detail routes
    const serverAnchors = $('.listing-card .server-name a');

    for (const a of serverAnchors) {
        const relativeUri = $(a).attr('href');
        const name = $(a).text().trim();

        if (!relativeUri) {
            console.log(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Skipping.`);
            continue;
        }

        const url = new URL(relativeUri, linkGenerators.rootUrl());
        const absoluteUrlString = url.href;

        await crawler.addRequests([
            {
                url: absoluteUrlString,
                label: RouteLabels.ServerDetail
            }
        ]);
    }

    if (request.userData.currentPageNumber >= request.userData.input.endPageNumber) {
        // Don't do anything, we are finished
        console.log('Crawler has reached the end page.');
        return;
    }

    const currentPageNumber = request.userData.currentPageNumber + 1;

    // Then next page until we satisfy the input
    await crawler.addRequests([
        {
            url: linkGenerators.serverList({...request.userData.input, page: currentPageNumber}),
            label: RouteLabels.ServerList,
            userData: {
                ...request.userData,
                currentPageNumber: currentPageNumber
            }
        }
    ]);
});

router.addHandler(RouteLabels.ServerDetail, async ({ $, crawler, request }) => {

    const name = $('.server-name').text().trim();
    const description = $('.server-body').text().trim();
    const category = $('.server-category').text().trim();
    const tags = $('.server-tags .name').toArray().map(e => $(e).text().trim());
    const userCount = {
        online: parseInt($('.online-member-count').text().trim().replace(',','')),
        total: parseInt($('.member-count').text().trim().replace(',',''))
    };

    // Icon
    const iconUrlString = $('.server-icon img').attr('data-src'); // It is lazy-loaded, so I need to access this attribute, for src attribute is not set because of that
    // const iconBlob = iconUrlString ? await fetchImageBlob(iconUrlString) : null; // Lets not do it rn

    // Join link
    const joinRelativeUri = $('.fixed-join-button a').attr('href');
    if (!joinRelativeUri) {
        console.log(`Anchor for server '${name}' did not contain href attribute. Setting to null.`);
    }
    const joinUrlString = joinRelativeUri ? new URL(joinRelativeUri, linkGenerators.rootUrl()).href : null;

    // Save it to a dataset
    const serverData: ServerDetail = {
        name,
        description,
        category,
        tags,
        userCount,
        iconUrl: iconUrlString || null,
        joinLinkUrl: joinUrlString
    };

    await Actor.pushData(serverData);
});