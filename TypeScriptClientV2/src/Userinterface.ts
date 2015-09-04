/// <reference path="../ref/jquery/jquery.d.ts" />
/// <reference path="..\ref\jquery.simplemodal\jquery.simplemodal.d.ts" />
/// <reference path="..\ref\dropzone\dropzone.d.ts" />
/// <reference path="external.d.ts" />

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
		this.notification = new PopoverNotification(HtmlID.MESSAGE_INPUT,"Sent Message History "+(this.index+1)+"/"+(this.history.length+1));
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

class CustomTheme
{
	private static activeTheme:CustomTheme=null;
	
	element:HTMLElement;
	
	constructor(file:string)
	{
		if(CustomTheme.activeTheme!=null)
		{
			CustomTheme.activeTheme.remove();
			CustomTheme.activeTheme = null;
		}
		
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
}

class ChatMessagePanel
{
	element:HTMLElement;
	body:HTMLElement;
	who:HTMLElement;
	what:HTMLElement;
	when:HTMLElement;
	message:ChatMessage;
	
	constructor(message:ChatMessage,alt:boolean)
	{
		this.message = message;
		this.element = document.createElement("div");
		this.element.className = "message-block";
		
		this.body = document.createElement("div");
		this.body.className = "message-body row";
		if(alt)
		{
			$(this.body).addClass("alt-bg");
		}
		
		this.element.appendChild(this.body);
		
		this.who = document.createElement("span");
		this.what = document.createElement("div");
		this.when = document.createElement("div");
		
		this.body.appendChild(this.who);
		this.body.appendChild(this.what);
		this.body.appendChild(this.when);
		
		this.who.innerHTML = message.sender;
		this.what.innerHTML = Utils.linkify(message.message);
		this.when.innerHTML = message.time;
		
		this.who.className = "label col-md-1 who user-label";
		this.what.className = "chat-message col-md-10";
		this.when.className = "time col-md-1 text-right";
		
		switch(message.type)
		{
			case ChatMessageType.SYSTEM:
				$(this.who).addClass("label-info");
				break;
			case ChatMessageType.NORMAL:
			default:
				$(this.who).addClass("label-success");
			break;
		}
		
		$(this.element).hide();
		$(this.element).fadeIn();
	}
	
	addMessage(message:ChatMessage)
	{
		var newMessage:HTMLElement = document.createElement("span");
		newMessage.innerHTML = "<br/>"+Utils.linkify(message.message);
		
		this.what.appendChild(newMessage);
		
		this.when.innerHTML += "<br/>"+message.time;
		
		$(newMessage).hide();
		$(newMessage).fadeIn();
	}
}

class ChatPanel
{
	static activeChatPanel:ChatPanel;
	
	id:number;
	channel:ChatChannel;
	element:HTMLElement;
	useAlternative:boolean;
	lastMessage:ChatMessagePanel;
	
	constructor(channel:ChatChannel)
	{
		this.lastMessage = null;
		this.useAlternative = false;
		this.channel = channel;
		this.id = channel.id;
		this.element = document.createElement("div");
		this.element.id = "CHAT_"+this.id;
		$(this.element).hide(); // hide as default
	}
	
	addMessage(message:ChatMessage)
	{
		if(this.lastMessage != null && this.lastMessage.message.sender == message.sender)
		{
			this.lastMessage.addMessage(message);
		}
		else
		{
			var messagePanel:ChatMessagePanel = new ChatMessagePanel(message,this.useAlternative);
			this.element.appendChild(messagePanel.element);
			this.lastMessage = messagePanel;
			this.useAlternative = !this.useAlternative;
		}
	}
	setActive()
	{
		if(ChatPanel.activeChatPanel!=null)
		{
			$(ChatPanel.activeChatPanel.element).hide();
		}
		ChatPanel.activeChatPanel = this;
		$(ChatPanel.activeChatPanel.element).fadeIn();
	}
	isActive():boolean
	{
		return ChatPanel.activeChatPanel == this;
	}
}

class ChannelButton
{
	static activeChannelButton:ChannelButton;
	
	id:number;
	channel:ChatChannel;
	element:HTMLElement;
	onCloseClick:Signal;
	onNameClick:Signal;
	
	newMessages:number;
	newMessagesLabel:HTMLElement;
	
	constructor(channel:ChatChannel)
	{
		this.newMessages = 0;
		this.id = channel.id;
		this.channel = channel;
		this.onCloseClick = new Signal();
		this.onNameClick = new Signal();
		
		this.element = document.createElement("button");
		
		this.element.id = "CHANNEL_"+this.id;
		this.element.className = "btn channel-button";
		//this.element.type = "button";
			
		var closeButton:HTMLElement = document.createElement("button");
		closeButton.className = "btn btn-warning btn-xs btn-close-channel";
		//closeButton.type = "button";
		//closeButton.id = "close_channel_" + channelID.substring(1);
		//$(closeButton).hide();
		
		var channelName:HTMLElement = document.createElement("span");
		channelName.className = "name";
		channelName.innerHTML = channel.name;
		
			
		var messages:HTMLElement = document.createElement("span");
		messages.className = "message-count badge";
		this.newMessagesLabel = messages;
			
		var closeIcon:HTMLElement = document.createElement("span");
		closeIcon.className = "glyphicon glyphicon-remove";
		$(closeIcon).attr("aria-hidden", "true");
		$(closeButton).append(closeIcon);
		
		$(this.element).append(messages);
		$(this.element).append(channelName);
		$(this.element).append(closeButton);
		
		var self:ChannelButton = this;
		$(closeButton).click(function()
		{
			self.element.onclick = null;
			
			$(self.element)['tooltip']("hide");
			self.onCloseClick.send("close");
		});
		
		$(this.element).click(function()
		{
			self.onNameClick.send("open");
			
			$(self.element)['tooltip']("hide");
		});
		
		$(this.element).mouseleave(function()
		{
			$(closeButton).fadeOut();
		});
		
		$(this.element).attr("title", channel.topic);
		
		$(this.element).mouseenter(function()
		{
			if(channel.name!="lobby")
			{
				$(closeButton).fadeIn();
			}

			//Tooltips
			if($(self.element).attr("data-toggle")!="tooltip")
			{
				$(self.element).attr("data-toggle", "tooltip");
				$(self.element).attr("data-placement", "bottom");
				$(self.element)['tooltip']("show");
			}
			else
			{
				$(self.element).attr("data-original-title", channel.topic);
			}
		});
		$(closeButton).hide();
	}
	setActive()
	{
		if(ChannelButton.activeChannelButton!=null)
		{
			$(ChannelButton.activeChannelButton.element).removeClass("btn-info");
			$(ChannelButton.activeChannelButton.element).removeClass("btn-success");
		}
		
		$(this.element).addClass("btn-success");
		$(this.element).removeClass("btn-info");
		
		$(this.newMessagesLabel).empty();
		
		ChannelButton.activeChannelButton = this;
	}
	addNewMarker():void
	{
		this.newMessages++;
		$(this.element).addClass("btn-info");
		$(this.newMessagesLabel).html(this.newMessages.toString());
	}
	isActive():boolean
	{
		return ChannelButton.activeChannelButton == this;
	}
}

class HtmlID
{
	static CHANNELS:string = "#channels";
	static MESSAGES:string = "#messages";
	static TOPIC:string = "#chat-topic";
	static USER_INFO:string = "#userInfo";
	static USER_INFO_BODY:string = "#userInfoBody";
	static USERS_LIST:string = "#users";
	static MESSAGE_INPUT:string = "#message-input";
	static AUTO_SCROLL_TOGGLE_BUTTON:string = "#auto-scroll-toggle";
	static AUTO_SCROLL_ICON_ON:string = "#auto-scroll-icon-on";
	static AUTO_SCROLL_ICON_OFF:string = "#auto-scroll-icon-off";
	static SERVER_STATUS:string = "#server-status";
}

class Userinterface
{
	onActiveChannelChanged:Signal;
	onChannelClosed:Signal;
	onMessageSend:Signal;
	onStatusChange:Signal;
	onPrivateChatStarted:Signal;
	
	channelButtons:Array<ChannelButton>;
	chatPanels:Array<ChatPanel>;
	
	settings:SettingsPanel;
	
	idleTimeout:number;
	autoIdle:boolean;
	autoIdleMinutes:number;
	autoIdleStartTime:Date;
	
	activeChannel:ChatChannel;
	
	history:MessageInputHistory;
	
	
	constructor()
	{
		Debug.log("User interface init.");
		
		this.idleTimeout=null;
		this.autoIdle=true;
		this.autoIdleMinutes=1;
		this.activeChannel=null;
		
		this.history = new MessageInputHistory();
		
		this.onActiveChannelChanged = new Signal();
		this.onChannelClosed = new Signal();
		this.onMessageSend = new Signal();
		this.onStatusChange = new Signal();
		this.onPrivateChatStarted = new Signal();
		
		this.channelButtons = new Array<ChannelButton>();
		this.chatPanels = new Array<ChatPanel>();
		this.settings = new SettingsPanel();
	
		this.initKeyboard();
	}
	initChannelButton(channel:ChatChannel):ChannelButton
	{
		for(var i:number = 0; i< this.channelButtons.length; i++)
		{
			if(this.channelButtons[i].id == channel.id)
			{
				return this.channelButtons[i];
			}
		}
		
		var button:ChannelButton = new ChannelButton(channel);
		this.channelButtons.push(button);
		
		$(HtmlID.CHANNELS).append(button.element);
		
		var self:Userinterface = this;
		button.onNameClick.add(function()
		{
			self.onChannelButtonClick(button);
		});
		button.onCloseClick.add(function()
		{
			self.onCloseChannelButtonClick(button);
		});
		
		return button;
	}
	initChatPanel(channel:ChatChannel):ChatPanel
	{
		for(var i:number = 0; i< this.chatPanels.length; i++)
		{
			if(this.chatPanels[i].id == channel.id)
			{
				return this.chatPanels[i];
			}
		}
		
		var chat:ChatPanel = new ChatPanel(channel);
		this.chatPanels.push(chat);
		
		$(HtmlID.MESSAGES).append(chat.element);
		
		return chat;
	}
	addMessage(channel:ChatChannel,message:ChatMessage)
	{
		Debug.assert(message!=null,"null Message!");
		var chat:ChatPanel = this.initChatPanel(channel);
		chat.addMessage(message);
		if(!chat.isActive())
		{
			this.initChannelButton(channel).addNewMarker();
		}
		else
		{
			this.messagesScrollToBottom(false);
		}
		
		NotificationSystem.get().notify("New Message in "+channel.name,message.sender+":"+'"'+message.message+'"');
	}
	removeChannel(channel:ChatChannel)
	{
		this.removeChannelButton(channel);
		this.removeChatPanel(channel);
	}
	removeChannelButton(channel:ChatChannel)
	{
		for(var i:number = 0; i< this.channelButtons.length; i++)
		{
			if(this.channelButtons[i].id == channel.id)
			{
				var button:ChannelButton = this.channelButtons[i];
				$(button.element).remove();
				this.channelButtons.splice(i,1);
				return;
			}
		}
		Debug.assert(false,"Can't remove channel button for channel:"+channel.name);
	}
	removeChatPanel(channel:ChatChannel)
	{
		for(var i:number = 0; i< this.chatPanels.length; i++)
		{
			if(this.chatPanels[i].id == channel.id)
			{
				var chat:ChatPanel = this.chatPanels[i];
				$(chat.element).remove();
				this.chatPanels.splice(i,1);
				return;
			}
		}
		Debug.assert(false,"Can't remove chat panel for channel:"+channel.name);
	}
	setActiveChannel(channel:ChatChannel)
	{
		Debug.log("Select Active ChannelButton:"+channel.name);
		var button:ChannelButton = this.initChannelButton(channel);
		button.setActive();
		var chat:ChatPanel = this.initChatPanel(channel);
		chat.setActive();
		this.setTopic(channel.topic);
		this.updateChannelMembers(channel);
		this.messagesScrollToBottom(true);
		this.activeChannel = channel;
	}
	onChannelButtonClick(button:ChannelButton)
	{
		Debug.assert(button!=null,"Button is null!");
		this.onActiveChannelChanged.send(button.channel);
	}
	onCloseChannelButtonClick(button:ChannelButton)
	{
		Debug.assert(button!=null,"Button is null!");
		this.onChannelClosed.send(button.channel);
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
	
	closePopup():void
	{
		Debug.log("Closing popups");
		$('.modal').modal('hide');
	}
	
	reload():void
	{
		Debug.log("Reloading page!");
		
		this.closePopup();
		
		this.setLoading("Reloading");
		this.fatalError("Server Maintenance, please wait...");
		
		var id:number = setTimeout(function():void
		{
			window.location.reload();
		},5000);
	}
	
	showUserInfo(user:ChatMember):void
	{
		Debug.log("Show user info:"+user.name);
		this.closePopup();
		$(HtmlID.USER_INFO).modal('show');
		
		var content:string = "";
		var i:number = 0;
		for(var item in user)
		{
			//content += "<div class='row"+(i%2?"":" alt")+"'><span class='variable'>"+item+"</span><div class='value pull-right'>" + user[item]+ "</div></div>";
			content += "TODO";
			i++;
		}
		
		$(HtmlID.USER_INFO_BODY).html(content);
		
		var container:HTMLElement = document.createElement("div");
		var privaButton:HTMLElement = document.createElement("button");
		$(HtmlID.USER_INFO_BODY).append(container);
		$(container).append(privaButton);
		
		container.className = "well";
		privaButton.className = "btn btn-info btn-sm";
		//privaButton.type = "button";
		privaButton.innerHTML = "Private Message";
		$(privaButton).attr("user",user["name"]);
		
		var ui:Userinterface = this;
		$(privaButton).click(function()
		{
			ui.closePopup();
			var targetUser:string = $(this).attr("user");
			Debug.log("Priva: "+targetUser);
			//TODO private chat
			//client.sendPrivateChat(targetUser,"Private Chat Request");
		});
	}
	setChannelTopic(channel:ChatChannel)
	{
		//Make sure that the channel topic is changed in the button channel data also!
		var button:ChannelButton = this.initChannelButton(channel);
		if(button.isActive())
		{
			this.setTopic(channel.topic);
		}
	}
	setTopic(topic:string)
	{
		$(HtmlID.TOPIC).html(Utils.linkify(topic));
	}
	updateChannelMembers(channel:ChatChannel)
	{
		$(HtmlID.USERS_LIST).empty();
		
		for(var i:number = 0; i < channel.members.length; i++)
		{
			var member:ChatMember = channel.members[i]
			
			Debug.log("User " + member.name+ " status: " + member.status);
			
			var user:HTMLElement = document.createElement("button");
			user.className = "btn btn-block btn-xs user-label";
			
			switch(member.status)
			{
				case "away":
				case "afk":
					user.className += " btn-info"; // light blue for unavailable but maybe back later
					// user.className += " btn-warning";
					break;
				case "idle":
				case "paskalla":
					user.className += " btn-warning"; // orange for idle + available
					// user.className += " btn-info";
					break;
				case "busy":
				case "offline":
					user.className += " btn-danger"; // red for busy / dnd
					break;
				default:
                    user.className += " btn-success"; // green for active + available
					// user.className += " btn-primary";
					break;
			}
			
			user.innerHTML = '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> '+member.name;
			$(user).attr("user",member.name);
			var signal:Signal = this.onPrivateChatStarted;
			$(user).click(function()
			{
				signal.send($(this).attr("user"));
			});
			
			$(user).attr("title", member.status);
			$(user)['tooltip']({
				placement:"right",
				container:"body"
			});
			
			$(user).mouseenter(function()
			{
				//$('.tooltip').each(function(){$(this)['tooltip']('hide');});
				if($(user).attr("data-toggle")!="tooltip")
				{
					$(user).attr("data-toggle", "tooltip");
					$(user)['tooltip']("show");
				}
				else
				{
					$(user).attr("data-original-title", member.status);
				}
			});
			
			$(HtmlID.USERS_LIST).append(user);
		}
	}
	messagesScrollToBottom(fast:boolean)
	{
		var h = $(HtmlID.MESSAGES)[0].scrollHeight;
		
		if(fast==true)
		{
			//Can't set directly since stuff is still being loaded :/
			$(HtmlID.MESSAGES).stop().animate({ scrollTop: h},{duration:10});
			return;
		}
		
		if(!this.settings.useAutoScroll)
		{
			return;
		}
		
		$(HtmlID.MESSAGES).stop().animate({ scrollTop: h}, "slow");
		//$(this.messagesContainer).scrollTop = h;
	}
	focusTextbox = function()
	{
		if(!$(HtmlID.MESSAGE_INPUT).is(":focus") /*&& e.keyCode == '32' */ ) //Space
		{
			$(HtmlID.MESSAGE_INPUT).focus();
		}
	}
	setServerStatus(status:string)
	{
		Debug.log("Server Status: " + status);
		$(HtmlID.SERVER_STATUS).html(status);
	}
	clearIdleTimer()
	{
		if(this.idleTimeout!=null)
		{
			clearTimeout(this.idleTimeout);
		}
		this.idleTimeout=null;
	}
	idleTimer()
	{
		if(this.autoIdle)
		{
			if(this.autoIdleStartTime!=null)
			{
				var d1:any = new Date();
				var d2:any = this.autoIdleStartTime;
				NotificationSystem.get().showPopover("You were idle for "+Math.floor((d1-d2)/1000)+" seconds.","");
				this.autoIdleStartTime=null;
			}
			
			this.onStatusChange.send("back");
			this.autoIdle=false;
		}
		
		this.clearIdleTimer();
		var ui:Userinterface = this;
		this.idleTimeout = setTimeout(function()
		{
			ui.onStatusChange.send("idle");
			ui.clearIdleTimer();
			ui.autoIdle = true;
			ui.autoIdleStartTime = new Date();
			NotificationSystem.get().showPopover("You have been marked as idle.","");
		},this.autoIdleMinutes*60*1000);
	}
	
	handleGlobalKeyDown(e:any)
	{
		this.idleTimer();
			
		if(e.shiftKey || e.ctrlKey) return;
			
		this.focusTextbox();
	}
	
	handleShortcutKeys(e:any):boolean
	{
		if(e.keyCode == '38' && !e.shiftKey)	//UP
		{
			e.preventDefault();
			if($(HtmlID.MESSAGE_INPUT).val()=="")
			{
				$(HtmlID.MESSAGE_INPUT).val(this.history.get(0));
			}
			else
			{
				$(HtmlID.MESSAGE_INPUT).val(this.history.get(-1));
			}
			return true;
		}
		else if(e.keyCode == '40' && !e.shiftKey)	//DOWN
		{
			e.preventDefault();
			$(HtmlID.MESSAGE_INPUT).val(this.history.get(+1));
			return true;
		}
		else if(e.keyCode == '37' && e.altKey) // ALT + left
		{
			e.preventDefault();

			this.swapChannel(-1);
			
			return true;
		}
		else if(e.keyCode == '39' && e.altKey)	// ALT + right
		{
			e.preventDefault();
			
			this.swapChannel(+1);
			
			return true;
		}
		else if(e.keyCode == '9')	//TAB
		{
			this.autoComplete();
			e.preventDefault();
			return true;
		}
		return false;
	}
	
	autoComplete():void
	{
		var current:string = $(HtmlID.MESSAGE_INPUT).val();
		
		var arrayCurrent:Array<string> = current.split(" ");
		if(arrayCurrent.length > 0)
		{
			var lastEntry:string = arrayCurrent[arrayCurrent.length - 1];
			var resultArray:Array<string> = [];
			
			for(var i:number = 0; i<this.activeChannel.members.length; i++)
			{
				var nickName:string = this.activeChannel.members[i].name;
				if(lastEntry.length <= nickName.length)
				{
					if(nickName.toLowerCase().indexOf(lastEntry.toLowerCase()) == 0)
					{
						// found something
						resultArray.push(nickName);
						arrayCurrent[arrayCurrent.length - 1] = nickName;
						$(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
					} 
				}
			}

			if(resultArray.length > 0)
			{
				if(resultArray.length == 1)
				{
					arrayCurrent[arrayCurrent.length - 1] = resultArray[0];
					$(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
				}
				else
				{
					var lowerCaseResults:Array<string> = [];
					
					for (var str in resultArray)
					{
						lowerCaseResults.push(resultArray[str].toLowerCase());
					}
			
					var commonStr = this.sharedStart(lowerCaseResults);

					arrayCurrent[arrayCurrent.length - 1] = commonStr;
					$(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
				}
			}
		}
	}
	
	sharedStart(array:Array<string>)
	{
		var A:Array<string> = array.concat().sort(), 
		a1 = A[0], a2= A[A.length-1], L= a1.length, i= 0;
		while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
		return a1.substring(0, i);
	}
	
	swapChannel(dif:number)
	{
		var i:number = 0;
		
		for( ; i<this.channelButtons.length; i++)
		{
			if(ChannelButton.activeChannelButton == this.channelButtons[i])
			{
				break;
			}
		}
		
		i += dif;
		
		if(i < 0) i = this.channelButtons.length-1;
		if(i >= this.channelButtons.length) i = 0;
		this.onChannelButtonClick(this.channelButtons[i]);
	}
	
	initKeyboard()
	{
		var ui:Userinterface = this;
		
		$(document).keydown(function(e) { ui.handleGlobalKeyDown(e); });
		
		$(document).mousemove(function(e) { ui.idleTimer(); });
		
		$(HtmlID.MESSAGE_INPUT).keydown(function(e) { ui.handleShortcutKeys(e); });
		
		$(HtmlID.MESSAGE_INPUT).keypress(function(e) { ui.handleMessageInputKeyPress(e); });
	}
	
	handleMessageInputKeyPress(e:any)
	{
		//Enter/Send
		if(e.which == 13 && !e.shiftKey)
		{
			var msg:string = $(HtmlID.MESSAGE_INPUT).val();
			$(HtmlID.MESSAGE_INPUT).val('');
			e.preventDefault();
			this.onMessageSend.send(msg);
			this.history.add(msg);
		}
	}
}