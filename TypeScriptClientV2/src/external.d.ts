/// <reference path="../ref/jquery/jquery.d.ts"/>

declare class Notification
{
	constructor(title:string,options:any);
	
	static permission:string;
	static requestPermission(callback:Function):void;
}

declare class Popover {}

interface JQuery
{
	popover(options:any):Popover;
}