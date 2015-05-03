var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var session = require('express-session');

// 路由控制
var routes = require('./routes/index');
var users = require('./routes/users');

// 全局获取数据库model
global.dbHandel = require('./database/dbHandel'); 
global.db = mongoose.connect("mongodb://127.0.0.1:27017/nodedb");

// 创建项目实例
var app = express();

// 会话
app.use(session({ 
	secret: 'secret',
	cookie:{ 
		maxAge: 1000*60*600
	}
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html',require("ejs").__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
// 获取session的值 
	res.locals.user = req.session.user;
// 获取错误信息
	var err = req.session.error;
	delete req.session.error;
	res.locals.message = "";
	if(err){ 
		res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
	}
	next();
});

// 匹配路径和路由
app.use('/', routes);  
app.use('/users', users);
app.use('/login',routes);
app.use('/register',routes);
app.use('/home',routes); 
app.use("/logout",routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
