
export enum RouteLabels {
    ServerList = "ServerList",
    ServerDetail = "ServerDetail"
}

export enum ServerListSort {
    MemberCount = "member_count",
    BumpedRecently = "bumped_at"
}

export enum EntityType {
    Tag = "tag",
    Category = "category"
}

export enum StoreKeys {
    StoreStoreKey = "ServerStore"
}


export interface Input {
    startPageNumber: number;
    endPageNumber: number;

    entity: {
        type: EntityType;
        name: string;
    } | null;
    sort: ServerListSort | null;
    langCode: string | null;

    /**
     * Holds the name of the KeyValueStore, Dataset and RequestQueue, so that this Actor is resumable.
     */
    sessionId: string | null;
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