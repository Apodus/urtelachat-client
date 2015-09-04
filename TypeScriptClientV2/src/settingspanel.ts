class SettingsPanel
{
	useAutoScroll:boolean;
	myDropzone:Dropzone;
	onFileDrop:Signal;
	
	constructor()
	{
		this.useAutoScroll = true;
		this.onFileDrop = new Signal();
		
		this.refreshAutoScrollToggleButton();
		
		var settings:SettingsPanel = this;
		$(HtmlID.AUTO_SCROLL_TOGGLE_BUTTON).click(function()
		{
			settings.toggleAutoScroll();
		});
		
		var ui = this;
		
		$("#debug").hide();
		
		this.addButton("#themes","Theme1",function()
		{
			new CustomTheme("css/themes/theme1.min.css");
		});
		
		if(this.myDropzone==null)
		{
			this.myDropzone = new Dropzone("div#messages", { url: "/",clickable:false,previewsContainer:"#upload-info"});
			
			var ui:SettingsPanel = this;
			
			this.myDropzone.on("error", function(file:any, response:any)
			{
				ui.closePopup();
				$("#fileUpload").modal("show");
			});
			
			this.myDropzone.on("success", function(file:any, response:any)
			{
				ui.closePopup();
				$("#fileUpload").modal("show");
				ui.onFileDrop.send(file);
			});
		}
	}
	closePopup():void
	{
		Debug.log("Closing popups");
		$('.modal').modal('hide');
	}
	addButton(container:string,name:string,callback:Function)
	{
		$(container).show();
		
		var button:HTMLElement = document.createElement("button");
		button.className = "btn btn-success btn-sm";
		//button.type = "button";
		button.innerHTML = name;
		$(container).append(button);
		$(button).click(callback);
	}
	refreshAutoScrollToggleButton()
	{
		var button = $(HtmlID.AUTO_SCROLL_TOGGLE_BUTTON);
		var iconOn = $(HtmlID.AUTO_SCROLL_ICON_ON);
		var iconOff = $(HtmlID.AUTO_SCROLL_ICON_OFF);
		
		if(this.useAutoScroll)
		{
			button.addClass("btn-info");
			button.removeClass("btn-warning");
			iconOn.show();
			iconOff.hide();
		}
		else
		{
			button.removeClass("btn-info");
			button.addClass("btn-warning");
			iconOff.show();
			iconOn.hide();
		}
	}
	
	toggleAutoScroll()
	{
		this.useAutoScroll = !this.useAutoScroll;
		Debug.log("Autoscroll toggled: "+this.useAutoScroll);
		this.refreshAutoScrollToggleButton();
	}
}