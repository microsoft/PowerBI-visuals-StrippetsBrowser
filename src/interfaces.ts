export interface IStrippetFilter {
    type: string;
    name: string;
}

export interface IStrippetReference {
    name: string;
    type: string;
    firstPosition: number;
    referenceId?: string;

    // TODO: This doesn't appear in the new adat interface
    description?: string;
}

/**
 TODO: This will be the new data interfaces
export interface IStrippetData {
    id: string;
    title: string;
    source: {
        name: string;
        url: string;
        imageUrl: string;
    },
    references: IStrippetReference[];
}
*/

export interface IStrippetData {
    id: string;
    title: string;
    sourceUrl: string;
    source: string;
    sourceimage: string;
    entities: IStrippetReference[];
    sidebars: any[];
    url: string;
    readerUrl: string;
    articledate: string;
}

export interface IStrippets {
    /**
     * Loads data into the Strippets View
     */
    loadData(data: IStrippetData[], append: boolean);

    /**
     * Enable/Disable the Sidebar
     */
    enableSidebar(isEnabled: boolean);

    /**
     * Applies a filter to the Strippets View
     */
    applyFilter(params: IStrippetFilter[]);

    /**
     * Resize the component
     */
    resize();
}
