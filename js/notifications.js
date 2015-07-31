var notificationsGlobal = false;
var notificationsTemporary = 0;
  
if (!("Notification" in window))
{
  
}
else
{
	if (Notification.permission === "granted")
	{
		notificationsGlobal = true;
	}
	else
	{
		if (Notification.permission !== 'denied')
		{
			Notification.requestPermission(function (permission)
			{
				// If the user is okay, let's create a notification
				if (permission === "granted")
				{
					notificationsGlobal = true;
				}
			});
		}
	}
}

function showDesktopNotification(channel, user, msg)
{
	// if window has no focus & global notify setting & channel specific rules.
	if((notificationsTemporary == 0) && notificationsGlobal && (getCookie(channel + "_notify") != "forbid") && !document.hasFocus())
	{
		
		var notification = new Notification(channel + ": " + user, {"body": unwindHtml(msg), "icon":"http://urtela.redlynx.com/img/chaticon.jpg"});
		setTimeout(function()
		{
			notification.close();
		}, 5000);
		
		client.unreadMessages = client.unreadMessages + 1;
		document.title = client.unreadMessages.toString() + " unread!";
		window.focus();
	
	}
}
