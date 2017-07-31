// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        name         : String,
        login        : String,
        password     : String,
        gender       : String,
        orient       : String,
        about        : String,
        age          : Number,
        agegap       : Number,
        rating       : Number,
        online       : Date,
        avatar       : Buffer,
        img1         : Buffer,
        img2         : Buffer,
        img3         : Buffer,
        img4         : Buffer,
        tags         : Array,
        visits       : Array,
        likes        : Array,
        position     : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
