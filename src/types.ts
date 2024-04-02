
export enum RouteHandlerLabels {
    GetSearchType = "GetSearchType",
    ServerList = "ServerList",
    ServerDetail = "ServerDetail",
    ServerReviewList = "ServerReviewList"
}

export enum ServerListSort {
    MemberCount = "member_count",
    BumpedRecently = "bumped_at"
}

export enum SearchType {
    Tag = "tag",
    Category = "category",
    Search = "search"
}

export enum StoreKeys {
    StoreStoreKey = "ServerStore"
}

export interface InputSearch {
    keywords: Array<string>;
    sort: ServerListSort | null;
    langCode: string | null;

    /**
     * Holds the name of the KeyValueStore, Dataset and RequestQueue, so that this Actor is resumable.
     */
    sessionId: string | null;

    startPageNumber: number | null;
    endPageNumber: number | null;

    scrapeReviews: boolean | null;
}

export interface ServerDetail {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: Array<string>;
    userCount: {
        total: number;
        online: number;
    };
    disboardServerUrl: string;
    iconUrl: string | null;
    joinLinkUrl: string | null;
    /**
     * ISO-format.
     */
    bumpedAt: string | null;
    reviews: Array<ServerReview>;
}

export interface ServerReview {
    author: string;
    thumbs: number;
    /**
     * Out of 5.
     */
    rating: number | null;
    title: string;
    body: string;
    /**
     * ISO-formatted string.
     */
    reviewedAt: string | null;
}