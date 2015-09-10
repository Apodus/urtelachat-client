class MessageInputHistory
{
	index:number;
	history:Array<string>;
	tempMessage:string;
	limit:number;
	notification:PopoverNotification;
	constructor()
	{
		this.history = new Array<string>();
		this.index = 0;
		this.limit = 20;
		this.notification = null;
	}
	get(dif:number)
	{
		this.add($(HtmlID.MESSAGE_INPUT).val());
		
		this.index += dif;
		
		if(this.index < 0) this.index = this.history.length-1;
		if(this.index >= this.history.length) this.index = 0;
		
		if(this.index < 0 || this.history.length == 0) return $(HtmlID.MESSAGE_INPUT).val();
		
		if(this.notification!=null)
		{
			this.notification.clearTimeout();
		}
		this.notification = new PopoverNotification(HtmlID.MESSAGE_INPUT,"Sent Message History "+(this.index+1)+"/"+(this.history.length));
		this.notification.getOptions().placement = "top";
		this.notification.show();
		
		return this.history[this.index];
	}
	add(msg:string):boolean
	{
		if(msg!=null && msg != "")
		{
			for(var i:number = 0; i < this.history.length; i++)
			{
				if(this.history[i] == msg) return false;
			}
			
			this.history.push(msg);
			while(this.history.length>this.limit)
			{
				this.history.shift();
			}
			this.index = this.history.length-1;
			//Debug.log("Add to his:"+msg+". idx:"+this.index);
			return true;
		}
	}
}