  var notificationsGlobal = false;
  var notificationsTemporary = 0;
  
  if (!("Notification" in window)) {
  }
  else {
    if (Notification.permission === "granted") {
      notificationsGlobal = true;
    }
    else {
      if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // If the user is okay, let's create a notification
          if (permission === "granted") {
            notificationsGlobal = true;
          }
        });
      }
    }
  }
