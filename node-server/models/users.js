// Step 1 : Require mongoose module
const mongoose = require('mongoose');
var crypto = require('crypto');
const Schema = mongoose.Schema;

// Step 2 : Create a schema with table details.
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    salt: String
}, {
    timestamps: true
});


// Method to set salt and hash the password for a user 
UserSchema.methods.setPassword = function (password) {

    // Creating a unique salt for a particular user 
    this.salt = crypto.randomBytes(16).toString('hex');

    // Hashing user's salt and password with 1000 iterations, 

    this.hash = crypto.pbkdf2Sync(password, this.salt,
        1000, 64, `sha512`).toString(`hex`);
};

// Method to check the entered password is correct or not 
UserSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password,
        this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};

// Step 3 : Create model and export
const Users = mongoose.model('Users', UserSchema); //Here name of variable is important.
module.exports = Users;