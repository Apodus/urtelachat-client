function ChatUI()
{
}
{
	ChatUI.prototype.init = function()
	{
		log("Init UI");
		this.initSettings();
		this.focusTextbox();
		this.resizeScreen();
	}
	ChatUI.prototype.resizeScreen = function()
	{
		window.onresize = this.resizeScreen;
		
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

	ChatUI.prototype.initSettings = function()
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
		var ui = this;
		$("#debug").click(function()
		{
			ui.setLoading("Tsasdasd");
			setTimeout(ui.setLoading,5000);
		});
	}

	ChatUI.prototype.focusTextbox = function()
	{
		$("#m").focus();
	}

	ChatUI.prototype.setLoading = function(str)
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

	ChatUI.prototype.setServerStatus = function(status)
	{
		log("Server Status: "+status);
		$("#server-status").html(status);
	}
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}