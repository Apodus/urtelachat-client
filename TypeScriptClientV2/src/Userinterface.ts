/// <reference path="../ref/jquery/jquery.d.ts" />
/// <reference path="..\ref\jquery.simplemodal\jquery.simplemodal.d.ts" />
/// <reference path="..\ref\dropzone\dropzone.d.ts" />
/// <reference path="external.d.ts" />

class Userinterface
{
	onActiveChannelChanged:Signal;
	onChannelClosed:Signal;
	onChannelNotificationToggled:Signal;
	onMessageSend:Signal;
	onStatusChange:Signal;
	onPrivateChatStarted:Signal;
	onPasteData:Signal;
	
	channelButtons:Array<ChannelButton>;
	chatPanels:Array<ChatPanel>;
	
	settings:SettingsPanel;
	
	idleTimeout:number;
	autoIdle:boolean;
	autoIdleMinutes:number;
	autoIdleStartTime:Date;
	
	activeChannel:ChatChannel;
	
	history:MessageInputHistory;
	
	updateAutoScrollOnScrollID:number;
	
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
		this.onChannelNotificationToggled = new Signal();
		this.onPasteData = new Signal();
		
		this.channelButtons = new Array<ChannelButton>();
		this.chatPanels = new Array<ChatPanel>();
		var ui:Userinterface = this;
		this.settings = new SettingsPanel();

		this.messagesScrollToBottom(true);
		this.updateAutoScrollOnScrollID=null;
		this.settings.onAutoScrollChanged.add(function(autoScroll:boolean)
		{
			if(autoScroll)
			{
				ui.messagesScrollToBottom(false);
			}
		});
	
		this.initKeyboard();
		
		this.initGlobalEvents();
	}
	initGlobalEvents()
	{
		window.addEventListener("beforeunload", function (e)
		{
			var confirmationMessage =
			'Plutonium brick in your pants?\n' +
			'You are about to leave the chat.\nPlease don\'t.';

			(e || window.event).returnValue = confirmationMessage; //Gecko + IE
			return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		});
		
		var ui:Userinterface = this;
		$(HtmlID.MESSAGES).scroll(function()
		{
			var h1:number = $(HtmlID.MESSAGES)[0].scrollHeight;
			var h2:number = $(HtmlID.MESSAGES)[0].scrollTop;
			var h3:number = $(HtmlID.MESSAGES).outerHeight();
			
			var enabled:boolean = (h1-h2-h3<=1);

			if(ui.updateAutoScrollOnScrollID!=null)
			{
				clearTimeout(ui.updateAutoScrollOnScrollID);
			}
			ui.updateAutoScrollOnScrollID = setTimeout(ui.settings.setAutoScroll.bind(ui.settings,enabled),500);
		});
		
		document.body.onpaste = this.onPaste.bind(this);
	}
	onPaste(event:any)
	{
		var ui:Userinterface = this;
		var items:any = (event.clipboardData || event.originalEvent.clipboardData).items;

		var load:Function = function(idx:number)
		{
			var blob:any = items[idx].getAsFile();
			var reader:any = new FileReader();
			reader.onload = function(event:any)
			{
				ui.onPasteData.send(event.target.result);
			};
			reader.readAsDataURL(blob);
		}
		
		try
		{
			load(0);
		}
		catch(error)
		{
			load(1);
		}
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
		button.onNotificationsToggled.add(function()
		{
			self.onChannelNotificationToggled.send(button.channel);
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
		
		if(message.type == ChatMessageType.NORMAL && channel.allowNotifications)
		{
			NotificationSystem.get().notify("New Message in "+channel.name,message.sender+":"+'"'+message.message+'"');
		}
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
		Debug.log("Select Active Channel:"+channel.name);
		TooltipManager.hideAll();
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
		Debug.log("Update channel members: "+channel.name);
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
			
			if(member.isOp(channel.name))
			{
				$(user).addClass("channel-op");
				user.innerHTML = '<span class="glyphicon glyphicon-education" aria-hidden="true"></span> '+member.name;
			}
			else
			{
				$(user).removeClass("channel-op");
				user.innerHTML = '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> '+member.name;
			}
			
			$(user).attr("user",member.name);
			var signal:Signal = this.onPrivateChatStarted;
			$(user).click(function()
			{
				signal.send($(this).attr("user"));
			});
			
			$(user).mouseenter(function()
			{
				TooltipManager.show(this,member.status,"right");
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
			$(HtmlID.MESSAGES)[0].scrollTop = h;
			//$(HtmlID.MESSAGES).stop().animate({ scrollTop: h},{duration:10});
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
		this.addLog("Server Status:"+status);
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
		
		if(e.altKey)
		{
			e.preventDefault();
		}
		
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
	updateChannelSettings(channel:ChatChannel)
	{
		for(var i:number = 0; i< this.channelButtons.length; i++)
		{
			if(this.channelButtons[i].id == channel.id)
			{
				var button:ChannelButton = this.channelButtons[i];
				button.updateChannelSettings();
				return;
			}
		}	
	}
	addLog(msg:string)
	{
		if($(HtmlID.LOG_WINDOW).val()=="")
		{
			$(HtmlID.LOG_WINDOW).val(msg);
		}
		else
		{
			$(HtmlID.LOG_WINDOW).val($(HtmlID.LOG_WINDOW).val()+"\n"+msg);
		}
	}
}