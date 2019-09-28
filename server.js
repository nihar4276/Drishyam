var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var port = 3000;
var mongoose = require('mongoose');
var admin = require('./server/admin');
var incubate = require('./server/incubate');
var user = require('./server/user');
var Login = require('./server/models/login').login;
var Incident = require('./server/models/drishyam').incidents;
var Rank = require('./server/models/drishyam').ranks;
var fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: './uploads/' });
var url = require('url');
var path = require('path')
const TelegramBot = require('node-telegram-bot-api');
const token = '939575970:AAEZRyw0hxb9cy1gDKZ83UHaz8fHIH0DVNA';
const bot = new TelegramBot(token, { polling: true });
var request = require('request');

//connection to mongo db
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/drishyam');

var server = app.listen(port, function () {
  console.log("magic happens at port" + port);
})


app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/', express.static(__dirname + '/client/'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/index.html');
});


app.post('/signup', function (req, res) {

  var email = req.body.email;
  var pass = req.body.pass;
  Login.findOne({ email: email }, function (err, result) {
    console.log(result);
    if (err) {
      console.log("err");
      res.send({ success: false, reason: "Login Failed", group: "NULL" });
    }
    else {
      var signup = {
        email: email,
        password: pass,
        type: "branch"
      }
      signup = new Login(signup);
      signup.save(function (err, data) {
        if (err) {
          console.log(err);
          res.send({ success: false, reason: "Email ID already registered" });
        }
        else {
          console.log("Signup Successful");
          res.send({ success: true, reason: "Signup Successful", email: email });
        }
      })
    }
  })
})


app.post('/login', function (req, res) {
  var email = req.body.email;
  var pass = req.body.pass;
  console.log(email);
  console.log(pass);
  Login.findOne({ email: email }, function (err, result) {
    console.log(result);
    if (err) {
      console.log("err");
      res.send({ success: false, reason: "Login Failed", type: null });
    }
    else if (result == null || !result) {
      res.send({ success: false, reason: "Invalid email-id", type: null });
    }
    else if (result.password == pass) {
      res.send({ success: true, reason: "Login Successful", type: result.type, username: result.email });
    }
    else {
      res.send({ success: false, reason: "Invalid email-id or password", type: null });
    }
  });
})

app.get('/video', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var username = url_parts.query.username;
  console.log(req.url);
  var path = "video_samples/" + username + ".mp4";
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  fs.createReadStream(path).pipe(res);
});

app.get('/incident', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var username = url_parts.query.username;

  if (username == "central@synd.com") {
    Incident.find({}, function (err, result) {
      if (err) {
        res.send([{ success: false, reason: err }]);
      }
      else {
        res.send([{ success: true, data: result }]);
      }
    })
  }
  else {
    Incident.find({ bankName: username }, function (err, result) {
      if (err) {
        res.send([{ success: false, reason: err }]);
      }
      else {
        res.send([{ success: true, data: result }]);
      }
    })
  }
})

app.get('/incident-status', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var username = url_parts.query.username;

  Incident.find({ bankName: username, status: "Active" }, function (err, result) {
    if (err) {
      res.send([{ success: false, reason: err }]);
    }
    else {
      res.send([{ success: true, data: result }]);
    }
  })
})

app.post('/incident', function (req, res) {


  var description = "The Ambience was disturbed because of ";
  if (req.body.trash)
    description += "trash ,"
  if (req.body.plastic)
    description += "plastic ,"
  if (req.body.disposable)
    description += "disposable cups ,"
  if (req.body.dirtyFloor)
    description += "dirty floor "

  description += "were detected in the office environment";


  // console.log(description);
  var incident = {
    bankName: req.body.bankName,
    reportTime: new Date(),
    resolveTime: null,
    trash: req.body.trash,
    plastic: req.body.plastic,
    disposable: req.body.disposable,
    dirtyFloor: req.body.dirtyFloor,
    status: "Active",
    description: description
  }

  incident = new Incident(incident);
  incident.save(function (err, result) {
    if (err) {
      console.log(err)
      res.send([{ success: false, reason: err }]);
    }
    else {

      var rank = new Rank(null);
      Rank.findOne({ bankName: req.body.bankName }, function (err, data) {
        if (err) {
          console.log(err);
        }
        else {
          if (data == null || !data) {
            var detail = {
              bankName: req.body.bankName,
              reportsCount: 1,
              resolveCount: 0,
              Score: 0
            }

            detail = new Rank(detail);
            detail.save(function (err, data) {
              if (err) {
                console.log(err);
              }
              else {
                console.log(data);
              }
            })
          }

          else {
            Rank.update({ bankName: req.body.bankName }, { $inc: { reportsCount: +1 } }, function (err, data) {
              if (err) {
                console.log(err);
              }
              else {
                console.log(data);
              }
            })
          }
        }
      })
      res.send([{ success: true, data: result }]);
    }
  })
})


app.post('/incident-resolve', function (req, res) {
  var id = req.body._id;
  console.log(id)
  Incident.find({ _id: id }, function (err, result) {
    if (err) {
      res.send({ success: false, reason: err });
    }
    else if (!result.length) {
      res.send({ success: false, reason: "No Matching incident" });
    }
    else {
      var now = new Date();
      Incident.updateOne({ _id: id }, { "resolveTime": now, status: "Resolved" }, { upsert: true }, function (err, result) {
        if (err) {
          res.send({ success: false, reason: err });
        }
        else {
          Incident.findOne({ _id: id }, function (err, data) {
            if (err) {
              console.log(err);
            }
            else {
              Rank.updateOne({ bankName: data.bankName }, { $inc: { resolveCount: +1, Score: +10 } }, function (err, data) {
                if (err) {
                  console.log(err);
                }
                else {
                  console.log(data);
                }
              })
            }

          })
          res.send({ success: true, data: result });
        }
      })
    }
  })
})


app.get('/ranks', function (req, res) {
  Rank.find({}, function (err, body) {
    if (err) {
      console.log(err);
      res.send([{ success: false, reason: err }]);
    }
    else {
      res.send([{ success: true, data: body }]);
    }
  })
})

app.post('/store_snapshot', function (req, res) {
  if (req.file) console.log(req.file);
  console.log(req.files)
  //const targetPath = path.join(__dirname, "./uploads/image.png");
  res.send({ "wjbnfkj": "dknf" })

  // fs.writeFile('logo.png', imagedata, 'binary', function (err) {
  //   if (err) throw err
  //   console.log('File saved.')
  // })


})

//------------ Telegram code -------- // 
bot.onText(/\/echo (alerts.+)/, (msg, match) => {

  console.log(match)
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendPhoto(msg.chat.id, "./uploads/image.jpg", { caption: "Here we go ! \nThis is just a caption " });
  bot.sendMessage(chatId, "The Ambience was disturbed because of trash ,plastic ,disposable cups ,were detected in the office environment in room 124");
});


chat_ids = [410100721]
id_to_resolve = "5d74fa008289802de9f609db"
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg)


  // alert check
  if (msg.text.toLowerCase().includes("alerts") || msg.text.toLowerCase().includes("alert") || msg.text.toLowerCase().includes("alert de")) {

    request.get(
      'http://206.189.141.49:3000/incident-status?username=branch1@synd.com',
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body)
        }
      }
    );


    bot.sendPhoto(chatId, "./uploads/first.jpg", { caption: " Image captured at room 124 of Manipal Branch" });

    bot.sendMessage(chatId, "The Ambience was disturbed because of trash ,plastic ,disposable cups ,were detected in the office environment in room 124 of Manipal Branch", {
      "reply_markup": {
        "keyboard": [["Resolve"]]
      }
    });
  }
  else if (msg.text.toLowerCase().includes("resolve")) {

    request.post(
      'http://206.189.141.49:3000/incident-resolve',
      { json: { "_id": id_to_resolve } },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if (body.success) {
            bot.sendMessage(chatId, "Alert successfully resolved!");
          }
        }
      }
    );

  }
  else
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Received your message ' + msg.from.first_name + " \nRest for now amigo, We have no new alerts for ya! ");


});
