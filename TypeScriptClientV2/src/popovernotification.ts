class PopoverNotification
{
	text:string;
	timeoutID:number;
	container:string;
	options:any;
	constructor(container:string, text:string)
	{
		this.text = text;
		this.container = container;
		this.options = {
			content:this.text,
			html:true,
			placement:"bottom",
			delay: { "show": 500, "hide": 100 }
		};
	}
	getOptions():any
	{
		return this.options;
	}
	show()
	{
		$(this.container).popover(this.options);
		
		$(this.container).data('bs.popover').options.content = this.text;
		
		$(this.container).popover("show");
		
		var self:PopoverNotification = this;
		$('.popover').off('click').on('click', function(e) {
			self.hide();
            e.stopPropagation(); // prevent event for bubbling up => will not get caught with document.onclick
        });
		
		if(document.hasFocus())
		{
			this.timeoutID = setTimeout(function()
			{
				self.hide();
			},5000);
		}
	}
	clearTimeout()
	{
		if(this.timeoutID!=null)
		{
			clearTimeout(this.timeoutID);
			this.timeoutID=null;
		}
	}
	hide()
	{
		//Debug.log("Hide popover:"+this.container);
		this.clearTimeout();
		$(this.container).popover("hide");
	}
}