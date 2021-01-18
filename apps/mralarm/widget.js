(() => {
    const s = require('Storage');

    const ALARMS_FILE = "mralarm.json";
    const ALARMS_UPDATE_TIME = 5; // time between alarms file updates (in mins)
    
    let alarms;
    let nextAlarm;

    let alarmTimerId = null;
    let updateTimerId = null;

    function loadAlarms() {
	alarms = s.readJSON(ALARMS_FILE,1) || [];
    }

    // get a decimal representation of current time
    // e.g. 12:30 = 12.5, 7:12 = 7.2
    function getDecimalTime(t) {
	return t.getHours()+(time.getMinutes()/60)
    }

    // get time delta between two decimal time values, in ms
    function getTimeDelta(t1,t2) {
	let delta = (t2-t1)*3600*1000;
	return 0|delta;
    }

    // snooze the current alarm
    function snooze(mins) {
	let now = new Date();
	let nowTime = getDecimalTime(now);
	let snoozeEnd = nowTime + mins/60; // mins minutes from now
	let timeUntil = getTimeDelta(nowTime,snoozeEnd);
	alarmTimerId = setTimeout(doAlarm,timeUntil);
    }
    
    // set timer for the next alarm, if one is available
    function setNextAlarm() {
	if (alarms.length == 0) {
	    return;
	}
	let now = new Date();
	let dow = now.getDay(); // local time day of week 0-6
	let nowTime = getDecimalTime(now);
	let alarmsLeftToday = alarms.filter(a=>a.on && a.days[dow] === true &&
					    nowTime <= a.hr);
	if (alarmsLeftToday.length == 0) {
	    return;
	}
	alarmsLeftToday = alarmsLeftToday.sort((a,b)=>a.hr-b.hr);
	nextAlarm = alarmsLeftToday[0];
	let timeUntil = getTimeDelta(nowTime,nextAlarm.hr);
	alarmTimerId = setTimeout(doAlarm,timeUntil);
    }

    // update alarms from the alarms file
    function updateAlarms() {
	if (alarmTimerId != null) {
	    // stop the queued alarm before updating
	    clearTimeout(alarmTimerId);
	    alarmTimerId = null;
	    nextAlarm = null;
	}
	loadAlarms();
	setNextAlarm();
	updateTimerId = setTimeout(updateAlarms,ALARMS_UPDATE_TIME*60*1000);
    }
    
    function doAlarm() {
	alarmTimerId = null;

	if (updateTimerId != null) {
	    // stop updates while we're alarming
	    clearTimeout(updateTimerId);
	    updateTimerId = null;
	}

	let msg = "Alarm";

	E.showPrompt(msg,{
	    title:"ALARM!",
	    buttons: {"Sleep":true,"Ok":false}
	}).then(function(sleep) {
	    if (sleep) {
		snooze(10);
	    } else {
		// todo: handle non-repeating alarms
		updateAlarms();
	    }
	});
	
    }

    updateAlarms();

    // add the widget
    WIDGETS["mralarm"]={area:"tl",width:24,draw:function() {
	g.setColor(-1);
	g.drawImage(atob("GBgBAAAAAAAAABgADhhwDDwwGP8YGf+YMf+MM//MM//MA//AA//AA//AA//AA//AA//AB//gD//wD//wAAAAADwAABgAAAAAAAAA"),this.x,this.y);
    }};
    

})()

/*



// Chances are boot0.js got run already and scheduled *another*
// 'load(alarm.js)' - so let's remove it first!
clearInterval();

function formatTime(t) {
  var hrs = 0|t;
  var mins = Math.round((t-hrs)*60);
  return hrs+":"+("0"+mins).substr(-2);
}

function getCurrentHr() {
  var time = new Date();
  return time.getHours()+(time.getMinutes()/60)+(time.getSeconds()/3600);
}

function showAlarm(alarm) {
  var msg = formatTime(alarm.hr);
  var buzzCount = 10;
  if (alarm.msg)
    msg += "\n"+alarm.msg;
  E.showPrompt(msg,{
    title:"ALARM!",
    buttons : {"Sleep":true,"Ok":false} // default is sleep so it'll come back in 10 mins
  }).then(function(sleep) {
    buzzCount = 0;
    if (sleep) {
      if(alarm.ohr===undefined) alarm.ohr = alarm.hr;
      alarm.hr += 10/60; // 10 minutes
    } else {
      alarm.last = (new Date()).getDate();
      if (alarm.ohr!==undefined) {
          alarm.hr = alarm.ohr;
          delete alarm.ohr;
      }
      if (!alarm.rp) alarm.on = false;
    }
    require("Storage").write("alarm.json",JSON.stringify(alarms));
    load();
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

// Check for alarms
var day = (new Date()).getDate();
var hr = getCurrentHr()+10000; // get current time - 10s in future to ensure we alarm if we've started the app a tad early
var alarms = require("Storage").readJSON("alarm.json",1)||[];
var active = alarms.filter(a=>a.on&&(a.hr<hr)&&(a.last!=day));
if (active.length) {
  // if there's an alarm, show it
  active = active.sort((a,b)=>a.hr-b.hr);
  showAlarm(active[0]);
} else {
  // otherwise just go back to default app
  setTimeout(load, 100);
}
*/
