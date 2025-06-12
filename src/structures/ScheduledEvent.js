'use strict';

/**
 * ScheduledEvent send options
 * @typedef {Object} ScheduledEventSendOptions
 * @property {?string} description The scheduled event description
 * @property {?Date} endTime The end time of the event
 * @property {?string} location The location of the event
 * @property {?string} callType The type of a WhatsApp call link to generate, valid values are: `video` | `voice`
 * @property {boolean} [isEventCanceled = false] Indicates if a scheduled event should be sent as an already canceled
 * @property {?Array<number>} messageSecret The custom message secret, can be used as an event ID. NOTE: it has to be a unique vector with a length of 32
 */

/** Represents a ScheduledEvent on WhatsApp */
class ScheduledEvent {
    /**
     * @param {string} name
     * @param {Date} startTime
     * @param {ScheduledEventSendOptions} options
     */
    constructor(name, startTime, options = {}) {
        /**
         * The name of the event
         * @type {string}
         */
        this.name = this._validateInputs('name', name).trim();

        /**
         * The start time of the event
         * @type {number}
         */
        this.startTimeTs = Math.floor(startTime.getTime() / 1000);

        /**
         * The send options for the event
         * @type {Object}
         */
        this.eventSendOptions = {
            description: options.description?.trim(),
            endTimeTs: options.endTime ? Math.floor(options.endTime.getTime() / 1000) : null,
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
            throw new class CreateScheduledEventError extends Error {
                constructor(m) { super(m); }
            }(`Empty '${propName}' parameter value is provided.`);
        }

        if (propName === 'callType' && propValue && !['video', 'voice'].includes(propValue)) {
            throw new class CreateScheduledEventError extends Error {
                constructor(m) { super(m); }
            }(`Invalid '${propName}' parameter value is provided. Valid values are: 'voice' | 'video'.`);
        }
        
        return propValue;
    }
}

module.exports = ScheduledEvent;
