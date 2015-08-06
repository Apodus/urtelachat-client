var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
var context;
var pluginContext;

var chatMsg = "";

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
  
  if(dragging!=true)
  {	
	chatMsg = "";  
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
}

function clear()
{
	context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
}

function redraw()
{
	context.strokeStyle = "#0033ff";
	context.lineJoin = "round";
	context.lineWidth = 2;
			
	for(var i=0; i < clickX.length; i++)
	{		
		context.beginPath();
		if(clickDrag[i] && i){
			context.moveTo(clickX[i-1], clickY[i-1]);
		}else{
			context.moveTo(clickX[i]-1, clickY[i]);
		}
		context.lineTo(clickX[i], clickY[i]);
		//context.closePath();
		context.stroke();
	}
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

whiteboardChatPluginInit = function(pcontext)
{
	pluginContext = pcontext;
	log("WB init! context:"+pluginContext);
	
	var whiteboardID = "#whiteboard";
	var canvas;
	
	if(context!=null)
	{
		canvas = document.getElementById(whiteboardID.substring(1));
		$(canvas).show();
		redraw();
	}
	else
	{
		var h = $(window).height();
		var w = $(window).width();
		var headerSize = 80;
		var usersPanelSize = 155;
		var wbWidth = w-usersPanelSize;
		var wbHeight = h-headerSize;
		
		canvas = document.createElement("canvas");
		canvas.id=whiteboardID.substring(1);
		canvas.setAttribute("width",wbWidth);
		canvas.setAttribute("height",wbHeight);
		canvas.style.width = wbWidth;
		canvas.style.height = wbHeight;
		canvas.style.position = "fixed";
		canvas.style.top = headerSize+"px";
		canvas.style.left = usersPanelSize+"px";
		canvas.style.borderLeft = "5px solid #000";
		canvas.style.background = "#fff";
		canvas.style.zIndex = 10;
		
		document.body.appendChild(canvas);
		
		context = canvas.getContext("2d");
	}

	$(whiteboardID).mousedown(function(e)
	{
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		
		paint = true;
		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		redraw();
	});
	
	$(whiteboardID).mousemove(function(e)
	{
		if(paint)
		{
			addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
			redraw();
		}
	});
	
	$(whiteboardID).mouseup(function(e){onStopDraw();});
	$(whiteboardID).mouseleave(function(e){onStopDraw();});
	
	pluginContext.onClose = function()
	{
		paint=false;
		$(canvas).hide();
	};
	pluginContext.onAddLine = function(time, who, what,marker,channel)
	{
		if(channel!=pluginContext.channel+"#whiteboard") return false;
		
		var data = what.split(";");
		var output = [];
		for	(var i =0; i<data.length; i++)
		{
			var values = data[i].split(",");
			output.push([parseInt(values[0]),parseInt(values[1])]);
		}
		draw(null,null,null,output);
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
}