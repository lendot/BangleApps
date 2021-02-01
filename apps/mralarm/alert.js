const s = require('Storage');

const ACTIVE_ALARM_FILE = "mralarm.active.json";

let alarmTimerId = null;

// get the currently active alarm
function getActiveAlarm() {
  // todo: find a less janky way to pass this info around
  return s.readJSON(ACTIVE_ALARM_FILE,1);
}

// get a decimal representation of current time
// e.g. 12:30 = 12.5, 7:12 = 7.2
function getDecimalTime(t) {
  return t.getHours()+(t.getMinutes()/60)+(t.getSeconds()/3600);
}

function formatTime(t) {
  let hrs = 0|t;
  let mins = Math.round((t-hrs)*60);
  return hrs+":"+("0"+mins).substr(-2);
}

// snooze the alarm for the specified number of minutes
function snooze(mins) {
  let timeUntil = mins * 60 * 1000;
  alarmTimerId = setTimeout(doAlarm,timeUntil);
}

function doAlarm(alarm) {
  let buzzCount = 10;
  let msg = formatTime(alarm.hr);
  if (alarm.name && alarm.name!=="") {
    msg += "\n"+alarm.name;
  }

  let timeoutId = null;
  
  E.showPrompt(msg,{
    title:"Alarm",
    buttons: {"Ok":true}
  }).then(function(ok) {
    load();
  });

  
  
  function buzz() {
    Bangle.buzz(100).then(()=>{
      setTimeout(()=>{
	Bangle.buzz(100).then(function() {
	  setTimeout(buzz, 2000);
	});
      },100);
    });
  }
  buzz();


  // called when alarm has gone unattended too long
  function timeoutAlarm() {
    E.showPrompt();
    load();
  }
  
  timeoutId=setTimeout(timeoutAlarm,3*60000); // timeout alarm after 3 minutes
}

alarm = getActiveAlarm();
if (alarm==null) {
  // no active alarm, nothing to do
  load();
} else {
  doAlarm(alarm);
}


