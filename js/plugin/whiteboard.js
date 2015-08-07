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

whiteboardChatPluginInit = function(pcontext)
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
		var blob = items[0].getAsFile();
		var reader = new FileReader();
		reader.onload = function(event)
		{
			userImage = event.target.result;
		};
		reader.readAsDataURL(blob);
	}
}