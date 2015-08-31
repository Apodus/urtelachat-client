class Client
{
	url:String;
	constructor()
	{
		
	}
	connect(url:String)
	{
		this.url = url;
		Debug.log("Client Connecting to: "+url);
	}
}