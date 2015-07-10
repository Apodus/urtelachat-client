function resizeScreen()
{
	window.onresize = resizeScreen;
	
	var h = $(window).height() * 0.99;
	var w = $(window).width() * 0.99;
  
	//$("#channels").height(h * 0.05);
	//$("#channels").width(w * 1.00);
  
	$("#messages").height(h * 0.75);
	//$("#messages").width(w * 0.999);
  
	//$("#m").height(h * 0.10);
	//$("#m").width(w * 1.00);
  
	$("#messages").scrollTop = $("#messages").scrollHeight;
}

function initSettings()
{
	var openButton = document.getElementById('settings-open');
	var closeButton = document.getElementById('settings-close');
	
	openButton.onclick = function()
	{
		$("#settings").toggleClass("closed");
	}
	
	closeButton.onclick = function()
	{
		$("#settings").toggleClass("closed");
	}
	
	$("#debug").click(function()
	{
		setLoading("Tsasdasd");
		setTimeout(setLoading,5000);
	});
}

function initUI()
{
	initSettings();
	focusTextbox();
	resizeScreen();
}

function focusTextbox()
{
	$("#m").focus();
}

function setLoading(str)
{
	if(str==null)
	{
		$("#loading").addClass("ready");	
		$("#loading-text").addClass("ready");
		$("#loading-indicator").removeClass("rotating");
	}
	else
	{
		$("#loading-text").html(str);
		
		$("#loading").removeClass("ready");		
		$("#loading-text").removeClass("ready");
		$("#loading-indicator").addClass("rotating");
	}
}

function setServerStatus(status)
{
	$("#server-status").html(status);
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}