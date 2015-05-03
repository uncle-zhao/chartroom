var express = require('express');
var router = express.Router();

 // GET to index  
router.get('/', function(req, res,next) {
 	res.redirect("/login");
});

 // GET  to login .
router.route("/login").get(function(req,res){    
	res.render("login",{title:'User Login'});
})

router.route("/login").post(function(req,res){ 					   
	var User = global.dbHandel.getModel('user');  
	var uname = req.body.uname;				
	User.findOne({name:uname},function(err,doc){  
	 // 查询数据库中的匹配信息
		if(err){ 										
			res.send(500);
			console.log(err);
		}else if(!doc){ 							
			req.session.error = '用户名不存在';
			res.send(404);							
		
		}else{ 
			if(req.body.upwd != doc.password){ 	
				req.session.error = "密码错误";
				res.send(404);
			
			}else{
			// 匹配成功 			
				req.session.user = doc;
				statusSetUp(uname);   
				res.send(200);
			
			}
		}
	});
});
// 登陆上线，修改数据库的status的值
function statusSetUp(oName){    
	var User = global.dbHandel.getModel('user');  
	User.update({name:oName},{$set: {status: 'up'}},function(err,doc){ 
		if(err){ 
			console.log(err);
		}else{ 
			console.log(oName+ "  is  up");
		}
	});
}

// get to register
router.route("/register").get(function(req,res){    
	res.render("register",{title:'User register'});
})

// post to register
router.route("/register").post(function(req,res){ 
	 //这里的User就是从model中获取user对象，
	var User = global.dbHandel.getModel('user');
	var uname = req.body.uname;
	var upwd = req.body.upwd;
	User.findOne({name: uname},function(err,doc){   
		if(err){ 
			res.send(500);
			req.session.error =  '网络异常错误！';
			console.log(err);
		}else if(doc){ 
			req.session.error = '用户名已存在！';
			res.send(500);
		}else{ 
			User.create({ 							
				name: uname,
				password: upwd
			},function(err,doc){ 
				 if (err) {
                        res.send(500);
                        console.log(err);
                    } else {
                        req.session.error = '用户名创建成功！';
                        res.send(200);
                    }
                  });
		}
	});
});

 // GET to home
router.get("/home",function(req,res){
// 判断是否已登录 
	if(!req.session.user){ 					
		req.session.error = "请先登录"
		res.redirect("/login");				
	}
	res.render("home",{title:'Home'});         
});

// GET to logout 
router.get("/logout",function(req,res){    
	req.session.user = null;
	req.session.error = null;
	res.redirect("/login");
});

module.exports = router;