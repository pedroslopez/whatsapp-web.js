class ScheduledMessage {
  /**
   * Represents a message scheduled to be sent at a future time.
   * @param {Object} config
   * @param {string} config.chatId - The ID of the chat where the message will be sent.
   * @param {string} config.content - The message content.
   * @param {Date} config.sendAt - The scheduled date and time.
   * @param {string} [config.type='text'] - Type of message: 'text', 'media', etc.
   */
  constructor({ chatId, content, sendAt, type = 'text' }) {
    if (!chatId || !content || !(sendAt instanceof Date)) {
      throw new Error('Invalid ScheduledMessage parameters.');
    }

    this.chatId = chatId;
    this.content = content;
    this.sendAt = sendAt;
    this.type = type;
    this.status = 'pending'; // 'pending', 'sent', 'failed'
    this.createdAt = new Date();
  }

  /**
   * Checks if the message is ready to be sent.
   * @returns {boolean}
   */
  isDue() {
    return new Date() >= this.sendAt;
  }

  /**
   * Marks the message as sent.
   */
  markSent() {
    this.status = 'sent';
    this.sentAt = new Date();
  }

  /**
   * Marks the message as failed.
   * @param {string} reason
   */
  markFailed(reason) {
    this.status = 'failed';
    this.failedReason = reason;
    this.failedAt = new Date();
  }

  /**
   * Returns a summary of the scheduled message.
   * @returns {Object}
   */
  toJSON() {
    return {
      chatId: this.chatId,
      content: this.content,
      sendAt: this.sendAt,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      sentAt: this.sentAt || null,
      failedAt: this.failedAt || null,
      failedReason: this.failedReason || null
    };
  }
}

module.exports = ScheduledMessage;
