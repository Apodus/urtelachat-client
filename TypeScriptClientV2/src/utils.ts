class Utils
{
	static customEmotes(str:string)
	{
		var youTriedRegex = /\(youtried\)/gi
		return str.replace(youTriedRegex, function(youTried)
		{
			return '<img style="width: 4em;" src="img/youtried.png"/>'
		});
	}
	
	static timeNow()
	{
		var date:Date = new Date();
		var hours:string = date.getHours().toString();
		var minutes:string = date.getMinutes().toString();
		if(minutes.length == 1)
		{
			minutes = "0" + minutes;
		}
		return hours + ":" + minutes;
	}
	
	static smallImages(str:string)
	{
		var imageRegex = /<img\ /gi;
		return str.replace(imageRegex, function(imageStr)
		{
			return imageStr + 'width="200"';
		});
	}

	static universeJiraLinks(str:string)
	{
		var universeJiraRegexVerify = /([^a-zA-Z]|^)uni-[0-9]+/ig;
        var universeJiraRegexSelect = /uni-[0-9]+/ig;
        if(str.match(universeJiraRegexVerify) != null)
		{
			return str.replace(universeJiraRegexSelect, function(jira)
			{
				var front:string = "";
				if(jira.match(/\s/))
				{
					jira = jira.trim();
					front = " ";
				}
				return front + '<a target="_blank" href="https://mdc-tomcat-jira76.ubisoft.org/jira/browse/' + jira + '" class="btn btn-warning btn-xs">' + jira + '</a>';
			});
		}
		
		return str;
	}
	
	static linkify(text:string):string
	{
		if(text==null) return text;
	
		var urlRegex =/(([ \t\n]|^)(https?:\/\/|ftp:\/\/|file:\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		text = text.replace(urlRegex, function(url)
		{
			return '<a target="_blank" href="' + url + '" class="btn btn-default btn-xs">' + url + '</a>';
		});
		
		text = Utils.universeJiraLinks(text);
		text = Utils.smallImages(text);
		text = Utils.customEmotes(text);
		return text;
	}
	
	static unwindHtml(html:string)
	{
		return html
			.replace(/\&amp\;/g, "&")
			.replace(/\&lt\;/g, "<")
			.replace(/\&gt\;/g, ">")
			.replace(/\&quot\;/g, "\"")
			.replace(/\&\#039\;/g, "'");
	}
	static stripXml(str:string):string
	{
		return str.replace(/(<([^>]+)>)/ig,"");
	}	
}