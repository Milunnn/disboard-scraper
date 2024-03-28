import { EntityType, Input, ServerListSort } from "./types.js";

class LinkGenerators {

    public rootUrl() {
        return 'https://disboard.org';
    }

    public serverList({ entityType, entityName, page, sort, langCode }: { entityType?: string; entityName?: string; page?: number; sort?: ServerListSort; langCode?: string; }) { // TODO - langCode should be optional in the URL (can be undefined for all languages)
        // return `${linkGenerators.rootUrl()}/servers/${entityType}/${entityName}/${page}?sort=${sort}&fl=${langCode}`; // TODO - maybe could build it using URL and SearchParams
        let base = `${linkGenerators.rootUrl()}/servers`;

        if (entityType && entityName) {
            base = `${base}/${entityType}/${entityName}`;
        }

        if (page && page != 1) {
            base = `${base}/${page}`;
        }

        const params = new URLSearchParams();

        if (sort) params.set('sort', sort);
        if (langCode) params.set('fl', langCode);

        base = `${base}?${params.toString()}`;

        return base;
    }
}

export const linkGenerators = new LinkGenerators();

export const fetchImageBlob = async (src: string) => {
    const resp = await fetch(src);
    const data = await resp.blob();

    return data;
}