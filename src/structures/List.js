'use strict';

const Util = require('../util/Util');

/**
 * Section spec used in List constructor
 * @typedef {Object} SectionSpec
 * @property {string=} title - The title of the section, can be empty on the first section only.
 * @property {RowSpec[]} rows - The rows of the section.
 */

/**
 * Row spec used in List constructor
 * @typedef {Object} RowSpec
 * @property {string} title - The text to show on the row.
 * @property {string=} id - Custom ID to set on the row. A random one will be generated if one is not passed.
 * @property {string=} description - Custom description for the row, will appear after clicked in the list response message (appended)
 */

/**
 * Formatted section spec
 * @typedef {Object} FormattedSectionSpec
 * @property {string} title
 * @property {{rowId: string; title: string; description: string}[]} rows
 */

/**
 * Message type List
 */
class List {
    /**
     * @param {string} body - A text body, no media.
     * @param {string} buttonText - The text to put on the click to open button.
     * @param {Array<SectionSpec>} sections - The sections of the list
     * @param {string?} title - Custom boldfaced title property
     * @param {string?} footer - Custom footer added in a small font to the end of the message
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
     * @param {Array<SectionSpec>} sections
     * @returns {Array<FormattedSectionSpec>}
     */
    _format(sections) {
        if(!sections.length) {
            throw '[LT02] List without sections';
        }
        if(sections.length > 1 && sections.filter(section => (typeof section.title == 'undefined' )|| section.title == '' ).length > 1) {
            throw '[LT05] You can\'t have more than one empty title.';
        }
        return sections.map((section, index) => {
            if(!section.rows.length) {
                throw '[LT03] Section without rows';
            }
            return {
                title: section.title ? section.title : undefined,
                rows: section.rows.map((row, rowIndex) => {
                    if (!row.title) {
                        throw `[LT04] Row without title at section index ${index} and row index ${rowIndex}`;
                    }
                    return {
                        rowId: row.id ? row.id : Util.generateHash(8),
                        title: row.title,
                        description: row.description ? row.description : ''
                    };
                })
            };
        });
    }
    
}

module.exports = List;
