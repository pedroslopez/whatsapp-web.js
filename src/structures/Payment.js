const Base = require('./Base');

class Payment extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * The payment Id
         * @type {string}
         */
        this.id = data.id;

        /**
         * The payment currency
         * @type {string}
         */
        this.paymentCurrency = data.paymentCurrency;

        /**
         * The payment currency
         * @type {string}
         */
        this.paymentCurrency = data.paymentCurrency;

        /**
         * The payment ammount ( R$ 1.00 = 1000 )
         * @type {string}
         */
        this.paymentAmount1000 = data.paymentAmount1000;

        /**
         * The payment receiver
         * @type {string}
         */
        this.paymentMessageReceiverJid = data.paymentMessageReceiverJid;

        /**
         * The payment transaction timestamp
         * @type {string}
         */
        this.paymentTransactionTimestamp = data.paymentTransactionTimestamp;

        /**
         * The paymentStatus
         * @type {string}
         *
         * Possible Status
         * 0:UNKNOWN_STATUS
         * 1:PROCESSING
         * 2:SENT
         * 3:NEED_TO_ACCEPT
         * 4:COMPLETE
         * 5:COULD_NOT_COMPLETE
         * 6:REFUNDED
         * 7:EXPIRED
         * 8:REJECTED
         * 9:CANCELLED
         * 10:WAITING_FOR_PAYER
         * 11:WAITING
         */
        this.paymentStatus = data.paymentStatus;

        /**
         * Integer that represents the payment Text
         * @type {string}
         */
        this.paymentTxnStatus = data.paymentTxnStatus;

        /**
         * The note sent with the payment
         * @type {string}
         */
        this.paymentNote = !data.paymentNoteMsg ? undefined : data.paymentNoteMsg.body ?  data.paymentNoteMsg.body : undefined ;

        return super._patch(data);
    }

}

module.exports = Payment;