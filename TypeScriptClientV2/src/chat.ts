class Chat
{
	private data:Client;
	private ui:Userinterface;
	constructor()
	{
		Debug.log(Project.name+" "+Project.version+" CodeName:"+Project.codeName);
		this.data = new Client();
		this.ui = new Userinterface();
	}
	connect(url:string)
	{
		this.data.connect(url);
	}
	init()
	{
		Debug.log("init");
		this.data.connect("http://urtela.redlynx.com:3001");
		this.ui.setLoading(null);
	}
	static create()
	{
		var chat:Chat = new Chat();
		try
		{
			document.body.onload = function()
			{
				chat.init();
			};
		}
		catch(e)
		{
			document.body.onload = function()
			{
				chat.ui.fatalError("Error while loading chat.<br/>please try again later.");
			}
		}
	}
}