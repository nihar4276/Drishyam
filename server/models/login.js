var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var loginSchema = new Schema ({
    email           : {type: String, index: {unique: true, dropDups: true}},
    password        : String,
    type            : String
});

module.exports.login = mongoose.model('Login', loginSchema);
