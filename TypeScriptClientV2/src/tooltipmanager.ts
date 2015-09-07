class TooltipManager
{
	static hideAll()
	{
		$('.tooltip').each(function()
		{
			$(this)['tooltip']('hide');
		});
	}
	static hideAllExcept(active:any)
	{
		//Debug.log("hide all exception:"+active);
		$('.tooltip').each(function()
		{
			if(this!=active)
			{
				//Debug.log("   hiding:"+this);
				$(this)['tooltip']('hide');
			}
		});
	}
	static show(element:any,msg:string,placement:string)
	{
		TooltipManager.hideAllExcept(element);
		
		$(element).attr("data-original-title", msg);
		
		if($(element).attr("data-toggle")!="tooltip")
		{
			$(element).attr("title", msg);
			$(element)['tooltip']({
				placement:placement,
				container:"body"
			});
			$(element).attr("data-toggle", "tooltip");
			////$(element).attr("data-placement", placement);
			$(element)['tooltip']("show");
		}
	}
}