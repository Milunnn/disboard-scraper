
export enum RouteHandlerLabels {
    // ServerList = "ServerList",
    // ServerSearch = "ServerSearch",
    // ServerSearchRedirectCheck = "ServerSearchRedirectCheck",
    // ServerDetail = "ServerDetail",

    GetSearchType = "GetSearchType",
    ServerList = "ServerList",
    ServerDetail = "ServerDetail"
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


export interface Input {
    startPageNumber: number;
    endPageNumber: number;

    entity: {
        type: SearchType;
        name: string;
    } | null;
    sort: ServerListSort | null;
    langCode: string | null;

    /**
     * Holds the name of the KeyValueStore, Dataset and RequestQueue, so that this Actor is resumable.
     */
    sessionId: string | null;


}

export interface InputSearch {
    keywords: Array<string>;
    sort: ServerListSort | null;
    langCode: string | null;

    sessionId: string | null;

    startPageNumber: number | null;
    endPageNumber: number | null;
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
    iconUrl: string | null;
    joinLinkUrl: string | null;
    /**
     * ISO-format.
     */
    bumpedAt: string | null;
}

export interface Output {
    servers: Array<ServerDetail>;
}