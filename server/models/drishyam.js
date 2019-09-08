var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var incidentSchema =  new Schema ({
    bankName        : String,
    reportTime      : Date,
    resolveTime     : Date,
    trash           : Boolean,
    plastic         : Boolean,
    disposable      : Boolean,
    dirtyFloor      : Boolean,
    status          : String,
    description     : String
});

var rankSchema     = new Schema ({
    bankName        : String,
    reportsCount    : Number,
    resolveCount    : Number,
    Score           : Number

})


module.exports.incidents    = mongoose.model('Incident', incidentSchema);
module.exports.ranks        = mongoose.model('Rank', rankSchema);
