import { createCheerioRouter, log } from "crawlee";
import { getUrlFromSearchType, linkGenerators, parseAttrDateToISO } from "./helpers.js";
import { dataset, input } from "./main.js";
import { serverStore } from "./stores/server-store.js";
import { RouteHandlerLabels, SearchType, ServerDetail } from "./types.js";

export const router = createCheerioRouter();


router.addHandler(RouteHandlerLabels.GetSearchType, async ({ crawler, request }) => {
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
            log.warning(`Anchor for server '${name}' at '${request.url}' did not contain href attribute. Skipping.`);
            continue;
        }

        const url = new URL(relativeUri, linkGenerators.rootUrl());
        const absoluteUrlString = url.href;

        const bumpedAtISO = (bumpedAtText && parseAttrDateToISO(bumpedAtText)) || null;

        if (input.scrapeDetail) {
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
            return;
        }

        const id = relativeUri.match(/.+?(\d+)\/?/)?.[1];
        const onlineUserCount = parseInt($(card).find(".server-member-counts .server-online").text().trim());
        const description = $(card).find(".server-description").text().trim();
        const category = $(card).find('.server-category').text().trim();
        const tags = $(card).find('.server-tags .name').toArray().map(e => $(e).text().trim());

        const iconUrlString = $(card).find('.server-icon img').attr('data-src'); // It is lazy-loaded, so I need to access this attribute, for src attribute is not set because of that
        const joinRelativeUri = $(card).find('.server-join a').attr('href');
        if (!joinRelativeUri) {
            log.warning(`Link for server '${name}' at '${request.url}' did not contain href attribute. Setting to null.`);
        }
        const joinUrlString = joinRelativeUri ? new URL(joinRelativeUri, linkGenerators.rootUrl()).href : null;

        if (!id) {
            throw `Could not get id from '${request.url}'.`;
        }
        if (serverStore.contains(id)) {
            log.info(`Server with id '${id}' is already in the collection, skipping...`)
            continue;
        }

        const serverData: ServerDetail = {
            id,
            name,
            description,
            category,
            tags,
            userCount: {
                online: onlineUserCount
            },
            disboardServerUrl: absoluteUrlString,
            iconUrl: iconUrlString || null,
            joinLinkUrl: joinUrlString,
            bumpedAt: bumpedAtISO,
            reviews: []
        };
    
        serverStore.push(id);

        await dataset.pushData(serverData);
    }

    // Check if we are being shown results
    if ($('.summary').length == 0 || $('.listing').length == 0) {
        throw 'Crawler is not on the search results page.';
    }

    // If we are also being shown no results, stop the search
    if ($('.pagination > .next.disabled').length >= 1 || listingCards.length == 0) {
        log.info(`Crawler has reached the end page for keyword '${request.userData.keyword}'.`);
        return;
    }

    if (input.endPageNumber && currentPageNumber >= input.endPageNumber) {
        log.info(`Crawler has reached the end page for keyword '${keyword}'`);
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

    if (response.statusCode == 404) {
        log.warning(`Request for URL '${request.url}' returned 404, skipping...`);
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
        throw `Could not get id from '${request.url}'.`;
    }
    if (serverStore.contains(id)) {
        log.info(`Server with id '${id}' is already in the collection, skipping...`)
        return;
    }

    const iconUrlString = $('.server-icon img').attr('data-src'); // It is lazy-loaded, so I need to access this attribute, for src attribute is not set because of that

    const joinRelativeUri = $('.fixed-join-button a').attr('href');
    if (!joinRelativeUri) {
        log.warning(`Link for server '${name}' at '${request.url}' did not contain href attribute. Setting to null.`);
    }
    const joinUrlString = joinRelativeUri ? new URL(joinRelativeUri, linkGenerators.rootUrl()).href : null;

    const serverData: ServerDetail = {
        id,
        name,
        description,
        category,
        tags,
        userCount,
        disboardServerUrl: request.loadedUrl || request.url,
        iconUrl: iconUrlString || null,
        joinLinkUrl: joinUrlString,
        bumpedAt: request.userData.bumpedAt,
        reviews: []
    };

    serverStore.push(id);

    if (input.scrapeReviews === false) {
        await dataset.pushData(serverData);
        return;
    }

    await crawler.addRequests([
        {
            url: linkGenerators.reviews({ serverId: id, page: 1 }),
            label: RouteHandlerLabels.ServerReviewList,
            userData: {
                ...request.userData,
                serverData,
                reviewPage: 1
            }
        }
    ]);
});

// Don't know how should this be saved in continual fashion
router.addHandler(RouteHandlerLabels.ServerReviewList, async ({ $, crawler, request }) => {

    const serverData = request.userData.serverData as ServerDetail;
    const reviews = serverData.reviews;

    const reviewCards = $('.review-card');

    for (const card of reviewCards) {
        const authorName = $(card).find('.author-name').text().trim();

        const createdAtString = $(card).find('.review-created-at').attr('title');
        const createdAtISO = (createdAtString && parseAttrDateToISO(createdAtString)) || null;

        const thumbCount = parseInt($(card).find('.thumb-count').text().trim()) || 0;

        const ratingAttr = $(card).find('.review-stars').attr('title');
        const ratingText = (ratingAttr && ratingAttr.match(/^(\d)\/\d .+/)?.[1]) || null;
        const rating = (ratingText && ratingText.length > 0) ? parseInt(ratingText) : null;

        const title = $(card).find('.review-title').text().trim();
        const body = $(card).find('.card-body').text().trim();

        reviews.push({
            author: authorName,
            reviewedAt: createdAtISO,
            thumbs: thumbCount,
            rating,
            title,
            body
        })
    }

    // Detect if we are at the end
    // - If yes, push all of the data into the dataset
    // - If not, pass the data via userData to the next page of the reviews

    const paginationExists = $('.pagination').length > 0;
    const isAtEnd = $('.pagination > .next.disabled').length >= 1;

    if ((!paginationExists || isAtEnd) || reviewCards.length == 0) {
        log.info(`Crawler has reached the end page of reviews for server '${serverData.id}'.`);

        await dataset.pushData(serverData);

        return;
    }

    const reviewPage = request.userData.reviewPage + 1;
    
    await crawler.addRequests([
        {
            url: linkGenerators.reviews({ serverId: serverData.id, page: reviewPage }),
            label: RouteHandlerLabels.ServerReviewList,
            userData: {
                ...request.userData,
                reviewPage
            }
        }
    ]);
});