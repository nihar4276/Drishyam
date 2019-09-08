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
var Incident    = require('./server/models/drishyam').incidents;
var Rank        = require('./server/models/drishyam').ranks;


var url         = require('url');
var fs          = require('fs');

//connection to mongo db
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/drishyam');

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


app.post('/signup',function(req,res){

  var email = req.body.email;
  var pass  = req.body.pass;
  Login.findOne({email:email},function(err,result){
    console.log(result);
    if(err){
      console.log("err");
      res.send({success: false, reason: "Login Failed" , group:"NULL"});
    }
    else
    {
      var signup = {
        email:email,
        password:pass,
        type:"branch"
      }
      signup = new Login(signup);
      signup.save(function(err,data){
        if(err) {
          console.log(err);
          res.send({success:false,reason:"Email ID already registered"});
        }
        else{
          console.log("Signup Successful");
          res.send({success:true,reason:"Signup Successful",email:email});
        }
      })
    }    
  })
})


app.post('/login', function(req, res) {
    var email    = req.body.email;
    var pass = req.body.pass;
    console.log(email);
    console.log(pass);
    Login.findOne({email: email}, function(err, result) {
      console.log(result);
      if(err){
        console.log("err");
        res.send({success: false, reason: "Login Failed" , type:null});
      }
      else if(result == null || !result) {
        res.send({success: false, reason: "Invalid email-id" ,type:null});
      }
      else if(result.password == pass){
        res.send({success: true, reason: "Login Successful" , type:result.type , username :result.email});
      }
      else{
        res.send({success: false, reason: "Invalid email-id or password" ,type:null});
      }
    });
 })

 app.get('/video', function(req, res) {
  var url_parts = url.parse(req.url, true);
  var username = url_parts.query.username;
  console.log(req.url);
  var path = "video_samples/"+username+".mp4";
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
    fs.createReadStream(path).pipe(res);
});

app.get('/incident',function(req,res){
  var url_parts = url.parse(req.url, true);
  var username = url_parts.query.username;

  if(username=="central@synd.com"){
    Incident.find({},function(err,result){
      if(err)
      {
        res.send([{success:false,reason:err}]);
      }
      else
      {
        res.send([{success:true,data:result}]);
      }
    })
  }
  else
  {
    Incident.find({bankName:username},function(err,result){
      if(err)
      {
        res.send([{success:false,reason:err}]);
      }
      else
      {
        res.send([{success:true,data:result}]);
      }
    })
  }
})

app.post('/incident',function(req,res){


    var description = "The Ambience was disturbed because of ";
    if(req.body.trash)
    description+="trash ,"
    if(req.body.plastic)
    description+="plastic ,"
    if(req.body.disposable)
    description+="disposable cups ,"
    if(req.body.dirtyFloor)
    description+="dirty floor "

    description+="were detected in the office environment";

    
    // console.log(description);
    var incident = {
      bankName:req.body.bankName,
      reportTime: new Date(),
      resolveTime: null,
      trash:req.body.trash,
      plastic:req.body.plastic,
      disposable:req.body.disposable,
      dirtyFloor:req.body.dirtyFloor,
      status:"Active",
      description:description
    }  

    incident = new Incident(incident);
    incident.save(function(err,result){
      if(err)
      {
        console.log(err)
        res.send([{success:false,reason:err}]);
      }
      else
      {

        var rank = new Rank(null);
        Rank.findOne({bankName:req.body.bankName},function(err,data){
          if(err)
          {
            console.log(err);
          }
          else
          {
            if(data == null || !data)
            {
              var detail = {
                bankName : req.body.bankName,
                reportsCount : 1,
                resolveCount: 0,
                Score:0
              }

              detail = new Rank(detail);
              detail.save(function(err,data){
                if(err)
                {
                  console.log(err);
                }
                else
                {
                  console.log(data);
                }
              })
            }

            else
            {
              Rank.update({bankName:req.body.bankName},{$inc:{reportsCount:+1}},function(err,data){
                if(err)
                {
                  console.log(err);
                }
                else
                {
                  console.log(data);
                }
              })
            }
          }
        })
        res.send([{success:true,data:result}]);
      }
    })
})


app.post('/incident-resolve',function(req,res){
    var id = req.body._id;
    Incident.find({_id:id},function(err,result){
      if(err)
      {
        res.send({success:false,reason:err});
      }
      else if(!result.length)
      {
        res.send({success:false,reason:"No Matching incident"});
      }
      else
      {
        var now = new Date();
        Incident.updateOne({_id:id},{"resolveTime":now,status:"Resolved"},{upsert: true},function(err,result){
          if(err)
          {
            res.send({success:false,reason:err});
          }
          else
          {
            Incident.findOne({_id:id},function(err,data){
              if(err)
              {
                console.log(err);
              }
              else
              {
                Rank.updateOne({bankName:data.bankName},{$inc:{resolveCount:+1,Score:+10}},function(err,data){
                  if(err)
                  {
                    console.log(err);
                  }
                  else
                  {
                    console.log(data);
                  }
                })
              }

            })
            res.send({success:true,data:result});
          }
        })
      }
    })
})


 app.get('/ranks',function(req,res){
   Rank.find({},function(err,body){
     if(err)
     {
       console.log(err);
       res.send([{success:false,reason:err}]);
     }
     else
     {
       res.send([{success:true,data:body}]);
     }
   })
 })
