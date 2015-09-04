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

class NotificationSystem
{
	static singleton:NotificationSystem;
	text:string;
	title:string;
	count:number;
	active:boolean;
	timeoutID:number;
	notification:any;
	enabled:boolean;
	
	popover:PopoverNotification;
	
	constructor()
	{
		this.enabled=false;
		this.text="";
		this.count=0;
		this.active=false;
		this.timeoutID=null;
		this.notification=null;
		this.popover = null;
		
		if (!("Notification" in window))
		{
			Debug.log("Browser does not support notifications...");
			this.showPopover("Browser does not support notifications...","");
			this.enabled=false;
		}
		else
		{
			if (Notification.permission === "granted")
			{
				this.enabled=true;
			}
			else
			{
				if (Notification.permission !== 'denied')
				{
					var self:NotificationSystem = this;
					Notification.requestPermission(function (permission:string)
					{
						// If the user is okay, let's create a notification
						if (permission === "granted")
						{
							self.enabled=true;
						}
					});
				}
			}
		}
		
		$(window).focus(function()
		{
			setTimeout(function()
			{
				NotificationSystem.get().hide();
			},5000);
		})
	}
	notify(title:string,msg:string)
	{	
		if(document.hasFocus())
		{
			this.count=0;
		}
		else
		{
			this.count++;	
		}
		
		Debug.log("notify: "+this.count);
		
		this.title = title;
		this.text = msg;
		
		this.clearTimeout();
		
		this.timeoutID = setTimeout(function()
		{
			NotificationSystem.get().show();
		},1000);
	}
	hide()
	{
		this.active = false;
		this.count = 0;
		
		if(this.notification!=null)
		{
			this.notification.close();
			this.notification = null;
		}
		if(this.popover!=null)
		{
			this.popover.hide();
			this.popover = null;
		}
		this.clearTimeout();
	}
	showPopover(title:string,text:string)
	{
		if(this.popover!=null)
		{
			this.popover.clearTimeout();
		}
		this.popover = new PopoverNotification("#logo",title+"<br/>"+text);
		this.popover.show();
	}
	show()
	{
		if(document.hasFocus())
		{
			return;
		}

		Debug.log("Show notifications: "+this.count);
		
		if(this.count>1)
		{
			this.text = this.count.toString()+" new messages!";
			this.title = "";
		}
		
		this.hide();
		this.active=true;
		
		this.notification = new Notification(Utils.unwindHtml(this.title), {"body": Utils.unwindHtml(this.text), "icon":"http://urtela.redlynx.com/img/chaticon.jpg"});
		
		setTimeout(function()
		{
			NotificationSystem.get().hide();
		},5000);

		window.focus();
	}
	clearTimeout()
	{
		if(this.timeoutID==null) return;
		
		clearTimeout(this.timeoutID);
		this.timeoutID=null;
	}
	static get():NotificationSystem
	{
		if(NotificationSystem.singleton==null)
		{
			NotificationSystem.singleton = new NotificationSystem();
		}
		return NotificationSystem.singleton;
	}
}