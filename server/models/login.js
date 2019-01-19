var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var loginSchema = new Schema ({
    email           : {type: String, index: {unique: true, dropDups: true}},
    password        : String,   
    username        : String,
    group           : String
});

module.exports.login = mongoose.model('Login', loginSchema);
