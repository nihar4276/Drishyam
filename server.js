var 
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  morgan = require('morgan');

var port = 3000;
	

var server=app.listen(port,function(){
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

