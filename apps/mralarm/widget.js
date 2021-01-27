(() => {
  const s = require('Storage');
  
  const ALARMS_FILE = "mralarm.json";
  const ACTIVE_ALARM_FILE = "mralarm.active.json";

  const ALARMS_UPDATE_TIME = 5; // time between alarms file updates (in mins)

  const WIDTH = 24; // widget width
  const HEIGHT = 23; // global widget height

  const COUNTDOWN_START = 10; // mins out from alarm to show countdown in widget
  
  let alarms;
  let nextAlarm = null;
  
  let alarmTimerId = null;
  let updateTimerId = null;
  let countdownTimerId = null;
  
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

  // convert minutes to milliseconds
  function minsToMillis(ms) {
    return ms*60*1000;
  }

  // update alarm countdown display in the widget
  function countdown() {
    console.log("countdown callback");
    draw();
    countdownTimerId = setTimeout(countdown,10000);
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
      nextAlarm = null;
      return;
    }
    alarmsLeftToday = alarmsLeftToday.sort((a,b)=>a.hr-b.hr);
    nextAlarm = alarmsLeftToday[0];
    let timeUntil = getTimeDelta(nowTime,nextAlarm.hr);
    alarmTimerId = setTimeout(doAlarm,timeUntil);

    let timeUntilCountdown = Math.max(timeUntil - minsToMillis(COUNTDOWN_START),0);
    // set a timer for COUNTDOWN_START minutes before alarm, or immediately
    // if it's less than COUNTDOWN_START minutes from now
    console.log("timeUntilCountdown: "+timeUntilCountdown);
    countdownTimerId = setTimeout(countdown,timeUntilCountdown);
  }
  
  // update alarms from the alarms file
  function updateAlarms() {
    if (alarmTimerId != null) {
      // stop the queued alarm before updating
      clearTimeout(alarmTimerId);
      alarmTimerId = null;
      nextAlarm = null;
    }
    if (countdownTimerId != null) {
      clearTimeout(countdownTimerId);
      countdownTimerId = null;
    }
    loadAlarms();
    setNextAlarm();
    updateTimerId = setTimeout(updateAlarms,ALARMS_UPDATE_TIME*60*1000);
  }

  function doAlarm() {
    s.write(ACTIVE_ALARM_FILE,JSON.stringify(nextAlarm));
    if (countdownTimerId != null) {
      clearTimeout(countdownTimerId);
      countdownTimerId = null;
    }
    load("mralarm-alert.js");
  }

  function draw() {
    console.log("draw");
    g.reset();
    g.clearRect(this.x, this.y, this.x+WIDTH, this.y+HEIGHT);
    g.setColor(-1); // white
    g.drawImage(atob("GBgBAAAAAAAAABgADhhwDDwwGP8YGf+YMf+MM//MM//MA//AA//AA//AA//AA//AA//AB//gD//wD//wAAAAADwAABgAAAAAAAAA"),this.x,this.y);
    if (nextAlarm == null) {
      // nothing else to display
      return;
    }
    let now = new Date();
    let nowTime = getDecimalTime(now);
    let timeToAlarm = getTimeDelta(nowTime,nextAlarm.hr);
    if (timeToAlarm <= 0) {
      // we're past the alarm time
      return;
    }
    console.log("pre timeToAlarm = "+timeToAlarm);
    timeToAlarm = Math.ceil(timeToAlarm / (1000 * 60)); // ms -> mins
    console.log("timeToAlarm = "+timeToAlarm);
    if (timeToAlarm <= COUNTDOWN_START) {
      g.setColor(0x000000); 
      g.setFont("6x8",1);
      let strWidth = g.stringWidth(timeToAlarm);
      console.log("strWidth = "+strWidth);
      console.log("this.x = "+this.x);
      console.log("x = "+(this.x + (WIDTH-strWidth)/2));
      g.drawString(timeToAlarm,this.x+(WIDTH-strWidth)/2,this.y+8);
    }
  }
    
  // add the widget graphics
  WIDGETS["mralarm"]={area:"tl",width:WIDTH,draw:draw};
  
  updateAlarms();
  
})()
