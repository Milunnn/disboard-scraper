import { createCheerioRouter } from "crawlee";
import { Output, RouteLabels, ServerDetail } from "./types.js";
import { fetchImageBlob, linkGenerators } from "./helpers.js";
import { dataset, input } from "./main.js";
import { serverStore } from "./stores/server-store.js";

export const router = createCheerioRouter();

router.addHandler(RouteLabels.ServerList, async ({ $, crawler, request }) => {
    console.log(`Current page number: ${request.userData.currentPageNumber}/${input.endPageNumber}`);
    console.log(`Crawling page "${request.url}"`);

    // Firstly add all detail routes
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
                label: RouteLabels.ServerDetail,
                userData: {
                    bumpedAt: bumpedAtISO
                }
            }
        ]);
    }

    if (request.userData.currentPageNumber >= input.endPageNumber) {
        // Don't do anything, we are finished
        console.log('Crawler has reached the end page.');
        return;
    }

    const currentPageNumber = request.userData.currentPageNumber + 1;

    // Then next page until we satisfy the input
    await crawler.addRequests([
        {
            url: linkGenerators.serverList({...input, page: currentPageNumber}),
            label: RouteLabels.ServerList,
            userData: {
                ...request.userData,
                currentPageNumber: currentPageNumber
            }
        }
    ]);
});

router.addHandler(RouteLabels.ServerDetail, async ({ $, crawler, request }) => {

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

    // Icon
    const iconUrlString = $('.server-icon img').attr('data-src'); // It is lazy-loaded, so I need to access this attribute, for src attribute is not set because of that
    // const iconBlob = iconUrlString ? await fetchImageBlob(iconUrlString) : null; // Lets not do it rn

    // Join link
    const joinRelativeUri = $('.fixed-join-button a').attr('href');
    if (!joinRelativeUri) {
        // Same thing here  as with the id?
        console.log(`Anchor for server '${name}' did not contain href attribute. Setting to null.`);
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
    // serverStore.push(id);
});