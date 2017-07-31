// load the things we need
var mongoose = require('mongoose');


// define the schema for our chat model
var chatSchema = mongoose.Schema({
    sender    : String,
    recipient : String,
    message   : String
},
    {
        timestamps: true
    }
);

// create the model for chats and expose it to our app
module.exports = mongoose.model('Chat', chatSchema);