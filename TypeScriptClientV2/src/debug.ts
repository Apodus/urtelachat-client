enum DebugLevel
{
	DEBUG_OFF,
	DEBUG_NORMAL,
	DEBUG_FULL
}

class Debug
{
	private static debugLevel:number = DebugLevel.DEBUG_OFF;
	
	private static onError:Signal;
	
	static log(str:string)
	{
		if(Debug.debugLevel == DebugLevel.DEBUG_OFF) return;
		
		console.log(str);
	}
	
	static warning(str:string)
	{
		if(Debug.debugLevel == DebugLevel.DEBUG_OFF) return;
		
		console.log("\n############################ WARNING ############################");
		console.log(str);
	}
	
	static assert(expr:boolean,msg:string)
	{
		if(!expr)
		{
			if(Debug.debugLevel == DebugLevel.DEBUG_OFF)
			{
				if(Debug.onError)
				{
					Debug.onError.send(msg);
				}
				return;
			}
			
			alert("ASSERT!\n\n"+msg);
		}
	}
	
	static debugLog(msg:string)
	{
		if(Debug.debugLevel!=DebugLevel.DEBUG_FULL) return;
		Debug.log("\t"+msg);
	}
	
	static setErrorHandler(callback:Function)
	{
		if(Debug.onError==null)
		{
			Debug.onError = new Signal();
		}
		Debug.onError.add(callback);
	}
}