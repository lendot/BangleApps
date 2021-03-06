(() => {

  const s = require('Storage');
  
  const ALARMS_FILE = "mralarm.json";
  const ACTIVE_ALARM_FILE = "mralarm.active.json";
  
  const WIDTH = 24; // widget width
  const HEIGHT = 23; // global widget height

  let alarms;
  let nextAlarm = null;
  
  let alarmTimerId = null;
  
  function loadAlarms() {
    alarms = s.readJSON(ALARMS_FILE,1) || [];
  }
  
  // get a decimal representation of current time
  // e.g. 12:30 = 12.5, 7:12 = 7.2
  function getDecimalTime(t) {
    return t.getHours()+(t.getMinutes()/60)+(t.getSeconds()/3600);

  }
  
  // get time delta between two decimal time values, in ms
  function getTimeDelta(t1,t2) {
    let delta = (t2-t1)*3600*1000;
    return 0|delta;
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
      // no alarms the rest of this day; check again at midnight.
      nextAlarm = null;
      setTimeout(updateAlarms,getTimeDelta(nowTime,24.0));
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
  }

  // fire off the alarm to the user
  function doAlarm() {

    /* --- todo: put this code somewhere less janky */
    if (!nextAlarm.rp) {
      // alarm doesn't repeat; disable it for the future
      nextAlarm.on = false;
      s.write(ALARMS_FILE,JSON.stringify(alarms));
    }
    /* --- */

    
    s.write(ACTIVE_ALARM_FILE,JSON.stringify(nextAlarm));
    load("mralarm-alert.js");
  }

  // (re)draw the widget
  function draw() {
    g.reset();
    g.clearRect(this.x, this.y, this.x+WIDTH, this.y+HEIGHT);
    g.setColor(-1); // white

//    g.drawImage(atob("FxeEAAAAAAD////wAAAAAAAAAP/////wAAAAAAAA//AAAP/wAAAAAAD/8AAAAP/wAAAAAA/yAAAAAv8AAAAAAv8AAAAAD/IAAAAA//AAAAAA//AAAAAP8gAAAAAC/wAAAAD/AvIAAvIP8AAAAC/w//AA//D/IAAAD/8P/wAP/w//AAAA/yDw8ADw8C/wAAD/8A//AA//AP/wAP/wAP/wAP/wAP/w//AAAvIAAvIAAP//8gAAAAAAAAAAAv//AAAAAAAAAAAAD///////////////////////////////8AAAAA/wAP8AAAAAAAAAAP8AD/AAAAAAAAAAAv8v8gAAAAAAAAAAAv/yAAAAAAA="),this.x,this.y);

    g.drawImage(atob("FxeEAAAAAAD////wAAAAAAAAAP/////wAAAAAAAA//AAAP/wAAAAAAAv8AAAAP8gAAAAAA/yAAAAAv8AAAAAAP8AAAAAD/AAAAAAL/AAAAAA/yAAAAAP8gAAAAAC/wAAAAD/Av8gL/IP8AAAAC/w//8P//D/IAAAD/8PAPDwDw//AAAA/yDwDw8A8C/wAAD/8A8A8PAPAP/wAP/wAP//D//wAP/w//AAAv8gL/IAAP//8gAAAAAAAAAAAv//AAAAAAAAAAAAD///////////////////////////////8AAAAA/wAP8AAAAAAAAAAP8AD/AAAAAAAAAAAv8v8gAAAAAAAAAAAv/yAAAAAAA="),this.x,this.y);

  }

  // called by app when mralarm.json has changed
  function reload() {
    // clear out pending timers
    if (alarmTimerId != null) {
      clearTimeout(alarmTimerId);
      alarmTimerId = null;
      nextAlarm = null;
    }

    // just to be safe, let's queue up the update stuff
    // to run after this script is done instead of immediately
    setTimeout(updateAlarms,0);
  }

  // redraw when the LCD turns on
  Bangle.on('lcdPower', function(on) {
    if (on) WIDGETS["mralarm"].draw();
  });
    
  // add the widget graphics
  WIDGETS["mralarm"]={area:"tl",
		      width:WIDTH,
		      draw:draw,
		      reload:reload};
  
  updateAlarms();
  
})()
