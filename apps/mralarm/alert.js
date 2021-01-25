const s = require('Storage');

const ACTIVE_ALARM_FILE = "mralarm.active.json";

let alarmTimerId = null;

// get the currently active alarm
function loadActiveAlarm() {
  return s.readJSON(ACTIVE_ALARM_FILE,1);
}

// get a decimal representation of current time
// e.g. 12:30 = 12.5, 7:12 = 7.2
function getDecimalTime(t) {
  return t.getHours()+(t.getMinutes()/60)+(t.getSeconds()/3600);
}

// snooze the alarm for the specified number of minutes
function snooze(mins) {
  let timeUntil = mins * 60 * 1000;
  alarmTimerId = setTimeout(doAlarm,timeUntil);
}

function doAlarm(alarm) {
  let buzzCount = 10;
  let msg = "Alarm";

  E.showPrompt(msg,{
    title:"ALARM!",
    buttons: {"Sleep":true,"Ok":false}
  }).then(function(sleep) {
    buzzCount = 0;
    if (sleep) {
      snooze(10);
    } else {
      load();
    }
  });
  function buzz() {
    Bangle.buzz(100).then(()=>{
      setTimeout(()=>{
	Bangle.buzz(100).then(function() {
	  if (buzzCount--)
	    setTimeout(buzz, 3000);
	  else if(alarm.as) { // auto-snooze
	    buzzCount = 10;
	    setTimeout(buzz, 600000);
	  }
	});
      },100);
    });
  }
  buzz();
}

alarm = loadActiveAlarm();
if (alarm==null) {
  // no active alarm, nothing to do
  load();
} else {
  doAlarm(alarm);
}


