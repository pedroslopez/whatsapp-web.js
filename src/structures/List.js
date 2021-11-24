'use strict';

const Util = require('../util/Util');

/**
 * Message type List
 */
class List {
    /**
     * @param {string} body
     * @param {string} buttonText
     * @param {Array<any>} sections
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(body, buttonText, sections, title, footer) {
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
     * @returns {Array<any>}
     * @example
     * Input: [{title:'sectionTitle',rows:[{id:'customId', title:'ListItem2', description: 'desc'},{title:'ListItem2'}]}}]
     * Returns: [{'title':'sectionTitle','rows':[{'rowId':'customId','title':'ListItem1','description':'desc'},{'rowId':'oGSRoD','title':'ListItem2','description':''}]}]
     */
    _format(sections){
        if(!sections.length){throw '[LT02] List without sections';}
        if(sections.length > 1){if(sections.find(s => typeof s.title == "undefined")){throw '[LT05] You can\'t have empty section titles if you have more than one section';}}
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
            };
        });
    }
    
}

module.exports = List;
