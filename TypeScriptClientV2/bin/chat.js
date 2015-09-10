/// <reference path="../ref/jquery/jquery.d.ts" />
/// <reference path="..\ref\jquery.simplemodal\jquery.simplemodal.d.ts" />
/// <reference path="..\ref\dropzone\dropzone.d.ts" />
/// <reference path="external.d.ts" />
var Userinterface = (function () {
    function Userinterface() {
        this.focusTextbox = function () {
            if (!$(HtmlID.MESSAGE_INPUT).is(":focus")) {
                $(HtmlID.MESSAGE_INPUT).focus();
            }
        };
        Debug.log("User interface init.");
        this.idleTimeout = null;
        this.autoIdle = true;
        this.autoIdleMinutes = 1;
        this.activeChannel = null;
        this.history = new MessageInputHistory();
        this.onActiveChannelChanged = new Signal();
        this.onChannelClosed = new Signal();
        this.onMessageSend = new Signal();
        this.onStatusChange = new Signal();
        this.onPrivateChatStarted = new Signal();
        this.onChannelNotificationToggled = new Signal();
        this.channelButtons = new Array();
        this.chatPanels = new Array();
        this.settings = new SettingsPanel();
        this.initKeyboard();
        this.initGlobalEvents();
    }
    Userinterface.prototype.initGlobalEvents = function () {
        window.addEventListener("beforeunload", function (e) {
            var confirmationMessage = 'Plutonium brick in your pants?\n' +
                'You are about to leave the chat.\nPlease don\'t.';
            (e || window.event).returnValue = confirmationMessage;
            return confirmationMessage;
        });
    };
    Userinterface.prototype.initChannelButton = function (channel) {
        for (var i = 0; i < this.channelButtons.length; i++) {
            if (this.channelButtons[i].id == channel.id) {
                return this.channelButtons[i];
            }
        }
        var button = new ChannelButton(channel);
        this.channelButtons.push(button);
        $(HtmlID.CHANNELS).append(button.element);
        var self = this;
        button.onNameClick.add(function () {
            self.onChannelButtonClick(button);
        });
        button.onCloseClick.add(function () {
            self.onCloseChannelButtonClick(button);
        });
        button.onNotificationsToggled.add(function () {
            self.onChannelNotificationToggled.send(button.channel);
        });
        return button;
    };
    Userinterface.prototype.initChatPanel = function (channel) {
        for (var i = 0; i < this.chatPanels.length; i++) {
            if (this.chatPanels[i].id == channel.id) {
                return this.chatPanels[i];
            }
        }
        var chat = new ChatPanel(channel);
        this.chatPanels.push(chat);
        $(HtmlID.MESSAGES).append(chat.element);
        return chat;
    };
    Userinterface.prototype.addMessage = function (channel, message) {
        Debug.assert(message != null, "null Message!");
        var chat = this.initChatPanel(channel);
        chat.addMessage(message);
        if (!chat.isActive()) {
            this.initChannelButton(channel).addNewMarker();
        }
        else {
            this.messagesScrollToBottom(false);
        }
        if (message.type == ChatMessageType.NORMAL) {
            NotificationSystem.get().notify("New Message in " + channel.name, message.sender + ":" + '"' + message.message + '"');
        }
    };
    Userinterface.prototype.removeChannel = function (channel) {
        this.removeChannelButton(channel);
        this.removeChatPanel(channel);
    };
    Userinterface.prototype.removeChannelButton = function (channel) {
        for (var i = 0; i < this.channelButtons.length; i++) {
            if (this.channelButtons[i].id == channel.id) {
                var button = this.channelButtons[i];
                $(button.element).remove();
                this.channelButtons.splice(i, 1);
                return;
            }
        }
        Debug.assert(false, "Can't remove channel button for channel:" + channel.name);
    };
    Userinterface.prototype.removeChatPanel = function (channel) {
        for (var i = 0; i < this.chatPanels.length; i++) {
            if (this.chatPanels[i].id == channel.id) {
                var chat = this.chatPanels[i];
                $(chat.element).remove();
                this.chatPanels.splice(i, 1);
                return;
            }
        }
        Debug.assert(false, "Can't remove chat panel for channel:" + channel.name);
    };
    Userinterface.prototype.setActiveChannel = function (channel) {
        Debug.log("Select Active Channel:" + channel.name);
        TooltipManager.hideAll();
        var button = this.initChannelButton(channel);
        button.setActive();
        var chat = this.initChatPanel(channel);
        chat.setActive();
        this.setTopic(channel.topic);
        this.updateChannelMembers(channel);
        this.messagesScrollToBottom(true);
        this.activeChannel = channel;
    };
    Userinterface.prototype.onChannelButtonClick = function (button) {
        Debug.assert(button != null, "Button is null!");
        this.onActiveChannelChanged.send(button.channel);
    };
    Userinterface.prototype.onCloseChannelButtonClick = function (button) {
        Debug.assert(button != null, "Button is null!");
        this.onChannelClosed.send(button.channel);
    };
    Userinterface.prototype.setLoading = function (str) {
        if (str == null) {
            $("#loading").addClass("ready");
            $("#loading-text").addClass("ready");
            $("#loading-indicator").removeClass("rotating");
        }
        else {
            $("#loading-text").html(str);
            $("#loading").removeClass("ready");
            $("#loading-text").removeClass("ready");
            $("#loading-indicator").addClass("rotating");
        }
    };
    Userinterface.prototype.fatalError = function (str) {
        var e = document.getElementById("loading");
        e.innerHTML = "<div class='error'>" + str + "</div>";
    };
    Userinterface.prototype.closePopup = function () {
        Debug.log("Closing popups");
        $('.modal').modal('hide');
    };
    Userinterface.prototype.reload = function () {
        Debug.log("Reloading page!");
        this.closePopup();
        this.setLoading("Reloading");
        this.fatalError("Server Maintenance, please wait...");
        var id = setTimeout(function () {
            window.location.reload();
        }, 5000);
    };
    Userinterface.prototype.showUserInfo = function (user) {
        Debug.log("Show user info:" + user.name);
        this.closePopup();
        $(HtmlID.USER_INFO).modal('show');
        var content = "";
        var i = 0;
        for (var item in user) {
            content += "TODO";
            i++;
        }
        $(HtmlID.USER_INFO_BODY).html(content);
        var container = document.createElement("div");
        var privaButton = document.createElement("button");
        $(HtmlID.USER_INFO_BODY).append(container);
        $(container).append(privaButton);
        container.className = "well";
        privaButton.className = "btn btn-info btn-sm";
        privaButton.innerHTML = "Private Message";
        $(privaButton).attr("user", user["name"]);
        var ui = this;
        $(privaButton).click(function () {
            ui.closePopup();
            var targetUser = $(this).attr("user");
            Debug.log("Priva: " + targetUser);
        });
    };
    Userinterface.prototype.setChannelTopic = function (channel) {
        var button = this.initChannelButton(channel);
        if (button.isActive()) {
            this.setTopic(channel.topic);
        }
    };
    Userinterface.prototype.setTopic = function (topic) {
        $(HtmlID.TOPIC).html(Utils.linkify(topic));
    };
    Userinterface.prototype.updateChannelMembers = function (channel) {
        Debug.log("Update channel members: " + channel.name);
        $(HtmlID.USERS_LIST).empty();
        for (var i = 0; i < channel.members.length; i++) {
            var member = channel.members[i];
            Debug.log("User " + member.name + " status: " + member.status);
            var user = document.createElement("button");
            user.className = "btn btn-block btn-xs user-label";
            switch (member.status) {
                case "away":
                case "afk":
                    user.className += " btn-info";
                    break;
                case "idle":
                case "paskalla":
                    user.className += " btn-warning";
                    break;
                case "busy":
                case "offline":
                    user.className += " btn-danger";
                    break;
                default:
                    user.className += " btn-success";
                    break;
            }
            if (member.isOp(channel.name)) {
                $(user).addClass("channel-op");
                user.innerHTML = '<span class="glyphicon glyphicon-education" aria-hidden="true"></span> ' + member.name;
            }
            else {
                $(user).removeClass("channel-op");
                user.innerHTML = '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> ' + member.name;
            }
            $(user).attr("user", member.name);
            var signal = this.onPrivateChatStarted;
            $(user).click(function () {
                signal.send($(this).attr("user"));
            });
            $(user).mouseenter(function () {
                TooltipManager.show(this, member.status, "right");
            });
            $(HtmlID.USERS_LIST).append(user);
        }
    };
    Userinterface.prototype.messagesScrollToBottom = function (fast) {
        var h = $(HtmlID.MESSAGES)[0].scrollHeight;
        if (fast == true) {
            $(HtmlID.MESSAGES).stop().animate({ scrollTop: h }, { duration: 10 });
            return;
        }
        if (!this.settings.useAutoScroll) {
            return;
        }
        $(HtmlID.MESSAGES).stop().animate({ scrollTop: h }, "slow");
    };
    Userinterface.prototype.setServerStatus = function (status) {
        Debug.log("Server Status: " + status);
        $(HtmlID.SERVER_STATUS).html(status);
        this.addLog("Server Status:" + status);
    };
    Userinterface.prototype.clearIdleTimer = function () {
        if (this.idleTimeout != null) {
            clearTimeout(this.idleTimeout);
        }
        this.idleTimeout = null;
    };
    Userinterface.prototype.idleTimer = function () {
        if (this.autoIdle) {
            if (this.autoIdleStartTime != null) {
                var d1 = new Date();
                var d2 = this.autoIdleStartTime;
                NotificationSystem.get().showPopover("You were idle for " + Math.floor((d1 - d2) / 1000) + " seconds.", "");
                this.autoIdleStartTime = null;
            }
            this.onStatusChange.send("back");
            this.autoIdle = false;
        }
        this.clearIdleTimer();
        var ui = this;
        this.idleTimeout = setTimeout(function () {
            ui.onStatusChange.send("idle");
            ui.clearIdleTimer();
            ui.autoIdle = true;
            ui.autoIdleStartTime = new Date();
            NotificationSystem.get().showPopover("You have been marked as idle.", "");
        }, this.autoIdleMinutes * 60 * 1000);
    };
    Userinterface.prototype.handleGlobalKeyDown = function (e) {
        this.idleTimer();
        if (e.altKey) {
            e.preventDefault();
        }
        if (e.shiftKey || e.ctrlKey)
            return;
        this.focusTextbox();
    };
    Userinterface.prototype.handleShortcutKeys = function (e) {
        if (e.keyCode == '38' && !e.shiftKey) {
            e.preventDefault();
            if ($(HtmlID.MESSAGE_INPUT).val() == "") {
                $(HtmlID.MESSAGE_INPUT).val(this.history.get(0));
            }
            else {
                $(HtmlID.MESSAGE_INPUT).val(this.history.get(-1));
            }
            return true;
        }
        else if (e.keyCode == '40' && !e.shiftKey) {
            e.preventDefault();
            $(HtmlID.MESSAGE_INPUT).val(this.history.get(+1));
            return true;
        }
        else if (e.keyCode == '37' && e.altKey) {
            e.preventDefault();
            this.swapChannel(-1);
            return true;
        }
        else if (e.keyCode == '39' && e.altKey) {
            e.preventDefault();
            this.swapChannel(+1);
            return true;
        }
        else if (e.keyCode == '9') {
            this.autoComplete();
            e.preventDefault();
            return true;
        }
        return false;
    };
    Userinterface.prototype.autoComplete = function () {
        var current = $(HtmlID.MESSAGE_INPUT).val();
        var arrayCurrent = current.split(" ");
        if (arrayCurrent.length > 0) {
            var lastEntry = arrayCurrent[arrayCurrent.length - 1];
            var resultArray = [];
            for (var i = 0; i < this.activeChannel.members.length; i++) {
                var nickName = this.activeChannel.members[i].name;
                if (lastEntry.length <= nickName.length) {
                    if (nickName.toLowerCase().indexOf(lastEntry.toLowerCase()) == 0) {
                        resultArray.push(nickName);
                        arrayCurrent[arrayCurrent.length - 1] = nickName;
                        $(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
                    }
                }
            }
            if (resultArray.length > 0) {
                if (resultArray.length == 1) {
                    arrayCurrent[arrayCurrent.length - 1] = resultArray[0];
                    $(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
                }
                else {
                    var lowerCaseResults = [];
                    for (var str in resultArray) {
                        lowerCaseResults.push(resultArray[str].toLowerCase());
                    }
                    var commonStr = this.sharedStart(lowerCaseResults);
                    arrayCurrent[arrayCurrent.length - 1] = commonStr;
                    $(HtmlID.MESSAGE_INPUT).val(arrayCurrent.join(" "));
                }
            }
        }
    };
    Userinterface.prototype.sharedStart = function (array) {
        var A = array.concat().sort(), a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
        while (i < L && a1.charAt(i) === a2.charAt(i))
            i++;
        return a1.substring(0, i);
    };
    Userinterface.prototype.swapChannel = function (dif) {
        var i = 0;
        for (; i < this.channelButtons.length; i++) {
            if (ChannelButton.activeChannelButton == this.channelButtons[i]) {
                break;
            }
        }
        i += dif;
        if (i < 0)
            i = this.channelButtons.length - 1;
        if (i >= this.channelButtons.length)
            i = 0;
        this.onChannelButtonClick(this.channelButtons[i]);
    };
    Userinterface.prototype.initKeyboard = function () {
        var ui = this;
        $(document).keydown(function (e) { ui.handleGlobalKeyDown(e); });
        $(document).mousemove(function (e) { ui.idleTimer(); });
        $(HtmlID.MESSAGE_INPUT).keydown(function (e) { ui.handleShortcutKeys(e); });
        $(HtmlID.MESSAGE_INPUT).keypress(function (e) { ui.handleMessageInputKeyPress(e); });
    };
    Userinterface.prototype.handleMessageInputKeyPress = function (e) {
        if (e.which == 13 && !e.shiftKey) {
            var msg = $(HtmlID.MESSAGE_INPUT).val();
            $(HtmlID.MESSAGE_INPUT).val('');
            e.preventDefault();
            this.onMessageSend.send(msg);
            this.history.add(msg);
        }
    };
    Userinterface.prototype.updateChannelSettings = function (channel) {
        for (var i = 0; i < this.channelButtons.length; i++) {
            if (this.channelButtons[i].id == channel.id) {
                var button = this.channelButtons[i];
                button.updateChannelSettings();
                return;
            }
        }
    };
    Userinterface.prototype.addLog = function (msg) {
        if ($(HtmlID.LOG_WINDOW).val() == "") {
            $(HtmlID.LOG_WINDOW).val(msg);
        }
        else {
            $(HtmlID.LOG_WINDOW).val($(HtmlID.LOG_WINDOW).val() + "\n" + msg);
        }
    };
    return Userinterface;
})();
var ChannelButton = (function () {
    function ChannelButton(channel) {
        this.newMessages = 0;
        this.id = channel.id;
        this.channel = channel;
        this.onCloseClick = new Signal();
        this.onNameClick = new Signal();
        this.onNotificationsToggled = new Signal();
        this.element = document.createElement("button");
        this.element.id = "CHANNEL_" + this.id;
        this.element.className = "btn channel-button";
        var closeButton = document.createElement("button");
        closeButton.className = "btn btn-warning btn-xs btn-block btn-close-channel";
        closeButton.innerHTML = '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Close Channel';
        var channelName = document.createElement("span");
        channelName.className = "name";
        channelName.innerHTML = channel.name;
        var messages = document.createElement("span");
        messages.className = "message-count badge";
        this.newMessagesLabel = messages;
        var settings = document.createElement("div");
        settings.className = "well channel-settings dropshadow-5 text-primary";
        var addButton = function (text, button) {
            var wrapper = document.createElement("div");
            wrapper.className = "";
            $(wrapper).append(button);
            $(settings).append(wrapper);
        };
        var channelTopic = document.createElement("div");
        channelTopic.className = "topic";
        channelTopic.innerHTML = Utils.linkify(channel.topic);
        $(settings).append(channelTopic);
        addButton("Close Channel", closeButton);
        var notificationsButton = document.createElement("button");
        notificationsButton.className = "btn btn-warning btn-block btn-xs";
        notificationsButton.innerHTML = '<span class="glyphicon glyphicon-flag" aria-hidden="true"></span> Notifications Disabled';
        addButton("Notifications:", notificationsButton);
        this.notificationsButton = notificationsButton;
        $(this.element).append(messages);
        $(this.element).append(channelName);
        $(this.element).append(settings);
        var self = this;
        $(closeButton).click(function (e) {
            self.element.onclick = null;
            TooltipManager.hideAll();
            self.onCloseClick.send("close");
            $(settings).stop(true, true).fadeOut();
            e.stopPropagation();
        });
        $(this.element).click(function (e) {
            self.onNameClick.send("open");
            TooltipManager.hideAll();
            e.stopPropagation();
        });
        $(this.element).mouseleave(function () {
            TooltipManager.hideAll();
            $(settings).stop(true, true).fadeOut();
        });
        $(this.notificationsButton).click(function (e) {
            self.onNotificationsToggled.send("");
            e.stopPropagation();
        });
        $(this.element).mouseenter(function () {
            //if(channel.name!="lobby")
            //{
            //$(closeButton).fadeIn();
            //}
            $(settings).css({ position: "fixed", top: "40px", left: ($(this).offset().left - 50) + "px" });
            $(settings).stop(true, true).fadeIn();
            channelTopic.innerHTML = Utils.linkify(channel.topic);
            if (self.newMessages > 0) {
                channelTopic.innerHTML += "<br/>" + self.newMessages + " new Messages.";
            }
        });
        $(settings).hide();
    }
    ChannelButton.prototype.setActive = function () {
        if (ChannelButton.activeChannelButton != null) {
            $(ChannelButton.activeChannelButton.element).removeClass("btn-info");
            $(ChannelButton.activeChannelButton.element).removeClass("btn-success");
        }
        $(this.element).addClass("btn-success");
        $(this.element).removeClass("btn-info");
        $(this.newMessagesLabel).empty();
        ChannelButton.activeChannelButton = this;
    };
    ChannelButton.prototype.addNewMarker = function () {
        this.newMessages++;
        $(this.element).addClass("btn-info");
        $(this.newMessagesLabel).html(this.newMessages.toString());
    };
    ChannelButton.prototype.isActive = function () {
        return ChannelButton.activeChannelButton == this;
    };
    ChannelButton.prototype.updateChannelSettings = function () {
        if (this.channel.allowNotifications) {
            this.notificationsButton.innerHTML = '<span class="glyphicon glyphicon-flag" aria-hidden="true"></span> Notifications Enabled';
            $(this.notificationsButton).addClass("btn-success");
            $(this.notificationsButton).removeClass("btn-warning");
        }
        else {
            this.notificationsButton.innerHTML = '<span class="glyphicon glyphicon-flag" aria-hidden="true"></span> Notifications Disabled';
            $(this.notificationsButton).addClass("btn-warning");
            $(this.notificationsButton).removeClass("btn-success");
        }
    };
    return ChannelButton;
})();
var Chat = (function () {
    function Chat() {
        Debug.log(Project.name + " " + Project.version + " CodeName:" + Project.codeName);
        var chat = this;
        Debug.setErrorHandler(function (msg) {
            console.log(msg);
            chat.ui.addLog("Error: " + msg);
        });
        this.data = new ChatData();
        this.client = new Client();
        this.ui = new Userinterface();
        this.ui.addLog(Project.name + " " + Project.version + " CodeName:" + Project.codeName);
        this.bindDataCallbacks();
    }
    Chat.prototype.init = function () {
        Debug.log("init");
        this.client.connect("http://urtela.redlynx.com:3002", this.data.localMember.userID);
        this.ui.setLoading(null);
    };
    Chat.prototype.bindDataCallbacks = function () {
        var self = this;
        this.data.onActiveChannelChanged.add(function (channel) {
            self.ui.setActiveChannel(channel);
        });
        this.data.onChannelAdded.add(function (channel) {
            self.ui.initChannelButton(channel);
        });
        this.data.onChannelRemoved.add(function (channel) {
            self.ui.removeChannel(channel);
        });
        this.data.onActiveChannelMembersChanged.add(function (channel) {
            self.ui.updateChannelMembers(channel);
        });
        this.data.onChannelMessageAdded.add(function (channel, message) {
            self.ui.addMessage(channel, message[0]);
        });
        this.data.onChannelTopicChanged.add(function (channel) {
            self.ui.setChannelTopic(channel);
        });
        this.data.onChannelSettingsChanged.add(function (channel) {
            self.ui.updateChannelSettings(channel);
        });
        this.data.onMemberStatusChanged.add(function (member) {
            Debug.log(member.name + " Status Changed to: " + member.status);
        });
        this.data.onChannelLost.add(function (channelName) {
            self.client.joinChannel(channelName);
        });
        this.ui.onActiveChannelChanged.add(function (channel) {
            self.data.setActiveChannelByChannel(channel);
        });
        this.ui.onChannelClosed.add(function (channel) {
            if (self.data.removeChannelByName(channel.name)) {
                self.client.exitChannel(channel);
            }
        });
        this.ui.settings.onFileDrop.add(function (file) {
            self.client.uploadFile(file, self.data.getActiveChannel());
        });
        this.ui.onMessageSend.add(function (msg) {
            self.client.sendMessage(msg, self.data.getActiveChannel());
        });
        this.ui.onStatusChange.add(function (status) {
            self.client.setStatus(status);
        });
        this.ui.onPrivateChatStarted.add(function (username) {
            var channel = new ChatChannel("@" + username, "Private chat with " + username);
            self.data.addChannel(channel);
            self.data.setActiveChannelByChannel(channel);
        });
        this.ui.onChannelNotificationToggled.add(function (channel) {
            self.data.toggleChannelSetting(channel, "notification");
        });
        this.client.onUserStatusUpdated.add(function (userName, data) {
            self.data.setUserStatus(userName, data[0]);
        });
        this.client.onChatMessage.add(function (message, data) {
            self.data.addMessage(message, data[0]);
        });
        this.client.onJoinedChannel.add(function (channelName) {
            Debug.log("Joined channel: " + channelName);
            var channel = new ChatChannel(channelName, "Welcome to " + channelName);
            self.data.addChannel(channel);
            self.data.setActiveChannelByChannel(channel);
        });
        this.client.onUserListUpdated.add(function (channelName, data) {
            self.data.updateUsers(channelName, data[0]);
        });
        this.client.onUserParted.add(function (channelName, data) {
            self.data.removeMemberByName(data[0], channelName);
            self.data.addMessage(new ChatMessage("", "SYSTEM", "<div class='user-left'>" + data[0] + " left the channel</div>", ChatMessageType.SYSTEM), channelName);
        });
        this.client.onUserJoined.add(function (channelName, data) {
            self.data.addMember(new ChatMember(data[0], "null", "online"), channelName);
            self.data.addMessage(new ChatMessage("", "SYSTEM", "<div class='user-join'>" + data[0] + " joined the channel</div>", ChatMessageType.SYSTEM), channelName);
        });
        this.client.onUserDisconnected.add(function (channelName, data) {
            self.data.addMember(new ChatMember(data[0], "null", "online"), channelName);
            self.data.addMessage(new ChatMessage("", "SYSTEM", "<div class='user-disconnected'>" + data[0] + " disconnected</div>", ChatMessageType.SYSTEM), channelName);
        });
        this.client.onUserNameChanged.add(function (oldName, data) {
            self.data.changeMemberName(oldName, data[0]);
        });
        this.client.onTopicChanged.add(function (channelName, data) {
            self.data.setTopic(data[0], channelName);
            self.data.addMessage(new ChatMessage("", "SYSTEM", "Channel topic is " + data[0], ChatMessageType.SYSTEM), channelName);
        });
        this.client.onDisconnected.add(function () {
            NotificationSystem.get().showPopover("Oh noes!", "You are disconnected!");
        });
        this.client.onConnected.add(function () {
            self.data.restoreActiveChannel();
        });
        this.client.onLogMessage.add(function (msg) {
            self.ui.addLog(msg);
        });
        this.client.onServerStatusChanged.add(function (status) {
            self.ui.setServerStatus(status);
        });
        this.client.onServerCommand.add(function (command) {
            self.ui.reload();
        });
        this.client.onReceiveLocalUsername.add(function (name) {
            NotificationSystem.get().showPopover("Welcome to urtela chat", name);
        });
        this.client.onReceiveUserData.add(function (data) {
            Debug.log("User " + data.user + " in " + data.channel + " is op:" + data.is_op);
            self.data.setUserData(data.user, data);
        });
        this.client.onReceiveChannelData.add(function (data) {
            Debug.log("Got Channel data:\n" + data);
        });
    };
    Chat.create = function () {
        var chat = new Chat();
        try {
            document.body.onload = function () {
                chat.init();
            };
        }
        catch (e) {
            document.body.onload = function () {
                chat.ui.fatalError("Error while loading chat.<br/>please try again later.");
            };
        }
    };
    return Chat;
})();
var ChatChannel = (function () {
    function ChatChannel(name, topic) {
        this.id = ChatChannel.nextID++;
        this.name = name;
        this.topic = topic;
        this.messages = new Array();
        this.members = new Array();
        this.allowNotifications = false;
        this.isPrivate = name[0] === "@";
    }
    ChatChannel.prototype.addMember = function (member) {
        this.members.push(member);
        Debug.log("Added member: " + member.name + " to " + this.name);
    };
    ChatChannel.prototype.removeMemberByName = function (member) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].name == member) {
                Debug.log("Removing member: " + member);
                this.members.splice(i, 1);
                return;
            }
        }
        Debug.log("Can't remove member: " + member);
    };
    ChatChannel.prototype.removeMember = function (member) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i] == member) {
                Debug.log("Removing member: " + member.name);
                this.members.splice(i, 1);
                return;
            }
        }
        Debug.log("Can't remove member: " + member.name);
    };
    ChatChannel.prototype.addMessage = function (message) {
        this.messages.push(message);
    };
    ChatChannel.prototype.setupUser = function (username) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].name == username) {
                return;
            }
        }
        this.addMember(new ChatMember(username, "null", "online"));
    };
    ChatChannel.nextID = 0;
    return ChatChannel;
})();
var CookieNames = (function () {
    function CookieNames() {
    }
    CookieNames.USER_ID = "userID";
    CookieNames.USER_NAME = "userName";
    CookieNames.ACTIVE_CHANNEL = "activeChannel";
    return CookieNames;
})();
var ChatData = (function () {
    function ChatData() {
        var id = this.getCookie(CookieNames.USER_ID);
        var name = this.getCookie(CookieNames.USER_NAME);
        Debug.log("Got: " + id);
        if (id == null || id == "") {
            id = Math.floor((Math.random() * 1000000000) + 1).toString();
            this.setCookie(CookieNames.USER_ID, id, 365);
            name = "guest";
        }
        this.firstChannelSet = false;
        this.onChannelAdded = new Signal();
        this.onChannelRemoved = new Signal();
        this.onActiveChannelChanged = new Signal();
        this.onActiveChannelMembersChanged = new Signal();
        this.onActiveChannelMessageAdded = new Signal();
        this.onActiveChannelDataAdded = new Signal();
        this.onChannelTopicChanged = new Signal();
        this.onChannelSettingsChanged = new Signal();
        this.onChannelMessageAdded = new Signal();
        this.onMemberStatusChanged = new Signal();
        this.onChannelLost = new Signal();
        this.localMember = new ChatMember(name, id, "Disconnected");
        this.serverStatus = "Connecting...";
        this.channels = new Array();
        this.activeChannel = 0;
    }
    ChatData.prototype.getActiveChannel = function () {
        return this.getChannel(this.activeChannel);
    };
    ChatData.prototype.getChannel = function (id) {
        Debug.assert(this.channels[id] != null, "Channel " + id + " is null!");
        return this.channels[id];
    };
    ChatData.prototype.initChannel = function (name) {
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i].name === name) {
                return this.channels[i];
            }
        }
        var channel = new ChatChannel(name, "Welcome to " + name);
        if (name[0] == "@") {
            channel.topic = "Private chat with " + name.substring(1);
        }
        this.addChannel(channel);
        return channel;
    };
    ChatData.prototype.addChannel = function (channel) {
        this.checkChannelSettings(channel);
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i].name === channel.name) {
                Debug.warning("Adding already Existing channel!");
                return;
            }
        }
        this.channels.push(channel);
        this.onChannelAdded.send(channel);
        if (!this.firstChannelSet) {
            this.firstChannelSet = true;
            this.setActiveChannel(this.channels.length - 1);
        }
    };
    ChatData.prototype.removeChannelByName = function (channelName) {
        if (this.channels.length <= 1) {
            Debug.warning("Can't remove last channel");
            return false;
        }
        for (var i = 0; this.channels.length; i++) {
            if (this.channels[i].name === channelName) {
                this.onChannelRemoved.send(this.channels[i]);
                this.channels.splice(i, 1);
                this.setActiveChannel(Math.max(0, i - 1));
                return true;
            }
        }
        Debug.warning("Can't remove channel: " + channelName);
        return true;
    };
    ChatData.prototype.setActiveChannel = function (id) {
        this.activeChannel = id;
        var channel = this.getActiveChannel();
        Debug.log("Set Active channel: " + channel.name);
        this.onActiveChannelChanged.send(this.getActiveChannel());
        this.setCookie(CookieNames.ACTIVE_CHANNEL, channel.name, 365);
    };
    ChatData.prototype.setActiveChannelByName = function (name) {
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i].name == name) {
                this.setActiveChannel(i);
                return;
            }
        }
        Debug.warning("Can't setActiveChannelByName! " + name);
        this.setActiveChannel(0);
    };
    ChatData.prototype.setActiveChannelByChannel = function (channel) {
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i] == channel) {
                this.setActiveChannel(i);
                return;
            }
        }
        Debug.warning("Can't setActiveChannelByChannel! " + channel.name);
        this.setActiveChannel(0);
    };
    ChatData.prototype.addMessage = function (message, channelName) {
        var channel = this.initChannel(channelName);
        channel.addMessage(message);
        if (channel == this.getActiveChannel()) {
            this.onActiveChannelMessageAdded.send(message);
        }
        this.onChannelMessageAdded.send(channel, message);
    };
    ChatData.prototype.addMember = function (member, channelName) {
        var channel = this.getChannelByName(channelName);
        channel.addMember(member);
        if (channel == this.getActiveChannel()) {
            this.onActiveChannelMembersChanged.send(channel);
        }
    };
    ChatData.prototype.removeMember = function (member, channelName) {
        var channel = this.getChannelByName(channelName);
        channel.removeMember(member);
        if (channel == this.getActiveChannel()) {
            this.onActiveChannelMembersChanged.send(channel);
        }
    };
    ChatData.prototype.removeMemberByName = function (member, channelName) {
        var channel = this.getChannelByName(channelName);
        channel.removeMemberByName(member);
        if (channel == this.getActiveChannel()) {
            this.onActiveChannelMembersChanged.send(channel);
        }
    };
    ChatData.prototype.getChannelByName = function (name) {
        for (var i = 0; this.channels.length; i++) {
            if (this.channels[i].name === name) {
                return this.channels[i];
            }
        }
        var channel = new ChatChannel(name, "Welcome to " + name);
        this.addChannel(channel);
        return channel;
    };
    ChatData.prototype.setTopic = function (topic, channelName) {
        var channel = this.getChannelByName(channelName);
        channel.topic = topic;
        this.onChannelTopicChanged.send(channel);
    };
    ChatData.prototype.restoreActiveChannel = function () {
        var stored = this.getCookie(CookieNames.ACTIVE_CHANNEL);
        Debug.log("restoreActiveChannel:" + stored);
        if (stored == null || stored == "" || stored == "null") {
            this.activeChannel = 0;
            return;
        }
        for (var i = 0; this.channels.length; i++) {
            if (this.channels[i].name === stored) {
                this.setActiveChannelByName(stored);
                return;
            }
        }
        Debug.log("Can't restore active channel, try to join.");
        this.onChannelLost.send(stored);
    };
    ChatData.prototype.setCookie = function (cname, cvalue, exdays) {
        Debug.log("Set cookie:" + cname + ": " + cvalue);
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };
    ChatData.prototype.getCookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1);
            if (c.indexOf(name) == 0)
                return c.substring(name.length, c.length);
        }
        return null;
    };
    ChatData.prototype.setUserData = function (userName, data) {
        //channel: "roi"
        //is_op: false
        //user: "fazias"
        var channel = this.getChannelByName(data.channel);
        for (var j = 0; j < channel.members.length; j++) {
            var member = channel.members[j];
            if (member.name == userName) {
                member.setOpStatus(data.channel, data.is_op);
                this.onMemberStatusChanged.send(member);
                if (channel == this.getActiveChannel()) {
                    this.onActiveChannelMembersChanged.send(channel);
                }
                return;
            }
        }
    };
    ChatData.prototype.setUserStatus = function (userName, status) {
        for (var i = 0; i < this.channels.length; i++) {
            var channel = this.channels[i];
            for (var j = 0; j < channel.members.length; j++) {
                if (channel.members[j].name == userName) {
                    channel.members[j].status = status;
                    this.onMemberStatusChanged.send(channel.members[j]);
                }
            }
            if (this.activeChannel == i) {
                this.onActiveChannelMembersChanged.send(channel);
            }
        }
    };
    ChatData.prototype.updateUsers = function (channelName, users) {
        var channel = this.getChannelByName(channelName);
        for (var i = 0; i < users.length; i++) {
            channel.setupUser(users[i]);
        }
        this.onActiveChannelMembersChanged.send(channel);
    };
    ChatData.prototype.changeMemberName = function (oldName, newName) {
        for (var i = 0; i < this.channels.length; i++) {
            var channel = this.channels[i];
            for (var j = 0; j < channel.members.length; j++) {
                if (channel.members[j].name == oldName) {
                    channel.members[j].name = newName;
                    this.addMessage(new ChatMessage("", oldName, "Changed name to " + newName, ChatMessageType.SYSTEM), channel.name);
                }
            }
        }
        var channel = this.getActiveChannel();
        this.onActiveChannelMembersChanged.send(channel);
    };
    ChatData.prototype.checkChannelSettings = function (channel) {
        var cookie = this.getChannelSetting(channel, "notification");
        channel.allowNotifications = cookie === "true";
        this.onChannelSettingsChanged.send(channel);
    };
    ChatData.prototype.setChannelSetting = function (channel, setting, value) {
        this.setCookie(channel.name + "_" + setting, value, 365);
        this.checkChannelSettings(channel);
    };
    ChatData.prototype.getChannelSetting = function (channel, setting) {
        var cookie = this.getCookie(channel.name + "_" + setting);
        return cookie;
    };
    ChatData.prototype.toggleChannelSetting = function (channel, setting) {
        var value = this.getChannelSetting(channel, setting);
        Debug.log("Toggle " + channel.name + " " + setting + " from:" + value);
        if (value === "true") {
            this.setChannelSetting(channel, setting, "false");
        }
        else {
            this.setChannelSetting(channel, setting, "true");
        }
        this.onChannelSettingsChanged.send(channel);
    };
    return ChatData;
})();
var ChatMember = (function () {
    function ChatMember(name, id, status) {
        this.name = name;
        this.userID = id;
        this.status = status;
        this.opChannels = {};
    }
    ChatMember.prototype.setOpStatus = function (channel, op) {
        this.opChannels[channel] = op;
    };
    ChatMember.prototype.isOp = function (channel) {
        return this.opChannels[channel] == true;
    };
    return ChatMember;
})();
var ChatMessageType;
(function (ChatMessageType) {
    ChatMessageType[ChatMessageType["NORMAL"] = 0] = "NORMAL";
    ChatMessageType[ChatMessageType["SYSTEM"] = 1] = "SYSTEM";
    ChatMessageType[ChatMessageType["DATA"] = 2] = "DATA";
})(ChatMessageType || (ChatMessageType = {}));
var ChatMessage = (function () {
    function ChatMessage(time, sender, message, type) {
        this.time = time;
        this.sender = sender;
        this.message = message;
        this.type = type;
    }
    return ChatMessage;
})();
var ChatMessagePanel = (function () {
    function ChatMessagePanel(message, alt) {
        this.message = message;
        this.element = document.createElement("div");
        this.element.className = "message-block";
        this.body = document.createElement("div");
        this.body.className = "message-body row";
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
        this.who.className = "label col-md-1 user-label";
        this.what.className = "chat-message col-md-10";
        this.when.className = "time col-md-1 text-right";
        switch (message.type) {
            case ChatMessageType.SYSTEM:
                $(this.who).addClass("label-info");
                $(this.who).removeClass("user-label");
                $(this.body).addClass("side-bg");
                break;
            case ChatMessageType.NORMAL:
            default:
                $(this.who).addClass("label-success");
                if (alt) {
                    $(this.body).addClass("alt-bg");
                }
                else {
                    $(this.body).addClass("main-bg");
                }
                break;
        }
        $(this.element).hide();
        $(this.element).fadeIn();
    }
    ChatMessagePanel.prototype.addMessage = function (message) {
        var newMessage = document.createElement("span");
        newMessage.innerHTML = "<br/>" + Utils.linkify(message.message);
        this.what.appendChild(newMessage);
        this.when.innerHTML += "<br/>" + message.time;
        $(newMessage).hide();
        $(newMessage).fadeIn();
    };
    return ChatMessagePanel;
})();
var ChatPanel = (function () {
    function ChatPanel(channel) {
        this.lastMessage = null;
        this.useAlternative = false;
        this.channel = channel;
        this.id = channel.id;
        this.element = document.createElement("div");
        this.element.id = "CHAT_" + this.id;
        if (!this.channel.isPrivate) {
            this.setActive();
        }
    }
    ChatPanel.prototype.addMessage = function (message) {
        if (this.lastMessage != null && this.lastMessage.message.sender == message.sender) {
            this.lastMessage.addMessage(message);
        }
        else {
            var messagePanel = new ChatMessagePanel(message, this.useAlternative);
            this.element.appendChild(messagePanel.element);
            this.lastMessage = messagePanel;
            this.useAlternative = !this.useAlternative;
        }
    };
    ChatPanel.prototype.setActive = function () {
        Debug.log("Set active chat panel:" + this.channel.name);
        if (ChatPanel.activeChatPanel != null) {
            this.hide();
        }
        ChatPanel.activeChatPanel = this;
        this.show();
    };
    ChatPanel.prototype.hide = function () {
        Debug.log("Hide active chat panel:" + this.channel.name);
        $(ChatPanel.activeChatPanel.element).stop();
        $(ChatPanel.activeChatPanel.element).hide();
    };
    ChatPanel.prototype.show = function () {
        Debug.log("Show active chat panel:" + this.channel.name);
        $(ChatPanel.activeChatPanel.element).stop();
        $(ChatPanel.activeChatPanel.element).fadeIn();
    };
    ChatPanel.prototype.isActive = function () {
        return ChatPanel.activeChatPanel == this;
    };
    return ChatPanel;
})();
/// <reference path="..\ref\socket.io-client\socket.io-client.d.ts" />
var Client = (function () {
    function Client() {
        this.isConnected = false;
        this.onServerStatusChanged = new Signal();
        this.onUserStatusUpdated = new Signal();
        this.onChatMessage = new Signal();
        this.onJoinedChannel = new Signal();
        this.onUserListUpdated = new Signal();
        this.onUserParted = new Signal();
        this.onUserJoined = new Signal();
        this.onUserDisconnected = new Signal();
        this.onUserNameChanged = new Signal();
        this.onTopicChanged = new Signal();
        this.onDisconnected = new Signal();
        this.onConnected = new Signal();
        this.onLogMessage = new Signal();
        this.onServerCommand = new Signal();
        this.onReceiveLocalUsername = new Signal();
        this.onReceiveUserData = new Signal();
        this.onReceiveChannelData = new Signal();
    }
    Client.prototype.changeServerStatus = function (status) {
        this.onServerStatusChanged.send(status);
        Debug.log("Server: " + status);
    };
    Client.prototype.connect = function (url, user) {
        if (this.isConnected && this.url == url) {
            Debug.log("Already connected to " + url);
            return;
        }
        this.url = url;
        this.changeServerStatus("Connecting to: " + url);
        this.socket = io.connect(url, { autoConnect: true });
        this.bindSocket();
        this.changeServerStatus("Connected");
        this.changeServerStatus("Logging in as " + user);
        this.sendData('login', user);
        this.isConnected = true;
    };
    Client.prototype.log = function (msg) {
        Debug.log(msg);
        this.onLogMessage.send(msg);
    };
    Client.prototype.bindSocket = function () {
        this.log("Binding socket...");
        var client = this;
        this.socket.on('server command', function (msg) { client.serverCommand(msg); });
        this.socket.on('your_channel', function (msg) { client.joinChannel(msg); });
        this.socket.on("status", function (data) { client.userStatusUpdated(data); });
        this.socket.on("chat message", function (data) { client.receiveChatMessage(data); });
        this.socket.on("system message", function (data) { client.receiveSystemMessage(data); });
        this.socket.on('data message', function (msg) { client.receiveDataMessage(msg); });
        this.socket.on('join_channel', function (channelName) { client.joinedChannel(channelName); });
        this.socket.on('user_list', function (data) { client.userListUpdated(data); });
        this.socket.on('user_disconnected', function (data) { client.userDisconnected(data); });
        this.socket.on('user_part', function (data) { client.userParted(data); });
        this.socket.on('user_join', function (data) { client.userJoined(data); });
        this.socket.on('nick_change', function (data) { client.userNameChanged(data); });
        this.socket.on('topic', function (data) { client.topicChanged(data); });
        this.socket.on('disconnect', function (data) { client.disconnected(data); });
        this.socket.on('login_complete', function (data) { client.connected(data); });
        this.socket.on('your_nick', function (data) { client.receiveLocalUser(data); });
        this.socket.on('op', function (data) { client.receiveUserData(data); });
        this.socket.on('channelmod', function (data) { client.receiveChannelData(data); });
    };
    Client.prototype.receiveChannelData = function (data) {
        this.onReceiveChannelData.send(data);
    };
    Client.prototype.receiveUserData = function (data) {
        this.onReceiveUserData.send(data);
    };
    Client.prototype.receiveLocalUser = function (localUserName) {
        this.onReceiveLocalUsername.send(localUserName);
    };
    Client.prototype.serverCommand = function (data) {
        this.onServerCommand.send(data);
    };
    Client.prototype.receiveChatMessage = function (data) {
        var splitMsg = data.split("|");
        var time = splitMsg.shift();
        var channel = splitMsg.shift();
        var sender = splitMsg.shift();
        var textLine = splitMsg.join("|");
        this.onChatMessage.send(new ChatMessage(time, sender, textLine, ChatMessageType.NORMAL), channel);
    };
    Client.prototype.receiveSystemMessage = function (data) {
        var splitMsg = data.split("|");
        var channel = splitMsg.shift();
        var time = splitMsg.shift();
        var textLine = splitMsg.join("|");
        this.onChatMessage.send(new ChatMessage(time, "SYSTEM", textLine, ChatMessageType.SYSTEM), channel);
        this.log(time + ": " + textLine);
    };
    Client.prototype.receiveDataMessage = function (data) {
        var splitMsg = data.split("|");
        var channel = splitMsg.shift();
        var time = splitMsg.shift();
        var textLine = splitMsg.join("|");
        this.onChatMessage.send(new ChatMessage(time, "SYSTEM", textLine, ChatMessageType.DATA), channel);
        this.log(time + ":" + textLine);
    };
    Client.prototype.joinedChannel = function (channelName) {
        this.onJoinedChannel.send(channelName);
        this.log("Joined channel:" + channelName);
    };
    Client.prototype.userStatusUpdated = function (msg) {
        var data = msg.split("|");
        var time = data[0];
        var channel = data[1];
        var sender = data[2];
        var status = data[3];
        this.onUserStatusUpdated.send(sender, status, channel);
    };
    Client.prototype.uploadFile = function (file, channel) {
        this.log("Attempt uploading File Type:" + file.type);
        if (file.type.search("image") != -1) {
            this.sendData('upload img', channel.name + '|' + file.name);
        }
        else {
            this.sendData('upload file', channel.name + '|' + file.name);
        }
    };
    Client.prototype.exitChannel = function (channel) {
        this.log("Exit channel:" + channel.name);
        this.sendData('part_channel', channel.name);
    };
    Client.prototype.joinChannel = function (channelName) {
        this.log("Joining channel:" + channelName);
        this.sendData('chat message', "|/join " + channelName);
    };
    Client.prototype.sendPrivateChat = function (target, msg) {
        msg = "@" + target.name + "|" + msg;
        this.sendData("chat message", msg);
    };
    Client.prototype.sendData = function (key, data) {
        Debug.debugLog("Socket emit: " + key + " = " + data);
        if (this.socket == null || data == "" || key == "") {
            return;
        }
        Debug.log("SEND: " + key + ": " + data);
        this.socket.emit(key, data);
    };
    Client.prototype.setStatus = function (status) {
        this.sendData("status", status);
    };
    Client.prototype.sendMessage = function (msg, channel) {
        var split = msg.split(" ");
        if (split[0] == "/part") {
            this.exitChannel(channel);
            return;
        }
        if (split[0] == "/join") {
            this.joinChannel(split[1]);
            return;
        }
        if (split[0] == "/status") {
            split.shift();
            this.setStatus(split.join(" "));
            return;
        }
        if (split[0] == "/marker") {
            return;
        }
        if (split[0] == "/imdb") {
            var sMovie = "";
            var splitMsg = msg.split(" ");
            for (var k = 1; k < splitMsg.length; ++k) {
                if (k > 1)
                    sMovie += " ";
                sMovie += splitMsg[k];
            }
            var sUrl = 'http://www.omdbapi.com/?t=' + sMovie + '&plot=short&type=movie&tomatoes=true';
            var client = this;
            $.ajax(sUrl, {
                complete: function (p_oXHR, p_sStatus) {
                    var oData = $.parseJSON(p_oXHR.responseText);
                    if ("imdbID" in oData) {
                        var movieDataString = "<div class=\"well imdbwrap\"><div class=\"imdbtext\">";
                        movieDataString += "<strong>" + oData.Title + "</strong> (" + oData.Year + ") (" + oData["Genre"] + ")  <br/>tomato meter: " + oData.tomatoMeter + "/100 (" + oData.tomatoImage + ")<br/>";
                        movieDataString += "imdb score: " + oData["imdbRating"] + "<br/>";
                        movieDataString += "<br/>What is it about:<br/>" + oData.Plot + "<br/>";
                        movieDataString += "<br/>Tomato concensus:<br/>" + oData.tomatoConsensus + "<br/>";
                        movieDataString += "</div><div class=\"imdbimg\">";
                        movieDataString += "<a href=\"http://www.imdb.com/title/" + oData["imdbID"] + "/\" target=\"_blank\"><img style=\"width:10em; height:15em;\" src=\"" + oData.Poster + "\"/></a>";
                        movieDataString += "</div></div>";
                        client.sendData('imdb', channel.name + "|" + movieDataString);
                    }
                    else {
                        Debug.log("movie '" + sMovie + "' not found :(");
                    }
                }
            });
            return;
        }
        this.sendData("chat message", channel.name + "|" + msg);
    };
    Client.prototype.userListUpdated = function (data) {
        var parts = data.split("|");
        var time = parts.shift();
        var channel = parts.shift();
        this.onUserListUpdated.send(channel, parts);
    };
    Client.prototype.userJoined = function (data) {
        var parts = data.split("|");
        var time = parts[0];
        var channel = parts[1];
        var user = parts[2];
        this.onUserJoined.send(channel, user);
    };
    Client.prototype.userParted = function (data) {
        var parts = data.split("|");
        var time = parts[0];
        var channel = parts[1];
        var user = parts[2];
        this.onUserParted.send(channel, user);
    };
    Client.prototype.userDisconnected = function (data) {
        var parts = data.split("|");
        var time = parts[0];
        var channel = parts[1];
        var user = parts[2];
        this.onUserDisconnected.send(channel, user);
    };
    Client.prototype.userNameChanged = function (data) {
        var parts = data.split("|");
        var time = parts[0];
        var channel = parts[1];
        var nickOld = parts[2];
        var nickNew = parts[3];
        this.onUserNameChanged.send(nickOld, nickNew);
    };
    Client.prototype.topicChanged = function (data) {
        var split = data.split('|');
        if (split.length >= 3) {
            var who = split[0];
            var channel = split[1];
            var what = split[2];
            this.onTopicChanged.send(channel, what);
        }
        this.log(channel + " topic changed");
    };
    Client.prototype.disconnected = function (data) {
        this.onDisconnected.send("null");
        this.changeServerStatus("Disconnected");
    };
    Client.prototype.connected = function (data) {
        this.onConnected.send(data);
        this.changeServerStatus("Connected");
    };
    return Client;
})();
var CustomTheme = (function () {
    function CustomTheme(file) {
        CustomTheme.unload();
        CustomTheme.activeTheme = this;
        this.element = document.createElement("link");
        this.element.setAttribute("rel", "stylesheet");
        this.element.setAttribute("type", "text/css");
        this.element.setAttribute("href", file);
        if (typeof this.element != "undefined") {
            document.getElementsByTagName("head")[0].appendChild(this.element);
        }
    }
    CustomTheme.prototype.remove = function () {
        $(this.element).remove();
        this.element = null;
    };
    CustomTheme.unload = function () {
        if (CustomTheme.activeTheme != null) {
            CustomTheme.activeTheme.remove();
            CustomTheme.activeTheme = null;
        }
    };
    CustomTheme.activeTheme = null;
    return CustomTheme;
})();
var DebugLevel;
(function (DebugLevel) {
    DebugLevel[DebugLevel["DEBUG_OFF"] = 0] = "DEBUG_OFF";
    DebugLevel[DebugLevel["DEBUG_NORMAL"] = 1] = "DEBUG_NORMAL";
    DebugLevel[DebugLevel["DEBUG_FULL"] = 2] = "DEBUG_FULL";
})(DebugLevel || (DebugLevel = {}));
var Debug = (function () {
    function Debug() {
    }
    Debug.log = function (str) {
        if (Debug.debugLevel == DebugLevel.DEBUG_OFF)
            return;
        console.log(str);
    };
    Debug.warning = function (str) {
        if (Debug.debugLevel == DebugLevel.DEBUG_OFF)
            return;
        console.log("\n############################ WARNING ############################");
        console.log(str);
    };
    Debug.assert = function (expr, msg) {
        if (!expr) {
            if (Debug.debugLevel == DebugLevel.DEBUG_OFF) {
                if (Debug.onError) {
                    Debug.onError.send(msg);
                }
                return;
            }
            alert("ASSERT!\n\n" + msg);
        }
    };
    Debug.debugLog = function (msg) {
        if (Debug.debugLevel != DebugLevel.DEBUG_FULL)
            return;
        Debug.log("\t" + msg);
    };
    Debug.setErrorHandler = function (callback) {
        if (Debug.onError == null) {
            Debug.onError = new Signal();
        }
        Debug.onError.add(callback);
    };
    Debug.debugLevel = DebugLevel.DEBUG_OFF;
    return Debug;
})();
var HtmlID = (function () {
    function HtmlID() {
    }
    HtmlID.CHANNELS = "#channels";
    HtmlID.MESSAGES = "#messages";
    HtmlID.TOPIC = "#chat-topic";
    HtmlID.USER_INFO = "#userInfo";
    HtmlID.USER_INFO_BODY = "#userInfoBody";
    HtmlID.USERS_LIST = "#users";
    HtmlID.MESSAGE_INPUT = "#message-input";
    HtmlID.AUTO_SCROLL_TOGGLE_BUTTON = "#auto-scroll-toggle";
    HtmlID.AUTO_SCROLL_ICON_ON = "#auto-scroll-icon-on";
    HtmlID.AUTO_SCROLL_ICON_OFF = "#auto-scroll-icon-off";
    HtmlID.SERVER_STATUS = "#server-status";
    HtmlID.LOG_WINDOW = "#log";
    return HtmlID;
})();
var MessageInputHistory = (function () {
    function MessageInputHistory() {
        this.history = new Array();
        this.index = 0;
        this.limit = 20;
        this.notification = null;
    }
    MessageInputHistory.prototype.get = function (dif) {
        this.add($(HtmlID.MESSAGE_INPUT).val());
        this.index += dif;
        if (this.index < 0)
            this.index = this.history.length - 1;
        if (this.index >= this.history.length)
            this.index = 0;
        if (this.index < 0 || this.history.length == 0)
            return $(HtmlID.MESSAGE_INPUT).val();
        if (this.notification != null) {
            this.notification.clearTimeout();
        }
        this.notification = new PopoverNotification(HtmlID.MESSAGE_INPUT, "Sent Message History " + (this.index + 1) + "/" + (this.history.length + 1));
        this.notification.getOptions().placement = "top";
        this.notification.show();
        return this.history[this.index];
    };
    MessageInputHistory.prototype.add = function (msg) {
        if (msg != null && msg != "") {
            for (var i = 0; i < this.history.length; i++) {
                if (this.history[i] == msg)
                    return false;
            }
            this.history.push(msg);
            while (this.history.length > this.limit) {
                this.history.shift();
            }
            this.index = this.history.length - 1;
            return true;
        }
    };
    return MessageInputHistory;
})();
var NotificationSystem = (function () {
    function NotificationSystem() {
        this.enabled = false;
        this.text = "";
        this.count = 0;
        this.active = false;
        this.timeoutID = null;
        this.notification = null;
        this.popover = null;
        if (!("Notification" in window)) {
            Debug.log("Browser does not support notifications...");
            this.showPopover("Browser does not support notifications...", "");
            this.enabled = false;
        }
        else {
            if (Notification.permission === "granted") {
                this.enabled = true;
            }
            else {
                if (Notification.permission !== 'denied') {
                    var self = this;
                    Notification.requestPermission(function (permission) {
                        if (permission === "granted") {
                            self.enabled = true;
                        }
                    });
                }
            }
        }
        $(window).focus(function () {
            setTimeout(function () {
                NotificationSystem.get().hide();
            }, 5000);
        });
    }
    NotificationSystem.prototype.notify = function (title, msg) {
        if (document.hasFocus()) {
            this.count = 0;
        }
        else {
            this.count++;
        }
        Debug.log("notify: " + this.count);
        this.title = title;
        this.text = msg;
        this.clearTimeout();
        this.timeoutID = setTimeout(function () {
            NotificationSystem.get().show();
        }, 1000);
    };
    NotificationSystem.prototype.hide = function () {
        this.active = false;
        this.count = 0;
        if (this.notification != null) {
            this.notification.close();
            this.notification = null;
        }
        if (this.popover != null) {
            this.popover.hide();
            this.popover = null;
        }
        this.clearTimeout();
    };
    NotificationSystem.prototype.showPopover = function (title, text) {
        if (this.popover != null) {
            this.popover.clearTimeout();
        }
        this.popover = new PopoverNotification("#logo", title + "<br/>" + text);
        this.popover.show();
    };
    NotificationSystem.prototype.show = function () {
        if (document.hasFocus()) {
            return;
        }
        Debug.log("Show notifications: " + this.count);
        if (this.count > 1) {
            this.text = this.count.toString() + " new messages!";
            this.title = "";
        }
        this.hide();
        this.active = true;
        this.notification = new Notification(Utils.unwindHtml(this.title), { "body": Utils.unwindHtml(this.text), "icon": "http://urtela.redlynx.com/img/chaticon.jpg" });
        setTimeout(function () {
            NotificationSystem.get().hide();
        }, 5000);
        window.focus();
    };
    NotificationSystem.prototype.clearTimeout = function () {
        if (this.timeoutID == null)
            return;
        clearTimeout(this.timeoutID);
        this.timeoutID = null;
    };
    NotificationSystem.get = function () {
        if (NotificationSystem.singleton == null) {
            NotificationSystem.singleton = new NotificationSystem();
        }
        return NotificationSystem.singleton;
    };
    return NotificationSystem;
})();
var PopoverNotification = (function () {
    function PopoverNotification(container, text) {
        this.text = text;
        this.container = container;
        this.options = {
            content: this.text,
            html: true,
            placement: "bottom",
            delay: { "show": 500, "hide": 100 }
        };
    }
    PopoverNotification.prototype.getOptions = function () {
        return this.options;
    };
    PopoverNotification.prototype.show = function () {
        $(this.container).popover(this.options);
        $(this.container).data('bs.popover').options.content = this.text;
        $(this.container).popover("show");
        var self = this;
        $('.popover').off('click').on('click', function (e) {
            self.hide();
            e.stopPropagation();
        });
        if (document.hasFocus()) {
            this.timeoutID = setTimeout(function () {
                self.hide();
            }, 5000);
        }
    };
    PopoverNotification.prototype.clearTimeout = function () {
        if (this.timeoutID != null) {
            clearTimeout(this.timeoutID);
            this.timeoutID = null;
        }
    };
    PopoverNotification.prototype.hide = function () {
        this.clearTimeout();
        $(this.container).popover("hide");
    };
    return PopoverNotification;
})();
var ProjectConfig = (function () {
    function ProjectConfig() {
        this.name = "Urtela Chat";
        this.codeName = "Nemesis";
        this.version = "V.2.0.549";
    }
    return ProjectConfig;
})();
var Project = new ProjectConfig();
var SettingsPanel = (function () {
    function SettingsPanel() {
        this.useAutoScroll = true;
        this.onFileDrop = new Signal();
        this.refreshAutoScrollToggleButton();
        var settings = this;
        $(HtmlID.AUTO_SCROLL_TOGGLE_BUTTON).click(function () {
            settings.toggleAutoScroll();
        });
        var ui = this;
        $("#debug").hide();
        this.addButton("#themes", "Default Theme", function () {
            CustomTheme.unload();
        });
        this.addButton("#themes", "Dark Theme", function () {
            new CustomTheme("css/themes/theme1.min.css");
        });
        if (this.myDropzone == null) {
            this.myDropzone = new Dropzone("div#messages", { url: "/", clickable: false, previewsContainer: "#upload-info" });
            var ui = this;
            this.myDropzone.on("error", function (file, response) {
                ui.closePopup();
                $("#fileUpload").modal("show");
            });
            this.myDropzone.on("success", function (file, response) {
                ui.closePopup();
                $("#fileUpload").modal("show");
                ui.onFileDrop.send(file);
            });
        }
    }
    SettingsPanel.prototype.closePopup = function () {
        Debug.log("Closing popups");
        $('.modal').modal('hide');
    };
    SettingsPanel.prototype.addButton = function (container, name, callback) {
        $(container).show();
        var button = document.createElement("button");
        button.className = "btn btn-success btn-sm";
        button.innerHTML = name;
        $(container).append(button);
        $(button).click(callback);
    };
    SettingsPanel.prototype.refreshAutoScrollToggleButton = function () {
        var button = $(HtmlID.AUTO_SCROLL_TOGGLE_BUTTON);
        var iconOn = $(HtmlID.AUTO_SCROLL_ICON_ON);
        var iconOff = $(HtmlID.AUTO_SCROLL_ICON_OFF);
        if (this.useAutoScroll) {
            button.addClass("btn-info");
            button.removeClass("btn-warning");
            iconOn.show();
            iconOff.hide();
        }
        else {
            button.removeClass("btn-info");
            button.addClass("btn-warning");
            iconOff.show();
            iconOn.hide();
        }
    };
    SettingsPanel.prototype.toggleAutoScroll = function () {
        this.useAutoScroll = !this.useAutoScroll;
        Debug.log("Autoscroll toggled: " + this.useAutoScroll);
        this.refreshAutoScrollToggleButton();
    };
    return SettingsPanel;
})();
var Signal = (function () {
    function Signal() {
        this.callbacks = new Array();
    }
    Signal.prototype.add = function (f) {
        this.callbacks.push(f);
    };
    Signal.prototype.remove = function (f) {
        for (var i = 0; i < this.callbacks.length; i++) {
            if (this.callbacks[i] == f) {
                this.callbacks.splice(i, 1);
                return;
            }
        }
        Debug.assert(false, "Can't remove callback!");
    };
    Signal.prototype.send = function (data) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](data, args);
        }
    };
    return Signal;
})();
var TestSystem = (function () {
    function TestSystem(data, ui, client) {
        var channel = new ChatChannel("lobby", "Welvcomse1");
        this.addUsers(channel, 10);
        data.addChannel(channel);
        channel = new ChatChannel("Kakkamaster2", "Welvcomse2");
        this.addUsers(channel, 2);
        data.addChannel(channel);
        channel = new ChatChannel("Kakkamaster3", "Welvcomse3");
        this.addUsers(channel, 1);
        data.addChannel(channel);
        channel = new ChatChannel("Kakkamaster4", "Welvcomse4");
        this.addUsers(channel, 4);
        data.addChannel(channel);
        channel = new ChatChannel("@Kakkamaster4", "Welvcomse4");
        this.addUsers(channel, 4);
        data.addChannel(channel);
        channel = new ChatChannel("@¯\_(ツ)_/¯", "Welvcomse4");
        this.addUsers(channel, 4);
        data.addChannel(channel);
        data.restoreActiveChannel();
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User2");
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User2");
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User2");
        this.addMessage("lobby", data, "User1");
        this.addMessage("lobby", data, "User2");
        this.addMessage("lobby", data, "User1");
        this.addMessage("Kakkamaster3", data, "User1");
        this.addMessage("Kakkamaster3", data, "User1");
        this.addMessage("Kakkamaster3", data, "User1");
        this.addMessage("Kakkamaster2", data, "User1");
        this.addMessage("Kakkamaster2", data, "User1");
        this.addMessage("Kakkamaster4", data, "User1");
        this.addMessage("Kakkamaster4", data, "User1");
        this.addMessage("Kakkamaster4", data, "User1");
        this.addMessage("Kakkamaster4", data, "User1");
        ui.setLoading(null);
        data.addMember(new ChatMember("LAterJoin", "000", "idle"), "lobby");
        data.setActiveChannelByName("paskanmanrja");
        ui.addLog("TestLog1");
        ui.addLog("TestLog2");
        ui.addLog("TestLog3");
    }
    TestSystem.prototype.addUsers = function (channel, count) {
        for (var i = 0; i < count; i++) {
            channel.addMember(new ChatMember(channel.name + "_User_" + i, "0" + i, "online"));
        }
    };
    TestSystem.prototype.addMessage = function (channelName, data, sender) {
        data.addMessage(new ChatMessage("0:0", sender, channelName + " message", ChatMessageType.NORMAL), channelName);
    };
    return TestSystem;
})();
var TooltipManager = (function () {
    function TooltipManager() {
    }
    TooltipManager.hideAll = function () {
        $('.tooltip').each(function () {
            $(this)['tooltip']('hide');
        });
    };
    TooltipManager.hideAllExcept = function (active) {
        $('.tooltip').each(function () {
            if (this != active) {
                $(this)['tooltip']('hide');
            }
        });
    };
    TooltipManager.show = function (element, msg, placement) {
        TooltipManager.hideAllExcept(element);
        $(element).attr("data-original-title", msg);
        if ($(element).attr("data-toggle") != "tooltip") {
            $(element).attr("title", msg);
            $(element)['tooltip']({
                placement: placement,
                container: "body"
            });
            $(element).attr("data-toggle", "tooltip");
            $(element)['tooltip']("show");
        }
    };
    return TooltipManager;
})();
var Utils = (function () {
    function Utils() {
    }
    Utils.customEmotes = function (str) {
        var youTriedRegex = /\(youtried\)/gi;
        return str.replace(youTriedRegex, function (youTried) {
            return '<img style="width: 4em;" src="img/youtried.png"/>';
        });
    };
    Utils.timeNow = function () {
        var date = new Date();
        var hours = date.getHours().toString();
        var minutes = date.getMinutes().toString();
        if (minutes.length == 1) {
            minutes = "0" + minutes;
        }
        return hours + ":" + minutes;
    };
    Utils.smallImages = function (str) {
        var imageRegex = /<img\ /gi;
        return str.replace(imageRegex, function (imageStr) {
            return imageStr + 'width="200"';
        });
    };
    Utils.universeJiraLinks = function (str) {
        var universeJiraRegexVerify = /([^a-zA-Z]|^)uni-[0-9]+/ig;
        var universeJiraRegexSelect = /uni-[0-9]+/ig;
        if (str.match(universeJiraRegexVerify) != null) {
            return str.replace(universeJiraRegexSelect, function (jira) {
                var front = "";
                if (jira.match(/\s/)) {
                    jira = jira.trim();
                    front = " ";
                }
                return front + '<a target="_blank" href="https://mdc-tomcat-jira76.ubisoft.org/jira/browse/' + jira + '" class="btn btn-warning btn-xs">' + jira + '</a>';
            });
        }
        return str;
    };
    Utils.linkify = function (text) {
        if (text == null)
            return text;
        var urlRegex = /(([ \t\n]|^)(https?:\/\/|ftp:\/\/|file:\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        text = text.replace(urlRegex, function (url) {
            return '<a target="_blank" href="' + url + '" class="btn btn-default btn-xs">' + url + '</a>';
        });
        text = Utils.universeJiraLinks(text);
        text = Utils.smallImages(text);
        text = Utils.customEmotes(text);
        return text;
    };
    Utils.unwindHtml = function (html) {
        return html
            .replace(/\&amp\;/g, "&")
            .replace(/\&lt\;/g, "<")
            .replace(/\&gt\;/g, ">")
            .replace(/\&quot\;/g, "\"")
            .replace(/\&\#039\;/g, "'");
    };
    return Utils;
})();
//# sourceMappingURL=chat.js.map