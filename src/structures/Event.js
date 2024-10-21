'use strict';

/**
 * Event send options
 * @typedef {Object} EventSendOptions
 * @property {?string} description The event description
 * @property {?number} endTimeTs The end time of the event in timestamp (10 digits)
 * @property {?string} location The location of the event
 * @property {?string} callType The type of a WhatsApp call link to generate, valid values are: `video` | `voice`
 * @property {boolean} [isEventCanceled = false] Indicates if an event should be sent as an already canceled
 * @property {?Array<number>} messageSecret The custom message secret, can be used as an event ID. NOTE: it has to be a unique vector with a length of 32
 */

/** Represents an Event on WhatsApp */
class Event {
    /**
     * @param {string} name
     * @param {number} startTimeTs
     * @param {EventSendOptions} options
     */
    constructor(name, startTimeTs, options = {}) {
        /**
         * The name of the event
         * @type {string}
         */
        this.name = this._validateInputs('name', name).trim();

        /**
         * The start time of the event in timestamp (10 digits)
         * @type {number}
         * @example
         * ```javascript
         * Math.floor(Date.now() / 1000)
         * ```
         */
        this.startTimeTs = this._validateInputs('startTimeTs', startTimeTs);

        /**
         * The send options for the event
         * @type {EventSendOptions}
         */
        this.eventSendOptions = {
            description: options.description?.trim(),
            endTimeTs: this._validateInputs('endTimeTs', options.endTimeTs),
            location: options.location?.trim(),
            callType: this._validateInputs('callType', options.callType),
            isEventCanceled: options.isEventCanceled ?? false,
            messageSecret: options.messageSecret
        };
    }

    /**
     * Inner function to validate input values
     * @param {string} propName The property name to validate the value of
     * @param {string | number} propValue The property value to validate
     * @returns {string | number} The property value if a validation succeeded
     */
    _validateInputs(propName, propValue) {
        if (propName === 'name' && !propValue) {
            throw new class CreateEventError extends Error {
                constructor(m) { super(m); }
            }(`Empty '${propName}' parameter value is provided.`);
        }

        if (propName === 'callType' && propValue && !['video', 'voice'].includes(propValue)) {
            throw new class CreateEventError extends Error {
                constructor(m) { super(m); }
            }(`Invalid '${propName}' parameter value is provided. Valid values are: \'voice\' | \'video\'.`);
        }

        if (propName === 'startTimeTs' || (propName === 'endTimeTs' && propValue)) {
            if (!Number.isInteger(propValue) || propValue.toString().length !== 10) {
                throw new class CreateCallLinkError extends Error {
                    constructor(m) { super(m); }
                }(`Invalid '${propName}' parameter value is provided. Valid value is a timestamp (10 digits integer).`);
            }
        }
        
        return propValue;
    }
}

module.exports = Event;
