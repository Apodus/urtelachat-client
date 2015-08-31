/// <reference path="../ref/jquery.d.ts" />

class Userinterface
{
	Userinterface()
	{
		Debug.log("User interface init.");
	}
	setLoading(str:string)
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
	fatalError(str:string)
	{
		var e = document.getElementById("loading");
		e.innerHTML = "<div class='error'>"+str+"</div>";
	}
}