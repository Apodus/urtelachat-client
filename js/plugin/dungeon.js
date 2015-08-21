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
	this.grid = null;
	this.gridSize = [0,0];
	this.gridWidth = 100;
	this.gridHeight = 75;
	
}{
	LevelGridSystem.prototype.setGridSize=function(w,h)
	{
		this.gridSize = [w,h];
	}
	
	LevelGridSystem.prototype.setEntity=function(x,y,entity)
	{
		if(this.grid==null)
		{
			this.grid=[];
		}
		
		if(this.grid[x]==null)
		{
			this.grid[x]=[];
		}

		if(this.grid[x][y]!=null)
		{
			log("Entity action!");
			this.grid[x][y].addComponent({name:"entityAction",entity:entity});
		}
		this.grid[x][y] = entity;
	}
	
	LevelGridSystem.prototype.update=function(entities)
	{
		//Clear grid records.
		
		this.grid=null;
		for	(var i = 0 ; i<entities.length;i++)
		{
			var entity = entities[i];
			var components = entity.components;
			var position = components.position;
			
			if(position==null) continue;
			
			if(components.camera) continue;
			
			//entity.addComponent({name:"debugText",text:"Grid:"+position.x+", "+position.y});
			
			var renderPosition = components.renderPosition;
			if(renderPosition == null)
			{
				renderPosition = {name:"renderPosition",x:0,y:0};
				entity.addComponent(renderPosition);
			}
			
			var move = components.move;
			var movement = components.movement;
			
			//Get movedata into movement component.
			if(move)
			{
				if(!movement)
				{
					movement = {name:"movement"};
					entity.addComponent(movement);
				}
				
				//set movement target & values.
				//Target Grid
				movement.x = position.x+move.x;
				movement.y = position.y+move.y;
				//Target render position
				movement.targetX = movement.x*this.gridWidth;
				movement.targetY = movement.y*this.gridHeight;
				movement.speed = move.speed || 4;
				//Update or set current render position
				movement.currentX = movement.currentX || position.x*this.gridWidth;
				movement.currentY = movement.currentY || position.y*this.gridHeight;
				
				//Remove move data
				entity.removeComponent(move.name);
				move = null;
			}
			
			if(movement)
			{
				var finished = true;
				
				var dif = movement.targetX-movement.currentX;
				
				if (dif>0)
				{
					movement.currentX += Math.min(dif,movement.speed);
					finished = false;
				}
				else if (dif<0)
				{
					movement.currentX -= Math.min(-dif,movement.speed);
					finished = false;
				}
				
				dif = movement.targetY - movement.currentY;
				if (dif>0)
				{
					movement.currentY += Math.min(dif,movement.speed);
					finished = false;
				}
				else if (dif<0)
				{
					movement.currentY -= Math.min(-dif,movement.speed);
					finished = false;
				}
				
				if(finished)
				{
					position.x = movement.x;
					position.y = movement.y;
					
					renderPosition.x = position.x*this.gridWidth;
					renderPosition.y = position.y*this.gridHeight;	
					
					entity.removeComponent(movement.name);
					movement=null;
					
					
				}
				else
				{
					renderPosition.x = movement.currentX;
					renderPosition.y = movement.currentY;
				}
			}
			else
			{
				renderPosition.x = position.x*this.gridWidth;
				renderPosition.y = position.y*this.gridHeight;	
			}
			
			if(components.gridObject)
			{
				this.setEntity(position.x,position.y,entity);
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
	
	this.offset = [200,200];
	
	this.imageMapping = {
		characterSmall:"js/plugin/dungeon/character1.png",
		character:"js/plugin/dungeon/Character Boy.png",
		dirt:"js/plugin/dungeon/Dirt Block.png",
		grass:"js/plugin/dungeon/Grass Block.png",
		dirt:"js/plugin/dungeon/Dirt Block.png",
		stone:"js/plugin/dungeon/Stone Block.png",
		chest:"js/plugin/dungeon/Chest Closed.png",
		chestOpen:"js/plugin/dungeon/Chest Open.png",
		selector:"js/plugin/dungeon/Selector.png",
		rock:"js/plugin/dungeon/Rock.png",
		heart:"js/plugin/dungeon/Heart.png"
	};
}{
	RenderSystem.prototype.drawText=function(ctx,text,x,y,size,align)
	{
		drawText(ctx,text,x+this.offset[0], y+this.offset[1],size,align);
	}
	
	RenderSystem.prototype.drawImage = function(img,x,y,w,h)
	{
		this.context.drawImage(
			img,
			x+this.offset[0]-w/2,
			y+this.offset[1]-h/2,
			w,
			h
		);
	}
	
	RenderSystem.prototype.update=function(entities)
	{
		for	(var i = 0 ; i<entities.length;i++)
		{
			var entity = entities[i];
			var components = entity.components;
			
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
				//entity.removeComponent(position.name);
				continue;
			}
			
			if(position==null) continue;
			
			if(image)
			{
				var img = this.getImage(image.source);
				if(img!=null)
				{
					this.drawImage(
						img,
						position.x,
						position.y,
						img.width,
						img.height
					);
				}
			}
			
			if(components.entityAction)
			{
				var img = this.getImage("selector");
				if(img!=null)
				{
					this.drawImage(
						img,
						position.x,
						position.y,
						img.width,
						img.height
					);
				}
				entity.removeComponent(image.name);
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
					entity.removeComponent(text.name);
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
	
	this.log = ["Welcome to "+this.pluginContext.channel+" Dungeon!"];
	this.logLimit = 50;
	
	this.init();
	
	this.update();
	
	log("Created dungeon");
}{
	Dungeon.prototype.update = function()
	{
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height); // Clears the canvas
		
		this.engine.update();
		//Title text
		var y = 10;
		for	(var i = 0; i<this.log.length; i++)
		{
			drawText(this.context,unwindHtml(this.log[i]),10,y,10,"left");
			y += 10;
		}
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
		this.pluginContext.addLine("+gridObject{}",this.pluginContext.getChannelRealName());
		
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
		if(channel != this.pluginContext.getChannelRealName())
		{
			return;
		}
		
		this.log.push(who+": "+what);
		while(this.log.length>this.logLimit)
		{
			this.log.shift();
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
		this.level.setGridSize(size[0],size[1]);
		
		for(var i = 0; i<size[0]; i++)
		{
			for(var j = 0; j<size[1]; j++)
			{
				this.engine.addEntity(this.createBackgroundBlock(i,j));
			}
		}

		this.engine.addEntity(this.createObject("chest",1,1));
		this.engine.addEntity(this.createObject("rock",3,1));
		this.engine.addEntity(this.createObject("rock",3,4));
		this.engine.addEntity(this.createObject("rock",5,2));
		this.engine.addEntity(this.createObject("stone",4,2));
		this.engine.addEntity(this.createObject("heart",1,0));
	}
	
	Dungeon.prototype.createBackgroundBlock = function(x,y)
	{
		var entity = new Entity();
		entity.addComponent({name:"position",x:x,y:y});
		entity.addComponent({name:"image",source:"dirt"});
		return entity;
	}
	
	Dungeon.prototype.createObject=function(name,x,y)
	{
		var entity = new Entity();
		entity.addComponent({name:name});
		entity.addComponent({name:"gridObject"});
		entity.addComponent({name:"position",x:x,y:y});
		entity.addComponent({name:"image",source:name});
		return entity;
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