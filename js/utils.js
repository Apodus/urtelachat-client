function small_images(str)
{
	var imageRegex = /<img\ /gi;
	return str.replace(imageRegex, function(imageStr)
	{
		return imageStr + 'width="200"';
	});
}

function custom_emotes(str)
{
	var youTriedRegex = /\(youtried\)/gi
	return str.replace(youTriedRegex, function(youTried)
	{
		return '<img style="width: 4em;" src="img/youtried.png"/>'
	});
}

function universe_jira_links(str)
{
	var universeJiraRegex = /([\s]|^)uni-[0-9]+/ig;
	return str.replace(universeJiraRegex, function(jira)
	{
		var front = "";
		if(jira.match(/\s/))
		{
			jira = jira.trim();
			front = " ";
		}
		return front + '<a target="_blank" href="https://mdc-tomcat-jira76.ubisoft.org/jira/browse/' + jira + '">' + jira + '</a>';
	});
}

function timeNow()
{
	var date = new Date();
	var hours = date.getHours().toString();
	var minutes = date.getMinutes().toString();
	if(minutes.length == 1)
		minutes = "0" + minutes;
	return hours + ":" + minutes;
}

function linkify(text)
{
	var urlRegex =/(([ \t\n]|^)(https?:\/\/|ftp:\/\/|file:\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	return text.replace(urlRegex, function(url)
	{
		return '<a target="_blank" href="' + url + '">' + url + '</a>';
	});
}

function unwindHtml(html)
{
	return html
		.replace(/\&amp\;/g, "&")
		.replace(/\&lt\;/g, "<")
		.replace(/\&gt\;/g, ">")
		.replace(/\&quot\;/g, "\"")
		.replace(/\&\#039\;/g, "'");
}

function setCookie(cname, cvalue, exdays)
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
	{
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function sharedStart(array)
{
    var A= array.concat().sort(), 
    a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
    while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
    return a1.substring(0, i);
}

function log(str)
{
	console.log(timeNow() + ": " + str);
}