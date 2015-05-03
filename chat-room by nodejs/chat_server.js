var server = require('socket.io')();

//用于 存储所有客户端 socket 和 name
var clients = new Array();  
// 用于获取时间
function getTime(){   
	var date = new Date();
	var time = "["+date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]";
	return time;
}

// 用于保存聊天记录
function storeContent(_name,_content,_time){       
	var Content = global.dbHandel.getModel('content');  
	Content.create({ 
		name: _name,
		data:_content,
		time:_time
	},function(err,doc){ 
		if(err){ 
			console.log(err);
		}else{ 
			console.log("store content :  success ");
		}
	});
}
//用于获取线上的用户，并更新用户列表
function getUserUp(sockets){
var User = global.dbHandel.getModel('user');  
    User.find({status: "up"},function(err,docs){ 
       	if(err){ 
       		console.log(err);
       	}else{ 
       		console.log('users list --default: '+docs);
       		// 更新用户列表
       		sockets.broadcast.emit('user_list',docs);   		
       		ssockes.emit('user_list',docs);   		
      			
       	}
    });
}
// 监听从connection事件
// 当浏览器链接到socke服务器时触发该事件
server.on('connection',function(socket){   
	console.log('socket.id '+socket.id+ ':  connecting'); 
    // 上线该用户
    getUserUp(socket);	
      
	// 创建用户对象client
      var client = { 
		Socket: socket,
		name: ''
      };

    socket.on("message",function(name){
	// 把用户的name保存在client数组中
    	client.name = name;                    
    	clients.push(client);                    
    
    	console.log("client-name:  "+client.name);
    // 广播所有人XXX来啦
    	socket.broadcast.emit("userIn","system@: 【"+client.name+"】-- a newer ! Let's welcome him ~");
      });
      socket.emit("system","system@:  Welcome ! Now chat with others"); 

//-------------------接收客户传来的聊天数据并处理-----------------
	
	// ---------------群聊状态--------------
	socket.on('say',function(content){         
		console.log("server: "+client.name + "  say : " + content);
		//置入数据库
		var time = getTime();
		// 发送出去
		socket.emit('user_say',client.name,time,content);
		socket.broadcast.emit('user_say',client.name,time,content);
		// 保存聊天的名字，内容，时间
		storeContent(client.name,content,time);   
	});

	// ------------私聊阶段（此处仅限双方都在线用户使用）-----------------
	socket.on("say_private",function(fromuser,touser,content){   
	// 检查该touser在不在clients里如果在赋值给toSocket
		var toSocket = "";
		for(var n in clients){ 
			if(clients[n].name === touser){     
				toSocket = clients[n].Socket;
			}
		}
		
		console.log("toSocket:  "+toSocket.id);
	// 如果touser在线，fromuser接收发送成功提示
		if(toSocket != ""){
		socket.emit("say_private_done",touser,content);   
		socket.emit("sayToYou",fromuser,content);     
		console.log(fromuser+" 给 "+touser+"发了份私信： "+content);
		}	
	});

  // 更新个人信息
 function updateInfo(User,oldName,uname,usex) {     
	User.update({name:oldName},{$set: {name: uname, sex: usex}},function(err,doc){   
		if(err){ 
				console.log(err);
			}
		// 更新数组clients中的值
		else{
			for(var n in clients){                       
			    if(clients[n].Socket === socket){     
					clients[n].name = uname;
				}
			}
	// 发送更新成功消息
	socket.emit("setInfoDone",oldName,uname,usex); 
	socket.broadcast.emit("userChangeInfo",oldName,uname,usex);
    
    console.log("【"+oldName+"】changes name to "+uname);
    
    global.userName = uname;
    getUserUp(socket);      
			}
	});
 }
	// 接收更改用户信息的请求并处理
	socket.on("setInfo",function(oldName,uname,usex){    
	console.log(oldName+"  "+uname+"  "+usex);
	// 查看昵称是否冲突并数据更新
	var User =global.dbHandel.getModel('user');
	// 查看是否冲突
	User.findOne({name:uname},function(err,doc){   
		if(err){ 
			console.log(err);
		}else if(doc){ 
			if(doc.name === oldName){ 
				console.log("用户名没有变化~");
				updateInfo(User,oldName,uname,usex);
			}else{
				console.log("用户名已存在");
				socket.emit("nameExists",uname);
			}
		}else{ 
			updateInfo(User,oldName,uname,usex);
		}
	});
	});

	// 接收到usser对查看聊天记录的请求
	socket.on("getChatList",function(uname){   
		var Content =global.dbHandel.getModel('content');
		Content.find({name: uname},function(err,docs){ 
			if(err){ 
				console.log(err);
			}else{
			// 将信息发送给客户端     
				socket.emit("getChatListDone",docs);
				console.log(uname+"  正在调取聊天记录");
				
			}
		});
	});

	// 当链接断开时
	socket.on('disconnect',function(){ 	  
		var Name = "";       
		for(var n in clients){                       
			if(clients[n].Socket === socket){    
				Name = clients[n].name;
			}
		}
		statusSetDown(Name,socket);
		
		socket.broadcast.emit('userOut',"system@: 【"+client.name+"】 leave ~");
		console.log(client.name + ':   disconnect');

	});
});
	// 下线处理
function statusSetDown(oName,ssocket){    
	var User = global.dbHandel.getModel('user');  
	User.update({name:oName},{$set: {status: 'down'}},function(err,doc){ 
		if(err){ 
			console.log(err);
		}else{ 
			console.log(oName+ "  is  down");
			// 更新客户信息
			getUserUp(ssocket);   
		}
	});
}
exports.listen = function(charServer){    
	return server.listen(charServer);    // listening 
};