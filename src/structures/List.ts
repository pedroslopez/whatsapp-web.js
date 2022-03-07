'use strict';

import { Util } from "../util/Util";

export interface ListSection {
    title: string;
    rows: {
        rowId: string;
        title: string;
        description: string;
    }[]
}

/**
 * Message type List
 */
export class List {
    description: string;
    buttonText: string;
    title?: string;
    footer?: string;
    sections: ListSection[];

    /**
     * @param {string} body
     * @param {string} buttonText
     * @param {Array<any>} sections
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(body: string, buttonText: string, sections: any[], title?: string, footer?: string) {
        /**
         * Message body
         * @type {string}
         */
        this.description = body;

        /**
         * List button text
         * @type {string}
         */
        this.buttonText = buttonText;
        
        /**
         * title of message
         * @type {string}
         */
        this.title = title;
        

        /**
         * footer of message
         * @type {string}
         */
        this.footer = footer;

        /**
         * sections of message
         * @type {Array<any>}
         */
        this.sections = this._format(sections);
        
    }
    
    /**
     * Creates section array from simple array
     * @param {Array<any>} sections
     * @example
     * Input: [{title:'sectionTitle',rows:[{id:'customId', title:'ListItem2', description: 'desc'},{title:'ListItem2'}]}}]
     * Returns: [{'title':'sectionTitle','rows':[{'rowId':'customId','title':'ListItem1','description':'desc'},{'rowId':'oGSRoD','title':'ListItem2','description':''}]}]
     */
    _format(sections: any[]){
        if(!sections.length){throw '[LT02] List without sections';}
        if(sections.length > 1 && sections.filter(s => typeof s.title == 'undefined').length > 1){throw '[LT05] You can\'t have more than one empty title.';}
        return sections.map( (section) =>{
            if(!section.rows.length){throw '[LT03] Section without rows';}
            return {
                title: section.title ? section.title : undefined,
                rows: section.rows.map( (row) => {
                    if(!row.title){throw '[LT04] Row without title';}
                    return {
                        rowId: row.id ? row.id : Util.generateHash(6),
                        title: row.title,
                        description: row.description ? row.description : ''
                    };
                })
            } as ListSection;
        });
    }
    
}
