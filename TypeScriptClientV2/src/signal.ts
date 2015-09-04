class Signal
{
	callbacks:Array<Function>;
	constructor()
	{
		this.callbacks = new Array<Function>();
	}
	add(f:Function)
	{
		this.callbacks.push(f);
	}
	remove(f:Function)
	{
		for(var i:number = 0; i<this.callbacks.length; i++)
		{
			if(this.callbacks[i]==f)
			{
				this.callbacks.splice(i,1);
				return;
			}
		}
		Debug.assert(false,"Can't remove callback!");
	}
	send(data:any, ...args:any[])
	{
		for(var i:number = 0; i<this.callbacks.length; i++)
		{
			this.callbacks[i](data,args);
		}
	}
}