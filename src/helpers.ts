import { CheerioCrawler } from "crawlee";
import { SearchType, Input, InputSearch, RouteHandlerLabels } from "./types.js";

type ServerListInputType = Pick<Input, 'entity' | 'langCode' | 'sort'> & {
    page: number;
}
type SearchInputType = Pick<InputSearch, 'langCode' | 'sort'> & {
    keyword: string;
    page: number;
    randomParam?: boolean;
};

class LinkGenerators {

    public rootUrl() {
        return 'https://disboard.org';
    }

    public serverList({ entity, page, sort, langCode }: ServerListInputType) { // TODO - langCode should be optional in the URL (can be undefined for all languages)
        // return `${linkGenerators.rootUrl()}/servers/${entityType}/${entityName}/${page}?sort=${sort}&fl=${langCode}`; // TODO - maybe could build it using URL and SearchParams
        let base = `${linkGenerators.rootUrl()}/servers`;

        if (entity) {
            base = `${base}/${entity.type}/${entity.name}`;
        }

        // if (page && page != 1) {
        //     base = `${base}/${page}`;
        // }

        const params = new URLSearchParams();

        if (sort) params.set('sort', sort);
        if (langCode) params.set('fl', langCode);
        params.set('page', `${page}`);

        base = `${base}?${params.toString()}`;

        return base;
    }

    search({ keyword, langCode, sort, page, randomParam }: SearchInputType) {
        let base = `${linkGenerators.rootUrl()}/search`;

        const params = new URLSearchParams();

        params.set('keyword', keyword);

        if (sort) params.set('sort', sort);
        if (langCode) params.set('fl', langCode);
        params.set('page', `${page}`);

        if (randomParam) {
            // Random hex string
            const randomStringValue = Math.floor(Math.random() * Math.pow(16, 8)).toString(16).padStart(8, '0');
            params.set('random', randomStringValue);
        }

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

/**
 * Function for initializing requests for the given keyword.
 * @param keyword 
 */
export async function initForKeyword(crawler: CheerioCrawler, input: SearchInputType, keyword: string) {
    await crawler.addRequests([
        {
            url: linkGenerators.search({ ...input, keyword, randomParam: true }),
            label: RouteHandlerLabels.GetSearchType,
            userData: {
                currentPageNumber: input.page,
                keyword
            }
        }
    ]);
}

export function getUrlFromSearchType(input: SearchInputType, searchType: SearchType) {
    if (searchType == SearchType.Search) {
        return linkGenerators.search({ ...input });
    }

    return linkGenerators.serverList({
        ...input,
        entity: { type: SearchType.Tag, name: input.keyword }
    })
}