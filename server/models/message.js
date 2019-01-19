var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var bimessageSchema = new Schema ({
    mailer1         : String,
    mailer2         : String,
    sender          : String,   
    texts           : [{type:String}]
});

var simessageSchema = new Schema ({
    sender      :    String,
    message     :    String
});

module.exports.texts    = mongoose.model('Text', bimessageSchema);
module.exports.sitexts  = mongoose.model('SiText', simessageSchema);
