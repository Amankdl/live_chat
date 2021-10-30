// Step 1 : Require mongoose module
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Step 2 : Create a schema with table details.
const ChatSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    time: {
        type : Date, 
        default: Date.now,
        required: true
    }
}, {
    timestamps: true
});


// Step 3 : Create model and export
const Chat = mongoose.model('Chat', ChatSchema); //Here name of variable is important.
module.exports = Chat;