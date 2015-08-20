var dungeon;

dungeonChatPluginInit = function(pcontext)
{
	if(dungeon!=null)
	{
		dungeon.destroy();
	}
	dungeon = new Dungeon(pcontext);
}


function Engine()
{
	this.systems = [];
	this.entities = [];
}{
	Engine.prototype.addEntity = function(entity)
	{
		log("Adding entity:" +entity.id);
		this.entities.push(entity);
	}

	Engine.prototype.addSystem = function(system)
	{
		this.systems.push(system);
	}

	Engine.prototype.update = function()
	{
		for(var system in this.systems)
		{
			this.systems[system].update(this.entities);
		}
	}
}

Entity.prototype._entityID=0;
function Entity()
{
	this.id = Entity.prototype._entityID++;
	this.components = {};
}{
	Entity.prototype.addComponent = function(component)
	{
		if(this.components[component.name]==null)
		{
			log("Adding component:"+component.name);
		}
		
		this.components[component.name] = component;
	}

	Entity.prototype.removeComponent = function(componentName)
	{
		log("Removing component:"+componentName);
		delete this.components[componentName];
	}
}

function LevelGridSystem()
{
	this.grid = [];
	this.gridSize = [0,0];
	this.gridWidth = 100;
	this.gridHeight = 75;
	
}{
	LevelGridSystem.prototype.setGrid=function(level)
	{
		this.grid = level;
		this.gridSize = [this.grid.length,this.grid[0].length];
	}
	
	LevelGridSystem.prototype.setEntity=function(x,y,entity)
	{
		if(this.grid[x][y]!=null)
		{
			this.grid[x][y].addComponent({name:"entityInvade",entity:entity});
		}
		this.grid[x][y] = entity;
	}
	
	LevelGridSystem.prototype.update=function(entities)
	{
		for	(var i = 0 ; i<entities.length;i++)
		{
			var components = entities[i].components;
			var position = components.position;
			
			if(position==null) continue;
			
			if(components.camera) continue;
			
			//entities[i].addComponent({name:"debugText",text:"Grid:"+position.x+", "+position.y});
			
			var renderPosition = components.renderPosition;
			if(renderPosition == null)
			{
				renderPosition = {name:"renderPosition",x:0,y:0};
				entities[i].addComponent(renderPosition);
			}
			
			var move = components.move;
			if(move)
			{
				if(move.gridChecked!=true)
				{
					move.gridChecked=true;

					move.x += position.x;
					move.y += position.y;
					
					move.currentX = position.x*this.gridWidth;
					move.currentY = position.y*this.gridHeight;
					move.targetX = move.x*this.gridWidth;
					move.targetY = move.y*this.gridHeight;
					move.speed = move.speed || 4;
				}
				
				var finished = true;
				
				var dif = move.targetX-move.currentX;
				
				if (dif>0)
				{
					move.currentX += Math.min(dif,move.speed);
					finished = false;
				}
				else if (dif<0)
				{
					move.currentX -= Math.min(-dif,move.speed);
					finished = false;
				}
				
				dif = move.targetY - move.currentY;
				if (dif>0)
				{
					move.currentY += Math.min(dif,move.speed);
					finished = false;
				}
				else if (dif<0)
				{
					move.currentY -= Math.min(-dif,move.speed);
					finished = false;
				}
				
				if(finished)
				{
					position.x = move.x;
					position.y = move.y;
					
					renderPosition.x = position.x*this.gridWidth;
					renderPosition.y = position.y*this.gridHeight;	
					
					entities[i].removeComponent(move.name);
					move=null;
				}
				else
				{
					renderPosition.x = move.currentX;
					renderPosition.y = move.currentY;
				}
			}
			else
			{
				renderPosition.x = position.x*this.gridWidth;
				renderPosition.y = position.y*this.gridHeight;	
			}
		}
	}
}

function drawText(ctx,text,x,y,size,align)
{
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = size+"px Helvetica";
	ctx.textAlign = align || "center";
	ctx.textBaseline = "top";
	ctx.fillText(text, x, y);
}

function RenderSystem(ctx)
{
	this.context=ctx;
	this.images = {};
	
	this.offset = [100,100];
	
	this.imageMapping = {
		characterSmall:"js/plugin/dungeon/character1.png",
		character:"js/plugin/dungeon/Character Boy.png",
		dirt:"js/plugin/dungeon/Dirt Block.png",
		grass:"js/plugin/dungeon/Grass Block.png",
		dirt:"js/plugin/dungeon/Dirt Block.png",
		stone:"js/plugin/dungeon/Stone Block.png",
		chest:"js/plugin/dungeon/Chest Closed.png",
		chestOpen:"js/plugin/dungeon/Chest Open.png"
	};
}{
	RenderSystem.prototype.drawText=function(ctx,text,x,y,size,align)
	{
		drawText(ctx,text,x+this.offset[0], y+this.offset[1],size,align);
	}
	
	RenderSystem.prototype.update=function(entities)
	{
		for	(var i = 0 ; i<entities.length;i++)
		{
			var components = entities[i].components;
			
			var position = components.renderPosition;
			var image = components.image;
			var text = components.text;
			var nameLabel = components.nameLabel;
			var debugText = components.debugText;
			
			if(components.camera && components.position)
			{
				//log("CAMERA MOVE!");
				this.offset[0] += components.position.x;
				this.offset[1] += components.position.y;
				components.position.x = 0;
				components.position.y = 0;
				//entities[i].removeComponent(position.name);
				continue;
			}
			
			if(position==null) continue;
			
			if(image)
			{
				
				var img = this.getImage(image.source);
				if(img!=null)
				{
					this.context.drawImage(
						img,
						position.x-img.width/2+this.offset[0],
						position.y-img.height/2+this.offset[1],
						img.width,
						img.height
					);
				}
			}
			
			if(text)
			{
				if(text.ticks==null)
				{
					text.ticks=60*10;
				}
				if(text.ticks-->0)
				{
					var offsetY = -60;
					this.drawText(this.context,text.text,position.x,position.y+offsetY,16);
				}
				else
				{
					entities[i].removeComponent(text.name);
					text=null;
				}
			}
			if(debugText)
			{
				this.drawText(this.context,debugText.text,position.x,position.y,8);
			}
			
			if(nameLabel)
			{
				var offsetY = 60;
				this.drawText(this.context,nameLabel.text,position.x,position.y+offsetY,24);
			}
		}
	}
	
	RenderSystem.prototype.getImage=function(source)
	{
		if(this.images[source]==null)
		{
			var img = new Image();
			img.src = this.imageMapping[source] || source;
			this.images[source] = img;
		}
		return this.images[source];
	}
}

function Dungeon(pluginContext)
{
	this.pluginContext = pluginContext;
	this.context=null;
	this.canvas=null;
	this.dungeonWidth=320;
	this.dungeonHeight=240;
	this.container=null;
	this.engine = null;
	this.users = {};
	this.updateRate = 16;
	this.camera;
	
	this.titleText = "Welcome to "+this.pluginContext.channel+" Dungeon!";
	
	this.init();
	
	this.update();
	
	log("Created dungeon");
}{
	Dungeon.prototype.update = function()
	{
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height); // Clears the canvas
		
		this.engine.update();
		//Title text
		drawText(this.context,this.titleText,10,10,24,"left");
	}

	Dungeon.prototype.init = function()
	{
		log("Dung init! "+this);
		
		var h = $(window).height();
		var w = $(window).width();
		
		var top = 80;
		var left = 155;
		
		this.dungeonWidth=w-left-10;//Scrollbar
		this.dungeonHeight=h*0.88-top;
		
		this.container = document.createElement("div");
		this.container.id = "dungeon-container";
		this.container.style.display = "block";
		this.container.style.width = this.dungeonWidth;
		this.container.style.height = this.dungeonHeight;
		this.container.style.position = "fixed";
		this.container.style.top = top+"px";
		this.container.style.left = left+"px";
		this.container.style.border = "5px solid #333";
		this.container.style.background = "#000";
		this.container.style.zIndex = 2;
		
		this.canvas = document.createElement("canvas");
		this.canvas.id="dungeon-canvas";
		this.canvas.setAttribute("width",this.dungeonWidth);
		this.canvas.setAttribute("height",this.dungeonHeight);
		this.canvas.style.width = this.dungeonWidth;
		this.canvas.style.height = this.dungeonHeight;
		this.canvas.style.cursor = "normal";
			
		document.body.appendChild(this.container);
		this.container.appendChild(this.canvas);
					
		this.context = this.canvas.getContext("2d");
		
		this.level = new LevelGridSystem();
		
		this.engine = new Engine();
		this.engine.addSystem(this.level);
		this.engine.addSystem(new RenderSystem(this.context));
		
		this.camera = new Entity();
		this.camera.addComponent({name:"camera"});
		this.engine.addEntity(this.camera);
		
		this.bindCallbacks();
		
		this.createLevel();
		
		this.restoreHistory();
		
		this.pluginContext.addLine("Hello world",this.pluginContext.getChannelRealName());
		
		this.updateIntervalID = setInterval(function(){dungeon.update();},this.updateRate);
		
		this.mouseDown=false;
		this.mousePos = {x:0,y:0};
		
		$(this.container).mousedown(function(e)
		{
			dungeon.mouseDown=true;
			dungeon.mousePos.x = e.pageX;
			dungeon.mousePos.y = e.pageY;
		});
		$(this.container).mouseup(function(e)
		{
			dungeon.mouseDown=false;
		});
		$(this.container).mousemove(function(e)
		{
			if(dungeon.mouseDown)
			{
				var x = e.pageX-dungeon.mousePos.x;
				var y = e.pageY-dungeon.mousePos.y;
				dungeon.moveCamera(x,y);
				dungeon.mousePos.x = e.pageX;
				dungeon.mousePos.y = e.pageY;
			}
		});
		
		$(document).keydown(function(e)
		{
			switch(e.keyCode)
			{
				case 37:
					dungeon.moveLeft();
					e.preventDefault();
					break;
				case 39:
					dungeon.moveRight();
					e.preventDefault();
					break;
				case 38:
					dungeon.moveUp();
					e.preventDefault();
					break;
				case 40:
					dungeon.moveDown();
					e.preventDefault();
					break;
			}
		});
	}
	
	Dungeon.prototype.moveCamera = function(x,y)
	{
		this.camera.addComponent({name:"position",x:x,y:y});
	}

	Dungeon.prototype.restoreHistory = function()
	{
		var history = this.pluginContext.history;
		history=null;
		if(history!=null)
		{
			for(var index in history)
			{
				this.onChat(
					history[index][0],
					history[index][1],
					history[index][2],
					history[index][3],
					this.pluginContext.getChannelRealName()
				);
			}
		}
		
		//TODO load from cookie?
		
		//Send initialization to chat
		this.pluginContext.addLine("+position"+JSON.stringify({x:2,y:2}),this.pluginContext.getChannelRealName());
		this.pluginContext.addLine("+image"+JSON.stringify({source:"character"}),this.pluginContext.getChannelRealName());
			
		//entity.addComponent({name:"position",x:100,y:100});
		//entity.addComponent({name:"nameLabel",text:name});
		//entity.addComponent({name:"image",source:"character"});
	}

	Dungeon.prototype.getUserEntity = function(name)
	{
		if(this.users[name]==null)
		{
			log("New user: "+name);
			
			var entity = new Entity();
			this.users[name] = entity;
			this.engine.addEntity(entity);
			//Give Name Label to this
			this.pluginContext.addLine("+nameLabel"+JSON.stringify({text:name}),this.pluginContext.getChannelRealName());
		}
		return this.users[name];
	}

	Dungeon.prototype.bindCallbacks = function()
	{
		this.pluginContext.onClose = function() {dungeon.destroy();};
		this.pluginContext.onAddLine = function(time, who, what,marker,channel) {dungeon.onChat(time,who,what,marker,channel);};
	}

	Dungeon.prototype.onChat = function(time,who,what,marker,channel)
	{
		if(who=="SYSTEM" || marker == true)
		{
			this.titleText = who+": "+what;
			return;
		}
		
		//log("Dungeon Chat: "+time+who+what+marker+channel);
		var entity = this.getUserEntity(who);
		
		if(what[0]=="+")
		{
			try{
				var data = unwindHtml(what).split("{");
				var componentName = data.shift().substring(1);
				data = "{"+data.join("{");
				var component = JSON.parse(data);
				component.name = componentName;
				entity.addComponent(component);
				this.update();
			}
			catch(e)
			{
				//log("Error parsing:"+what);
			}
		}
		else if(what[0]=="-")
		{
			var componentName = what.substring(1);
			entity.removeComponent(componentName);
			this.update();
		}
		else
		{
			entity.addComponent({name:"text",text:what});
		}
	}
	
	Dungeon.prototype.createLevel=function()
	{
		var size = [7,4];
		
		var levelGrid = [];
		
		for(var i = 0; i<size[0]; i++)
		{
			var ar = [];
			for(var j = 0; j<size[1]; j++)
			{
				ar.push(null);
				var entity = new Entity();
				entity.addComponent({name:"position",x:i,y:j});
				entity.addComponent({name:"image",source:"dirt"});
				
				this.engine.addEntity(entity);
			}
			levelGrid.push(ar);
		}
		this.level.setGrid(levelGrid);
		this.createChest(3,6);
	}
	
	Dungeon.prototype.createChest=function(x,y)
	{
		var entity = new Entity();
		entity.addComponent({name:"position",x:x*this.blockSizeX,y:y*this.blockSizeY});
		entity.addComponent({name:"image",source:"chest"});
		this.engine.addEntity(entity);
		this.level.setEntity(x,y,entity);
	}

	Dungeon.prototype.moveLeft=function()
	{
		this.pluginContext.addLine('+move{"x":-1,"y":0,"duration":1}',this.pluginContext.getChannelRealName());
	}
	Dungeon.prototype.moveRight=function()
	{
		this.pluginContext.addLine('+move{"x":1,"y":0,"duration":1}',this.pluginContext.getChannelRealName());
	}
	Dungeon.prototype.moveUp=function()
	{
		this.pluginContext.addLine('+move{"x":0,"y":-1,"duration":1}',this.pluginContext.getChannelRealName());
	}
	Dungeon.prototype.moveDown=function()
	{
		this.pluginContext.addLine('+move{"x":0,"y":1,"duration":1}',this.pluginContext.getChannelRealName());
	}

	Dungeon.prototype.destroy = function()
	{
		$(this.container).hide();
		$(this.container).remove();
		log("Dungeon destroy! "+this);
	}
}

/*
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
var context;
var pluginContext;
var userColor = "#000000";
var userSize = 2;
var container;
var userImage;
var chatMsg = "";

function initValues()
{
	clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();
	paint = false;
	context = null;
	pluginContext = null;
	userColor = "#000000";
	userSize = 2;
	container = null;
	userImage = null;
	chatMsg = "";
}

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
  
  if(dragging!=true)
  {	
	chatMsg = userColor+","+userSize+";";
  }
  else
  {
	chatMsg += x+","+y+";";
  }
}

function onStopDraw()
{
	paint=false;
	if(chatMsg.length>3)
	{
		pluginContext.addLine(chatMsg,pluginContext.channel+"#whiteboard");
	}
	chatMsg="";
	
	//context.closePath();
	context.stroke();
}

function clear()
{
	context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
}

function onStartDraw(x,y)
{
	context.strokeStyle = userColor;
	context.lineJoin = "round";
	context.lineWidth = userSize;
		
	context.beginPath();
	context.moveTo(x, y-1);
	context.lineTo(x, y);
}

function onDraw(x,y)
{
	context.lineTo(x, y);
	context.stroke();
}

function draw(style,join,width,data)
{
	if(context == null)
	{
		//TODO push cache & restore later
		return;
	}
	
	context.strokeStyle = style || "#000000";
	context.lineJoin = join || "round";
	context.lineWidth = width || 2;
		
	context.beginPath();
	for(var i=0; i < data.length; i++)
	{		
		if(i==0)
		{
			context.moveTo(data[i][0]-1, data[i][1]);
		}
		context.lineTo(data[i][0], data[i][1]);
	}
	//context.closePath();
	context.stroke();
}

function placeImage(x,y)
{
	if(userImage!=null)
	{
		client.socket.emit('chat message', pluginContext.channel+"#whiteboard" + "|" + "#image,"+x+","+y+";"+userImage);
	}
	userImage=null;
}

function drawImage(src,x,y,w,h)
{
	var outlineImage = new Image();
	outlineImage.src = src;
	w = w || outlineImage.width;
	h = h || outlineImage.height;
	context.drawImage(outlineImage, x||0, y||0, w, h);
}

dungeonChatPluginInit = function(pcontext)
{
	pluginContext = pcontext;
	log("WB init! context:"+pluginContext);
	
	var whiteboardID = "#whiteboard";
	var canvas;
	
	if(context!=null)
	{
		canvas = document.getElementById(whiteboardID.substring(1));
		$(container).show();
	}
	else
	{
		var h = $(window).height();
		var w = $(window).width();
		var headerSize = 80;
		var usersPanelSize = 155;
		var wbWidth = w-usersPanelSize;
		var wbHeight = h-headerSize;
		
		container = document.createElement("div");
		container.id = "whiteboard-container";
		container.style.display = "block";
		container.style.width = wbWidth;
		container.style.height = wbHeight;
		container.style.position = "fixed";
		container.style.top = headerSize+"px";
		container.style.left = usersPanelSize+"px";
		container.style.borderLeft = "5px solid #000";
		container.style.background = "#fff";
		container.style.zIndex = 2;
		
		
		var tools = document.createElement("div");
		tools.style.border = "1px solid #eee";
		tools.style.background = "#eee";
		tools.style.display = "block";
		tools.style.width = "100%";
		
		var addLabel = function(label)
		{
			var btn = document.createElement("div");
			btn.className = "label label-info";
			btn.innerHTML = label;
			tools.appendChild(btn);
		};
		
		var addButton = function(btnText)
		{
			var btn = document.createElement("button");
			btn.className = "btn btn-default btn-xs";
			btn.innerHTML = "<div style='background:"+btnText+";'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>";
			btn.setAttribute("userColor",btnText);
			$(btn).click(function()
			{
				userColor = this.getAttribute("userColor");
				log(userColor);
			});
			tools.appendChild(btn);
		};
		
		var addSizeButton = function(size)
		{
			var btn = document.createElement("button");
			btn.className = "btn btn-default btn-xs";
			btn.innerHTML = size;
			btn.setAttribute("userSize",size);
			$(btn).click(function()
			{
				userSize = this.getAttribute("userSize");
				log(userSize);
			});
			tools.appendChild(btn);
		};
		addLabel("Color");
		addButton("#000000");
		addButton("#ffffff");
		addButton("#666666");
		addButton("#ff0000");
		addButton("#00ff00");
		addButton("#0000ff");
		addButton("#00ffff");
		addButton("#ffff00");
		addButton("#ff00ff");
		
		addLabel("Size");
		addSizeButton(1);
		for(var i = 2; i<=10; i++)
		{
			addSizeButton(i*i);
		}
		
		var toolsPanelSize = $(tools).height();
		
		canvas = document.createElement("canvas");
		canvas.id=whiteboardID.substring(1);
		canvas.setAttribute("width",wbWidth);
		canvas.setAttribute("height",wbHeight-toolsPanelSize);
		canvas.style.width = wbWidth;
		canvas.style.height = wbHeight;
		canvas.style.cursor = "crosshair";
		
		document.body.appendChild(container);
		container.appendChild(tools);
		container.appendChild(canvas);
				
		context = canvas.getContext("2d");
	}
	
	var offSetX = -usersPanelSize-4;
	var offSetY = -headerSize-toolsPanelSize-22;

	$(whiteboardID).mousedown(function(e)
	{
		if(userImage!=null)
		{
			placeImage(e.pageX+offSetX, e.pageY+offSetY);
			return;
		}
		
		paint = true;
		addClick(e.pageX+offSetX, e.pageY+offSetY);
		onStartDraw(e.pageX+offSetX, e.pageY+offSetY);
	});
	
	$(whiteboardID).mousemove(function(e)
	{
		if(paint)
		{
			addClick(e.pageX+offSetX, e.pageY+offSetY,true);
			onDraw(e.pageX+offSetX, e.pageY+offSetY);
		}
	});
	
	$(whiteboardID).mouseup(function(e){onStopDraw();});
	$(whiteboardID).mouseleave(function(e){onStopDraw();});
	
	pluginContext.onClose = function()
	{
		paint=false;
		$(container).hide();
		$(container).remove();
		initValues();
	};
	pluginContext.onAddLine = function(time, who, what,marker,channel)
	{
		if(channel!=pluginContext.channel+"#whiteboard") return false;
		
		var data = what.split(";");
		var output = [];
		
		//Verify that we have proper data
		var type = data.shift().split(",");
		if(type[0][0]!="#") return false;
		
		if(type[0]=="#image")
		{
			drawImage(data.join(";"),type[1],type[2]);
			return;
		}
		
		var color = type[0];
		var size = type[1];
		
		for	(var i =0; i<data.length; i++)
		{
			var values = data[i].split(",");
			output.push([parseInt(values[0]),parseInt(values[1])]);
		}
		draw(color,null,size,output);
		return true;
	};
	
	var history = pluginContext.history;
	if(history!=null)
	{
		for(var index in history)
		{
			pluginContext.onAddLine(
				history[index][0],
				history[index][1],
				history[index][2],
				history[index][3],
				pluginContext.channel+"#whiteboard"
			);
		}
	}
	
	document.onpaste = function(event)
	{
		var items = (event.clipboardData || event.originalEvent.clipboardData).items;

		var load = function(idx)
		{
			var blob = items[idx].getAsFile();
			var reader = new FileReader();
			reader.onload = function(event)
			{
				userImage = event.target.result;
			};
			reader.readAsDataURL(blob);
		}
		
		try
		{
			load(0);
		}
		catch(error)
		{
			load(1);
		}
	}
}
*/