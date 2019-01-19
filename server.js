var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var port        = 3000;
var mongoose    = require('mongoose');
var admin       = require('./server/admin');
var incubate    = require('./server/incubate');
var user        = require('./server/user');
var Login       = require('./server/models/login').login;
var Text        = require('./server/models/message').texts;
var SiText      = require('./server/models/message').sitexts;
var url         = require('url');

//connection to mongo db
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/cachehit');

var server      = app.listen(port,function(){
  console.log("magic happens at port" + port);
})


app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/', express.static(__dirname + '/client/'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.post('/login', function(req, res) {
    var email    = req.body.email;
    var password = req.body.password;
    Login.findOne({email: email}, function(err, result) {
      if(err){
        console.log("err");
        res.send({success: false, reason: "Login Failed" , group:"NULL"});
      }
      else if(result == null || !result) {
        res.send({success: false, reason: "Invalid email-id" , group:"NULL"});
      }
      else if(result.password == password){
        res.send({success: false, reason: "Login Successfull" , group:result.group , username :result.username});
      }
    });
 })

 app.post('/bitext',function(req,res){
    var m1 = req.body.mailer1;
    var m2 = req.body.mailer2;
    var mes = req.body.message;
    Text.find({$and: [{mailer1: m1}, {mailer2:m2}]} , function(err,result){
      if(err){
        console.log(err);
        res.send({success: false});
      }
      else if(result ==null || !result || result.length==0){
        var newmessage = {
          mailer1 : m1,
          mailer2 : m2,
          sender  : m1,
          texts   :[mes]
        }
        new_message = new Text(newmessage);
        new_message.save(function(err,body){
          if(err) {
            console.log(err);
            res.send({success:false});
          }
          else{
            console.log("bi message added success");
            res.send({success:true});
          }
        })
      }
      else
      {
        Text.update({$and: [{mailer1: m1}, {mailer2:m2}]},{$push:{texts:mes}},function(err,result){
          if(err)
          {
            console.log(err);
            res.send({success:false});
          }
          else{
            console.log("here")
            res.send({success:true});
          }
        })
      }
    })
 })

 app.post('/sitext',function(req,res){
   var newmessage = {
     sender : req.body.sender,
     message : req.body.message
   }
   new_message = new SiText(newmessage);
   new_message.save(function(err,body){
     if(err)
     {
       console.log(err);
       res.send({success:false});
     }
     else
     {
       console.log("Si message added successfully");
       res.send({success:true});
     }
   })
 })

 app.get('/globalmessages',function(req,res){
   SiText.find({},function(err,body){
     if(err)
     {
       console.log(err);
       res.send({success:false});
     }
     else
     {
       res.send({success:true,data:body});
     }
   })
 })

 app.get('/getmessages',function(req,res){
    var url_parts = url.parse(req.url, true);
    var myuser    = url_parts.query.messageuser;
    Text.find({$or: [{mailer1: myuser}, {mailer2:myuser}]} , function(err,result){
      if(err){
        console.log(err);
        res.send({success:false});
      }
      else{
        res.send({success:true,data:result});
      }
    })

 })