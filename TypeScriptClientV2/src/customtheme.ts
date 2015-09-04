class CustomTheme
{
	private static activeTheme:CustomTheme=null;
	
	element:HTMLElement;
	
	constructor(file:string)
	{
		CustomTheme.unload();
		
		CustomTheme.activeTheme = this;
	  
		this.element = document.createElement("link");
		this.element.setAttribute("rel", "stylesheet");
		this.element.setAttribute("type", "text/css");
		this.element.setAttribute("href", file);

		if (typeof this.element!="undefined")
		{
			document.getElementsByTagName("head")[0].appendChild(this.element);
		}
	}
	
	remove()
	{
		$(this.element).remove();
		this.element = null;
	}
	
	static unload()
	{
		if(CustomTheme.activeTheme!=null)
		{
			CustomTheme.activeTheme.remove();
			CustomTheme.activeTheme=null;
		}
	}
}