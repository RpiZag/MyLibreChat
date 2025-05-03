const mongoose = require('mongoose');
const mongoMeili = require('~/models/plugins/mongoMeili');
const { messageSchema } = require('@librechat/data-schemas');

const searchEnabled = process.env.SEARCH && process.env.SEARCH.toLowerCase() === 'true';
const meiliEnabled = process.env.MEILI_HOST && process.env.MEILI_MASTER_KEY && searchEnabled;

if (meiliEnabled) {
  messageSchema.plugin(mongoMeili, {
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_MASTER_KEY,
    indexName: 'messages',
    primaryKey: 'messageId',
  });
}

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;
