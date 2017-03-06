/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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

export interface Bucket {
    key: any;
    value: number;
}

export interface HitNode extends Node {
    hasHits: boolean;
}

export interface MappedEntity {
    color: string;
    key: string;
    name: string;
    text: string;
    type: string;
}