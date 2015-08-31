/// <reference path="../ref/jquery.d.ts" />
var Userinterface = (function () {
    function Userinterface() {
    }
    Userinterface.prototype.Userinterface = function () {
        Debug.log("User interface init.");
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
    return Userinterface;
})();
var Chat = (function () {
    function Chat() {
        Debug.log(Project.name + " " + Project.version + " CodeName:" + Project.codeName);
        this.data = new Client();
        this.ui = new Userinterface();
    }
    Chat.prototype.connect = function (url) {
        this.data.connect(url);
    };
    Chat.prototype.init = function () {
        Debug.log("init");
        this.data.connect("http://urtela.redlynx.com:3001");
        this.ui.setLoading(null);
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
var Client = (function () {
    function Client() {
    }
    Client.prototype.connect = function (url) {
        this.url = url;
        Debug.log("Client Connecting to: " + url);
    };
    return Client;
})();
var Debug = (function () {
    function Debug() {
    }
    Debug.log = function (str) {
        console.log(str);
    };
    return Debug;
})();
var ProjectConfig = (function () {
    function ProjectConfig() {
        this.name = "Urtela Chat";
        this.codeName = "Nemesis";
        this.version = "V.2.0.10";
    }
    return ProjectConfig;
})();
var Project = new ProjectConfig();
//# sourceMappingURL=chat.js.map