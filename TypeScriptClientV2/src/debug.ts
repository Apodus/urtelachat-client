class Debug
{
	static log(str:string)
	{
		console.log(str);
	}
	
	static warning(str:string)
	{
		console.log("\n############################ WARNING ############################");
		console.log(str);
	}
	
	static assert(expr:boolean,msg:string)
	{
		if(!expr)
		{
			alert("ASSERT!\n\n"+msg);
		}
	}
}