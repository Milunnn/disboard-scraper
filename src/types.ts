
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


export interface Input {
    startPageNumber: number;
    endPageNumber: number;

    entityName: string;
    entityType: EntityType;
    sort?: ServerListSort;
    langCode?: string;
}

export interface ServerDetail {
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
}

export interface Output {
    servers: Array<ServerDetail>;
}