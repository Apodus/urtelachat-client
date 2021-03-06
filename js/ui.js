function ChatUI()
{
}
{
	ChatUI.prototype.init = function(
		channelButtonsContainer,
		messagesContainer,
		channelTopicContainer
	)
	{
		log("Init UI");
		
		this.userChannel = "";
		this.userChannel = getCookie("userchannel");
		if(this.userChannel == "")
		{
			setCookie("userchannel", "lobby", 365);
			this.userChannel = "lobby";
		}
		log("User Channel:"+this.userChannel);
		
		this.useAutoScroll = true;
		this.myMsgIndex = 0;
		this.myMsgHistory = [''];
		this.prevIsAlt = false;
		this.useChatMessageFade = true;
		this.myDropzone = null;
		this.channelButtonsContainer = channelButtonsContainer;
		this.messagesContainer = messagesContainer;
		this.channelTopicContainer = channelTopicContainer;
		this.initSettings();
		this.focusTextbox();
		this.resizeScreen();
		this.initKeyboard();
		this.updateNotificationSettings();
		this.timeCheck();
		this.idleTimeout=null;
		this.autoIdle=false;
		this.activePlugin = null;
		this.autoIdleMinutes=1;
		this.customTheme=null;
		
		this.idleTimer();
	}
	
	ChatUI.prototype.timeCheck = function()
	{
		var date = new Date();
		var day = date.getDay();
		//var day = date.getSeconds();
		if(ui.prevDay==null)
		{
			ui.prevDay = day
		}
		else
		{
			if(ui.prevDay!=day)
			{
				ui.prevDay=day;
				ui.addMarker(date.toString());
			}
		}
		setTimeout(ui.timeCheck, 60*1000);
	}

	ChatUI.prototype.historyUp = function()
	{
		this.myMsgHistory[this.myMsgIndex] = $('#message-input').val();

		if(--this.myMsgIndex < 0)
		{
			this.myMsgIndex = this.myMsgHistory.length - 1;
		}
		$('#message-input').val(this.myMsgHistory[this.myMsgIndex]);
	}

	ChatUI.prototype.historyDown = function()
	{
		this.myMsgHistory[this.myMsgIndex] = $('#message-input').val();

		if(++this.myMsgIndex >= this.myMsgHistory.length)
		{
			this.myMsgIndex = 0;
		}
		$('#message-input').val(this.myMsgHistory[this.myMsgIndex]);
	}
	
	ChatUI.prototype.swapChannel = function(next)
	{
		var elem = document.getElementById(ui.getChannelID(ui.userChannel).substring(1));
		var channel = (next==true ? elem.nextElementSibling : elem.previousSibling);
		
		if(channel == null)
		{
			channel = (next==true ? elem.parentNode.firstChild : elem.parentNode.lastChild);
		}
		channel = $(channel).find(".name").html();
		if(channel != null && channel != undefined)
		{	
			log("goto channel: "+channel);
			this.setActiveChannel(channel);
		}	
	}
	
	ChatUI.prototype.addToInputHistory = function(msg)
	{
		this.myMsgHistory.push(msg);
		this.myMsgIndex = 0;
		this.myMsgHistory[this.myMsgIndex] = '';
	}
	
	ChatUI.prototype.initKeyboard = function()
	{
		$(document).keydown(function(e)
		{
			ui.idleTimer();
			
			if(e.shiftKey || e.ctrlKey) return;
			
			if(!$("#message-input").is(":focus") /*&& e.keyCode == '32' */ ) //Space
			{
				ui.focusTextbox();
			}
		});
		
		$(document).mousemove(function(e)
		{
			ui.idleTimer();
		});
		$(document).keydown(function(e)	{
                  if(e.altKey) {
                    e.preventDefault(); // navigation
                  }
                });
		$("#message-input").keydown(function (e)
		{
			if(e.keyCode == '38' && !e.shiftKey)
			{
				e.preventDefault();
				ui.historyUp();
			}
			else if(e.keyCode == '40' && !e.shiftKey)
			{
				e.preventDefault();
				ui.historyDown();
			}
			else if(e.keyCode == '37' && e.altKey)
			{
				e.preventDefault();
				ui.swapChannel();
			}
			else if(e.keyCode == '39' && e.altKey)
			{
				e.preventDefault();
				ui.swapChannel(true);
			}
			else if(e.keyCode == '9')
			{
				// autocomplete Tab
				e.preventDefault();
				var current = $('#message-input').val();
				var arrayCurrent = current.split(" ");
				if(arrayCurrent.length > 0)
				{
					var lastEntry = arrayCurrent[arrayCurrent.length - 1];
					var resultArray = [];
					
					var users = client.getUsers(ui.userChannel);
					for(var nickName in users)
					{
						if(lastEntry.length <= nickName.length)
						{
							if(nickName.toLowerCase().indexOf(lastEntry.toLowerCase()) == 0)
							{
								// found something
								resultArray.push(nickName);
								arrayCurrent[arrayCurrent.length - 1] = nickName;
								$('#message-input').val(arrayCurrent.join(" "));
							} 
						}
					}

					if(resultArray.length > 0)
					{
						if(resultArray.length == 1)
						{
							arrayCurrent[arrayCurrent.length - 1] = resultArray[0];
							$('#message-input').val(arrayCurrent.join(" "));
						}
						else
						{
							var lowerCaseResults = [];
							for (var str in resultArray)
							{
								lowerCaseResults.push(resultArray[str].toLowerCase());
							}
					
							var commonStr = sharedStart(lowerCaseResults);

							arrayCurrent[arrayCurrent.length - 1] = commonStr;
							$('#message-input').val(arrayCurrent.join(" "));
						}
					}
				}
			}
		});
		  
		$("#message-input").keypress(function (e)
		{
			//Enter/Send
			if(e.which == 13 && !e.shiftKey)
			{
				var msg = $('#message-input').val();
				if(msg == "")
				{
					e.preventDefault();
					return;
				}
			  
				ui.addToInputHistory(msg);
				
				var split = msg.split(" ");

				if(split[0] == "/part")
				{
					var channel = ui.userChannel;
					log("Part: "+channel);
					ui.removeChannelButton(channel);
					client.exitChannel(channel);
				}
				if(split[0] == "/status")
				{
					split.shift();
					client.setStatus(split.join(" "));
				}
				else if(split[0] == "/marker")
				{
					split[0] ="";
					var markerData = split.join(" ");
					ui.addMarker(markerData);
				}
				else if(split[0] == "/clear")
				{
					delete client.channelHistories[ui.userChannel];
					ui.clearChatMessages();
				}
				else if(split[0] == "/query")
				{
					log("looks like query");
					if(split.length > 2)
					{
						var who = split[1];
						var what = split[2];
						
						for(var i=3; i<split.length; ++i)
						{
							what += " " + split[i];
						}
						
						log(who + '|' + what);
						client.sendPrivateChat(who,what);
						log("finished query");
					}
				}
				else if(split[0] == "/imdb")
				{
					var sMovie = "";
					var splitMsg = msg.split(" ");
					for(var k=1; k<splitMsg.length; ++k)
					{
						if(k>1) sMovie += " ";
						
						sMovie += splitMsg[k];
					}

					var sUrl = 'http://www.omdbapi.com/?t=' + sMovie + '&plot=short&type=movie&tomatoes=true';

					$.ajax(sUrl,{
						complete: function(p_oXHR, p_sStatus)
						{
							oData = $.parseJSON(p_oXHR.responseText);
							if("imdbID" in oData) 
							{
								var movieDataString = "<div class=\"well imdbwrap\"><div class=\"imdbtext\">";
								movieDataString += "<strong>" + oData.Title + "</strong> (" + oData.Year + ") (" + oData["Genre"] + ")  <br/>tomato meter: " + oData.tomatoMeter + "/100 (" + oData.tomatoImage + ")<br/>";
								movieDataString += "imdb score: " + oData["imdbRating"] + "<br/>";
								movieDataString += "<br/>What is it about:<br/>" + oData.Plot + "<br/>";
								movieDataString += "<br/>Tomato concensus:<br/>" + oData.tomatoConsensus + "<br/>";
								movieDataString += "</div><div class=\"imdbimg\">";
								movieDataString += "<a href=\"http://www.imdb.com/title/" + oData["imdbID"] +  "/\" target=\"_blank\"><img style=\"width:10em; height:15em;\" src=\"" + oData.Poster + "\"/></a>";
								movieDataString += "</div></div>";
								client.socket.emit('imdb', ui.userChannel + "|" + movieDataString);
							}
							else
							{
								ui.addLine(timeNow(), "IMDB", "movie '" + sMovie  + "' not found :(");
							}
						}
					});
				}
				else
				{
					client.socket.emit('chat message', ui.userChannel + "|" + msg);
				}
				
				$('#message-input').val('');
				e.preventDefault();
			}
	  });	
	}
	
	ChatUI.prototype.setAutoScroll = function(scroll)
	{
		this.useAutoScroll = scroll;
	}
	
	ChatUI.prototype.bindActions = function(
		onSetActiveChannel
	)
	{
		this.onSetActiveChannel = onSetActiveChannel;
	}
	
	ChatUI.prototype.serverCommand = function(command)
	{
		ui.reload();
	}
	
	ChatUI.prototype.resizeScreen = function()
	{
		/*
		window.onresize = ui.resizeScreen;
		
		var h = $(window).height() * 0.99;
		var w = $(window).width() * 0.99;
	  
		//$("#channels").height(h * 0.05);
		//$("#channels").width(w * 1.00);
	  
		$(ui.messagesContainer).height(h * 0.75);
		//$(this.messagesContainer).width(w * 0.999);
	  
		ui.messagesScrollToBottom();
		*/
	}
	
	ChatUI.prototype.refreshAutoScrollToggleButton = function()
	{
		var button = $("#auto-scroll-toggle");
		var iconOn = $("#auto-scroll-icon-on");
		var iconOff = $("#auto-scroll-icon-off");
		
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

	ChatUI.prototype.initSettings = function()
	{
		//init tooltip
		$("#auto-scroll-toggle").tooltip();
		
		this.refreshAutoScrollToggleButton();
		$("#auto-scroll-toggle").click(function()
		{
			ui.useAutoScroll = !ui.useAutoScroll;
			log("Autoscroll toggled: "+ui.useAutoScroll);
			ui.refreshAutoScrollToggleButton();
			ui.messagesScrollToBottom();
		});
		
		var ui = this;
		
		$("#debug").hide();
		
		this.addDebugButton("Server Command",function()
		{
			client.serverCommand("Shits and giggles");
		});
		
		this.addDebugButton("User Info",function()
		{
			ui.showUserInfo({name:"User1",uid:123123123,avatar:"<span class='glyphicon glyphicon-user' aria-hidden='true'></span><img src='avatar.png' />",comment:"GTFO"});
		});
		
		this.addDebugButton("Reload",function()
		{
			ui.reload();
		});
		
		this.addDebugButton("Private Chat",function()
		{
			pushToChannelHistory("@pena", "00", "pena", "no moro moro");
			ui.addLine("00", "Pena", "no moro moro",null,"@pena");
		});
		
		this.addButton($("#themes"),"Theme1",function()
		{
			ui.loadTheme("css/themes/theme1.min.css");
		});
		
		if(ui.myDropzone==null)
			{
				ui.myDropzone = new Dropzone("div#messages", { url: "/",clickable:false,previewsContainer:"#upload-info"});
				//ui.myDropzone = new Dropzone("div#fileForm", { url: "/"});
				
				ui.myDropzone.on("error", function(file, response)
				{
					ui.closePopup();
					$("#fileUpload").modal("show");
				});
				
				ui.myDropzone.on("success", function(file, response)
				{
					ui.closePopup();
					$("#fileUpload").modal("show");
					
					if(file.type.search("image") != -1)
					{
						client.socket.emit('upload img', ui.userChannel + '|' + file.name);
					}
					else
					{
						log("File Type:"+file.type);
						client.socket.emit('upload file', ui.userChannel + '|' + file.name);
					}
				});
			}
	}
	
	ChatUI.prototype.loadTheme = function(themeFile)
	{
		if(ui.customTheme!=null)
		{
			$(ui.customTheme).remove();
			ui.customTheme=null;
		}
		  
		var fileref=document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", themeFile);
    
		if (typeof fileref!="undefined")
        {
			document.getElementsByTagName("head")[0].appendChild(fileref);
			ui.customTheme = fileref;
		}
	}
	
	ChatUI.prototype.addDebugButton = function (name,callback)
	{
		return;
		$("#debug").show();
		//var container = document.createElement("div");
		//container.className = "row";
		
		var button = document.createElement("button");
		button.className = "btn btn-success btn-sm";
		button.type = "button";
		button.innerHTML = name;
		$("#debug").append(button);
		//$(container).append(button);
		$(button).click(callback);
	}
	
	ChatUI.prototype.addButton = function (container,name,callback)
	{
		$(container).show();
		
		var button = document.createElement("button");
		button.className = "btn btn-success btn-sm";
		button.type = "button";
		button.innerHTML = name;
		$(container).append(button);
		$(button).click(callback);
	}

	ChatUI.prototype.focusTextbox = function()
	{
		$("#message-input").focus();
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
		log("Server Status: " + status);
		$("#server-status").html(status);
	}
	
	ChatUI.prototype.clearChatMessages = function()
	{
		//$(this.messagesContainer).html("");
		$(this.messagesContainer+' > div').each(function ()
		{
			/* ... */
			$(this).hide();
		});
		
	}
	ChatUI.prototype.clearIdleTimer = function()
	{
		if(ui.idleTimeout!=null)
		{
			clearTimeout(ui.idleTimeout);
		}
		ui.idleTimeout=null;
	}
	ChatUI.prototype.idleTimer = function()
	{
		if(ui.autoIdle)
		{
			client.setStatus("back");
			ui.autoIdle=false;
		}
		
		ui.clearIdleTimer();
		ui.idleTimeout = setTimeout(function()
		{
			client.setStatus("idle");
			ui.clearIdleTimer();
			ui.autoIdle = true;
		},ui.autoIdleMinutes*60*1000);
	}
	
	ChatUI.prototype.updateUsers = function(users)
	{
		var usersList = document.getElementById("users");
		usersList.innerHTML="";
		
		for(var nickName in users)
		{
			log("User " + nickName + " status: " + users[nickName]);
			
			var user = document.createElement("button");
			user.id = "user_" + nickName;
			user.className = "btn btn-block btn-xs user-label";
			
			var status = client.getUserStatus(nickName) || users[nickName];
			switch(status)
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
			
			user.innerHTML = '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> '+nickName;
			$(user).attr("user",nickName);
			$(user).click(function()
			{
				//ui.showUserInfo({name:$(this).attr("user"), avatar:"<span class='glyphicon glyphicon-user' aria-hidden='true'></span>",comment:"null"});
				ui.startPrivateChat($(this).attr("user"));
			});
			usersList.appendChild(user);
		}
	}
	
	ChatUI.prototype.startPrivateChat = function(user)
	{
		assert(user!=null,"No User set!");
		var channel = "@"+user;
		ui.initChannelButton(channel);
		ui.setActiveChannel(channel);
		ui.addLine(timeNow(),"SYSTEM","Private chat with "+user,true,channel);
	}
	
	ChatUI.prototype.getChannelPlugin = function(channel,history)
	{
		history = history || [];
		var channelInfo = channel.split("#");
		
		var plugin = null;
		if(channelInfo.length>1)
		{
			var pluginName;
			switch(channelInfo[1])
			{
				case "whiteboard":
				case "WB":
					pluginName = "whiteboard";
					break;
				case "dungeon":
				case "D":
					pluginName = "dungeon";
					break;
				default:
					pluginName= null;
				break;
			}
			
			if(pluginName!=null)
			{
				plugin = {
					init:function()
					{
						log("Init "+this.name+" for:"+this.channel);
						var script = document.createElement('script');
						script.src = "js/plugin/" + this.name + ".js";
						script.setAttribute("name",this.name);
						script.onload = function () 
						{
							eval(this.getAttribute("name")+"ChatPluginInit")(plugin);
							plugin.loaded = true;
						};
						document.head.appendChild(script);
					},
					channel:channelInfo[0],
					channelInfo:channelInfo[1],
					name:pluginName,
					onClose:function()
					{
						log("plugin onClose not overridden!");
					},
					onAddLine:function(time, who, what,marker,channel)
					{
						log("plugin onAddLine not overridden!");
					},
					addLine:function(msg,channel)
					{
						//log(msg+": "+channel);
						//ui.addLine(timeNow(),"Plugin",msg,false,channel);
						client.socket.emit('chat message', channel + "|" + msg);
					},
					getUsers:function()
					{
						return client.getUsers(this.getChannelRealName());
					},
					getChannelRealName:function()
					{
						return this.channel+"#"+this.channelInfo;
					},
					history:history,
					loaded:false
				};
			}
		}
		
		
		if(plugin==null)
		{
			log("no plugin for channel:"+channel);
		}
		return plugin;
	}
	
	ChatUI.prototype.setActiveChannel = function(channel)
	{
		log("UI SetActiveChannel:"+channel+ " prev:"+this.userChannel);
		
		var channelID = this.getChannelID(this.userChannel);
		var prevChannel = $(channelID);
		if(prevChannel)
		{
			prevChannel.removeClass("btn-success");
		}
		
		setCookie("userchannel", channel, 365);
		this.userChannel = channel;
		
		if(this.activePlugin!=null)
		{
			this.activePlugin.onClose();
			this.activePlugin=null;
		}
		
		channelID = ui.getChannelID(ui.userChannel);
		
		$(channelID).addClass("btn-success");
		$(channelID).removeClass("btn-info");//if notified
		$(channelID+" .message-count:first").html("");
		ui.clearChatMessages();
		
		var existing = $(channelID+"_messages").length>0;
		
		this.useChatMessageFade=false;
		this.onSetActiveChannel(channel,existing);
		
		var history = client.getChannelHistory(channel);
		
		var channelPlugin = this.getChannelPlugin(channel,history);
		if(channelPlugin!=null)
		{
			channelPlugin.init();
			this.activePlugin = channelPlugin;
		}
		else
		{
			if(!existing)
			{
				// populate with history if available
				if(history!=null)
				{
					for(var index in history)
					{
						this.addLine(
							history[index][0],
							history[index][1],
							history[index][2],
							history[index][3],
							channel
						);
					}
				}
			}
		}
		
		this.useChatMessageFade=true;
		
		if(existing)
		{
			$(channelID+"_messages").show();
			this.messagesScrollToBottom(true);
		}
	}
	
	ChatUI.prototype.setTopic = function(topic)
	{
		assert($(this.channelTopicContainer)!=null,"channelTopicContainer is null");
		//$(this.channelTopicContainer).hide();
		$(this.channelTopicContainer).html(topic);
		//$(this.channelTopicContainer).slideDown();
	}
	
	ChatUI.prototype.messagesScrollToBottom = function(fast)
	{
		var h = $(ui.messagesContainer)[0].scrollHeight;
		
		if(fast==true)
		{
			//Can't set directly since stuff is still being loaded :/
			$(ui.messagesContainer).stop().animate({ scrollTop: h},{duration:10});
			return;
		}
		
		if(!this.useAutoScroll)
		{
			return;
		}
		
		$(ui.messagesContainer).stop().animate({ scrollTop: h}, "slow");
		//$(this.messagesContainer).scrollTop = h;
	}
	
	ChatUI.prototype.initChannelButton = function(channel)
	{
		log("Init button for channel: "+channel);
		
		var channelID = ui.getChannelID(channel);
		
		var existing = $(channelID).length > 0;
		var channelButton = $(channelID);
		
		if(!existing)
		{
			channelButton = document.createElement("button");
			channelButton.id = channelID.substring(1);
			channelButton.className = "btn";
			channelButton.type = "button";
			
			var closeButton = document.createElement("span");
			//closeButton.className = "btn btn-error btn-xs";
			//closeButton.type = "button";
			closeButton.id = "close_channel_" + channelID.substring(1);
			
			$(closeButton).hide();
			
			$(channelButton).hover(function()
			{
				//Tooltips
				if($(channelButton).attr("data-toggle")!="tooltip")
				{
					$(channelButton).attr("data-toggle", "tooltip");
					$(channelButton).attr("data-placement", "bottom");
					$(channelButton).attr("title", client.getTopic(channel));
					$(channelButton).tooltip("show");
				}
				else
				{
					$(channelButton).attr("title", client.getTopic(channel));
				}
				
				if(channel!="lobby")
				{
					//Disabled for now
					$(closeButton).show();
				}
			});
			
			$(channelButton).mouseleave(function()
			{
				$(closeButton).hide();
			});

			if(this.userChannel == channel)
			{
				$(channelButton).addClass("btn-success");
			}

			channelButton.onclick = function()
			{
				log("ChannelButton:"+channel);
				ui.setActiveChannel(channel);
			};
			
			$(this.channelButtonsContainer).append(channelButton);
			
			var channelName = document.createElement("span");
			channelName.className = "name";
			channelName.innerHTML = channel;
			$(channelButton).append(channelName);
			
			var messages = document.createElement("span");
			messages.className = "message-count badge";
			$(channelButton).append(messages);
			
			var closeIcon = document.createElement("span");
			closeIcon.className = "glyphicon glyphicon-remove";
			$(closeIcon).attr("aria-hidden", "true");
			$(channelButton).append(closeButton);
			$(closeButton).append(closeIcon);
			
			$(closeButton).click(function()
			{
				channelButton.onclick = null;
				$(channelButton).tooltip("hide");
				ui.removeChannelButton(channel);
				client.exitChannel(channel);
			});
		}
		if(ui.isPrivateChannel(channel))
		{
			channelButton.className = "btn btn-info";
		}
		return existing;
	}
	
	ChatUI.prototype.removeChannelButton = function(channel)
	{
		log("Removing channel: "+channel);
		
		var channelID = ui.getChannelID(channel);
		$(channelID).remove();
		
		if(this.userChannel==channel)
		{
			log("Was the active channel...");
			this.setActiveChannel("lobby");
		}
	}
	
	ChatUI.prototype.isPrivateChannel = function(channel)
	{
		return channel[0]=="@";
	}
	
	ChatUI.prototype.getChannelID = function(channel)
	{
		assert(channel!=null);
		assert(channel!=undefined);
		assert(channel!="");
		
		if(channel != null && channel.length>0 && channel[0]=="@")
		{
			log("Got Private Channnel: "+channel);
			channel = "private_"+channel.substring(1);
		}
		
		channel = channel.split("#").join("_plugin_");
		
		channel = "#channel_"+channel;
		
		return channel;
	}
	
	ChatUI.prototype.newContent = function(channel)
	{
		if(channel == ui.userChannel) return;
		
		var channelID = ui.getChannelID(channel);
		
		if(!(channel in notificationsTemporary) || notificationsTemporary[channel] == true)
		{
			var element = $(channelID);
			element.addClass("btn-info");
			var name = $(channelID+" .name:first");
			
			var count = parseInt($(channelID+" .message-count:first").html());
			if(isNaN(count))
			{
				count = 0;
			}
			count++;
			log("New Content: "+count);
			$(channelID+" .message-count:first").html(count.toString());
		}
	}
	
	ChatUI.prototype.closePopup = function()
	{
		log("Closing popups");
		$('.modal').modal('hide');
	}
	
	ChatUI.prototype.reload = function()
	{
		log("Reloading page!");
		
		ui.closePopup();
		
		ui.setLoading("Reloading");
		fatalError("Server Maintenance, please wait...");
		
		var id = setTimeout(function()
		{
			window.location.reload();
		},5000);
	}
	
	ChatUI.prototype.showUserInfo = function(user)
	{
		log("Show user info:"+user);
		this.closePopup();
		$('#userInfo').modal('show');
		
		var content = "";
		var i=0;
		for(var item in user)
		{
			content += "<div class='row"+(i%2?"":" alt")+"'><span class='variable'>"+item+"</span><div class='value pull-right'>"+user[item] + "</div></div>";
			i++;
		}
		
		$('#userInfoBody').html(content);
		
		var container = document.createElement("div");
		var privaButton = document.createElement("button");
		$('#userInfoBody').append(container);
		$(container).append(privaButton);
		
		container.className = "well";
		privaButton.className = "btn btn-info btn-sm";
		privaButton.type = "button";
		privaButton.innerHTML = "Private Message";
		$(privaButton).attr("user",user["name"]);
		
		$(privaButton).click(function()
		{
			ui.closePopup();
			var targetUser = $(this).attr("user");
			log("Priva: "+targetUser);
			client.sendPrivateChat(targetUser,"Private Chat Request");
			//ui.addLine("",targetUser,"This is private chat.",null,"@"+targetUser);
		});
	}
	
	ChatUI.prototype.addMarker = function(marker)
	{
		ui.addLine("","<span class='glyphicon glyphicon-time' aria-hidden='true'></span>",new Date().toString()+"<br/>"+marker,true);
	}
	
	ChatUI.prototype.addLine = function(time, who, what,marker,channel)
	{
		if(this.activePlugin!=null)
		{
			if(this.activePlugin.loaded==true)
			{
				var result = this.activePlugin.onAddLine(time,who,what,marker,channel);
				if(result)
				{
					return;
				}
			}
			else
			{
				this.activePlugin.history.push([time,who,what,marker,channel]);
			}
		}
		
		if(channel==null)
		{
			channel = ui.userChannel;
		}
		else
		{
			log("addline to:"+channel);
		}
		
		var sameChannel = channel == ui.userChannel;
		
		if(!sameChannel)
		{
			log("Got message to another channel than current! Current:"+ui.userChannel+" New:"+channel+" Msg:"+what);
			ui.initChannelButton(channel);
		}
		
		what = universe_jira_links(what);
		what = small_images(what);
		what = custom_emotes(what);
		
		var messagesContainer = document.getElementById("messages");
		var messages = null;
		
		var channelID = ui.getChannelID(channel);
		
		if($(channelID+"_messages").length>0)
		{
			messages = $(channelID+"_messages")[0];
			if(sameChannel)
			{
				$(channelID+"_messages").show();
			}
		}
		else
		{
			messages = document.createElement("div");
			messages.id = channelID.substring(1)+"_messages";
			messagesContainer.appendChild(messages);
		}
		
		var useAlt = false;
		var sameUser = false;
	  
		if(messages.lastChild)
		{
			try
			{
				if(messages.lastChild.firstChild.firstChild.innerHTML == who)
				{
					useAlt = this.prevIsAlt;
				}
				else
				{
					useAlt = !this.prevIsAlt;
				}
			}catch(e){}
		}
		
		var messageElement = null;
		var messageBody = null;
	  
		if(marker != true && this.prevIsAlt == useAlt && messages.lastChild && messages.lastChild.firstChild)
		{
			sameUser=true;
			messageBody = messages.lastChild.firstChild;
		}
		else
		{
			messageElement = document.createElement("div");
			messageElement.className = "message-block";
			
			messageBody = document.createElement("div");
			messageElement.appendChild(messageBody);
		
			messages.appendChild(messageElement);
		
			if(this.useChatMessageFade)
			{
				$(messageElement).hide();
				$(messageElement).fadeIn();
			}
		
			if(useAlt)
			{
				messageBody.className = "message-body alt-bg row ";
			}
			else
			{
				messageBody.className = "message-body row";
			}
		}
	  
		this.prevIsAlt = useAlt;
	  
		var elem_who = null;
		var elem_time= null;
		var elem_what = null;
		
		if(!sameUser)
		{
			elem_who = document.createElement("span");
			elem_who.className = "label col-md-1 who user-label";
			if(marker!=true)
			{
				elem_who.className += " label-success";
			}
			else
			{
				elem_who.className += " label-info";
			}
			messageBody.appendChild(elem_who);
			elem_who.innerHTML = who;
		}
		else
		{
			elem_who = messageBody.firstChild;
		}

		if(sameUser)
		{
			elem_what = elem_who.nextElementSibling;
			
			var newMessage = document.createElement("span");
			newMessage.innerHTML = "<br/>"+what;
			elem_what.appendChild(newMessage);
			
			if(this.useChatMessageFade)
			{
				$(newMessage).hide();
				$(newMessage).fadeIn();
			}
		}
		else
		{
			elem_what = document.createElement("div");
			elem_what.innerHTML = what;
			elem_what.className = "chat-message col-md-10";
			messageBody.appendChild(elem_what);
		}
	  
		if(sameUser)
		{
			elem_time = elem_what.nextElementSibling;
			elem_time.innerHTML += "<br/>"+time;
		}
		else
		{
			elem_time = document.createElement("div");
			elem_time.innerHTML = time;
			elem_time.className = "time col-md-1 text-right";
			messageBody.appendChild(elem_time);
		}
	  
		this.messagesScrollToBottom();
	}
	
	ChatUI.prototype.updateNotificationSettings = function()
	{
		var allow = getCookie(ui.userChannel + "_notify");
		log("Get cookie: "+ui.userChannel + "_notify"+"= "+allow);
		if(allow==null || allow == "")
		{
			allow = "allow"; // default;
		}
  
		if(allow == "allow")
		{
			$("#notifytoggle").html("<strong>" + ui.userChannel + ":</strong> Notifications Enabled");
			$("#notifytoggle").addClass("btn-success");
			$("#notifytoggle").removeClass("btn-warning");
			$("#notifytoggle").click(function()
			{
				setCookie(ui.userChannel + "_notify", "forbid");
				ui.updateNotificationSettings();
			});
		}
		else
		{
			$("#notifytoggle").html("<strong>" + ui.userChannel + ":</strong> Notifications Disabled");
			$("#notifytoggle").removeClass("btn-success");
			$("#notifytoggle").addClass("btn-warning");
			$("#notifytoggle").click(function()
			{
				setCookie(ui.userChannel + "_notify", "allow");
				ui.updateNotificationSettings();
			});
		}
	}
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}
