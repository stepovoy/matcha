// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '1509161259142706', // your App ID
        'clientSecret'    : 'b86668a9f295e08e0627bc8b6b6ef267', // your App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email'

    },

    'googleAuth' : {
        'clientID'         : '352800419628-tfdu359gdo2379o714bbbaskpida16tn.apps.googleusercontent.com',
        'clientSecret'     : 'aANHoPxrxh1gNoiciOO08zMg',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
