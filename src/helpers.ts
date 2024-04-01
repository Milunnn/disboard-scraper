import { CheerioCrawler } from "crawlee";
import { InputSearch, RouteHandlerLabels, SearchType } from "./types.js";

type ServerListInputType = Pick<InputSearch, 'langCode' | 'sort'> & {
    page: number;
    search?: {
        type: SearchType;
        keyword: string;
    };
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

    public serverList({ search, page, sort, langCode }: ServerListInputType) {
        let base = `${linkGenerators.rootUrl()}/servers`;

        if (search) {
            base = `${base}/${search.type}/${search.keyword}`;
        }

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
        search: { type: SearchType.Tag, keyword: input.keyword }
    })
}