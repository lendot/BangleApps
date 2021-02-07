Bangle.loadWidgets();
Bangle.drawWidgets();

const s = require("Storage");

const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];


let alarms = s.readJSON("mralarm.json",1)||[];
alarms = alarms.sort((a,b)=>a.hr-b.hr);

let alarmNames = s.readJSON("mralarm-names.json",1)||['Wake Up','Breakfast','Lunch','Dinner','Meds','Walk Dog','Bedtime'];
alarmNames.unshift(""); // put blank (i.e., no-name) option first


function formatTime(t) {
  let hrs = (0|t).toString(); // get integer portion of t, i.e., the hour
  let mins = Math.round((t-hrs)*60).toString();
  return hrs.padStart(2," ")+":"+mins.padStart(2,"0");
}

function getCurrentHr() {
  let time = new Date();
  return time.getHours()+(time.getMinutes()/60)+(time.getSeconds()/3600);
}

function onOff(v) {
  return v?"On":"Off";
}

// get a decimal representation of current time
// e.g. 12:30 = 12.5, 7:12 = 7.2
function getDecimalTime(t) {
  return t.getHours()+(t.getMinutes()/60)+(t.getSeconds()/3600);
}

// get info about the next alarm for the main screen
//
// todo: clean up this code, make it more efficient
function getNextAlarm() {
  let nextAlarmInfo = {};
  let nextAlarm;
  let now = new Date();
  let dow = now.getDay(); // day of week 0-6
  let nowTime = getDecimalTime(now);
  let alarmsLeftToday = alarms.filter(a=>a.on && a.days[dow] === true &&
				      nowTime <= a.hr);
  if (alarmsLeftToday.length > 0) {
    // next alarm is today
    alarmsLeftToday = alarmsLeftToday.sort((a,b) => a.hr-b.hr);
    nextAlarm = alarmsLeftToday[0];
    nextAlarmInfo.day = "Today";
    nextAlarmInfo.time = formatTime(nextAlarm.hr);
    if (nextAlarm.name && nextAlarm.name!=="") {
      nextAlarmInfo.name = nextAlarm.name;
    }
    return nextAlarmInfo;
  } else {
    // next alarm is on a future day?
    for (let i=1; i<7; i++) {
      let dayAlarms = alarms.filter(a=>a.on && a.days[(dow+i)%7] === true);
      if (dayAlarms.length > 0) {
	dayAlarms = dayAlarms.sort((a,b) => a.hr-b.hr);
	nextAlarm = dayAlarms[0];
	nextAlarmInfo.day = (i==1)?"Tomorrow":daysOfWeek[(dow+i)%7];
	nextAlarmInfo.time = formatTime(nextAlarm.hr);
	if (nextAlarm.name && nextAlarm.name!=="") {
	  nextAlarmInfo.name = nextAlarm.name;
	}
	return nextAlarmInfo;
      }
    }
  }
  return null; // no upcoming alarms found
}

function alarmDaysAbbrev(days) {
  let dayAbbrevs = ['S','M','T','W','T','F','S'];
  let abbrev = "";
  dayAbbrevs.forEach((dayAbbrev,i) => {
    if (days[i]) {
      abbrev += dayAbbrev;
    } else {
      abbrev += " ";
    }
  });
  return abbrev;
}

function showMainMenu() {
  const menu = {
    '': { 'title': 'Alarms' },
    'New Alarm': ()=>editAlarm(-1)
  };
  alarms.forEach((alarm,idx)=>{
    let txt = formatTime(alarm.hr);
    //    if (alarm.rp) txt += " (repeat)";
    if (alarm.name) {
      txt += " "+alarm.name;
    }
    // txt += " "+alarmDaysAbbrev(alarm.days);
    menu[txt] = function() {
      E.showMenu(); // remove the current menu
      editAlarm(idx);
    };
  });
  menu['< Back'] =  ()=>{showMainScreen();};

  
  return E.showMenu(menu);
}

function editAlarm(alarmIndex) {
  let newAlarm = alarmIndex<0;
  let hrs = 12;
  let mins = 0;
  let en = true;
  let repeat = true;
  let as = false;
  let name = "";
  let days = [true,true,true,true,true,true,true]; // 0-6 sun-sat

  let nameIndex = 0;

  if (!newAlarm) {
    let a = alarms[alarmIndex];
    console.log(a);
    hrs = 0|a.hr;
    mins = Math.round((a.hr-hrs)*60);
    en = a.on;
    repeat = a.rp;
    as = a.as;
    days = a.days;
    name = a.name;
    nameIndex = alarmNames.indexOf(name);
    if (nameIndex == -1) {
      nameIndex = 0;
    }
  }

  
  const menu = {
    '': { 'title': 'Alarms' },
    'Name': {
      value: nameIndex,
      format: v=>alarmNames[v],
      min: 0,
      max: alarmNames.length-1,
      step:1,
      onchange: v=>name=alarmNames[v]
    },
    'Hours': {
      value: hrs,
      onchange: function(v){if (v<0)v=23;if (v>23)v=0;hrs=v;this.value=v;} // no arrow fn -> preserve 'this'
    },
    'Minutes': {
      value: mins,
      onchange: function(v){if (v<0)v=59;if (v>59)v=0;mins=v;this.value=v;} // no arrow fn -> preserve 'this'
    },
    'Enabled': {
      value: en,
      format: v=>v?"On":"Off",
      onchange: v=>en=v
    },
    'Repeat': {
      value: repeat,
      format: v=>v?"Yes":"No",
      onchange: v=>repeat=v
    }
  };

  // add toggles for each day of the week
  function addDay(day,i,weekDays) {
    menu[day] = {
      value: days[i],
      format: v=>onOff(v),
      onchange: v=>days[i]=v
    };
  }
  daysOfWeek.forEach(addDay);
    
  menu['Auto snooze']={
    value: as,
    format: v=>v?"Yes":"No",
    onchange: v=>as=v
  };
  
  function getAlarm() {
    let hr = hrs+(mins/60);

    // Save alarm
    return {
      name: name,
      on : en, hr : hr,
      rp : repeat, as: as,
      days: days
    };
  }
  menu["> Save"] = function() {
    if (newAlarm) {
      alarms.push(getAlarm());
    } else {
      alarms[alarmIndex] = getAlarm();
    }
    alarms.sort((a,b)=>a.hr-b.hr);

    s.write("mralarm.json",JSON.stringify(alarms));

    // tell widget the alarm file has changed
    WIDGETS["mralarm"].reload();
    E.showMenu(); // remove this menu

    showMainMenu();
  };
  if (!newAlarm) {
    menu["> Delete"] = function() {
      alarms.splice(alarmIndex,1);
      s.write("mralarm.json",JSON.stringify(alarms));

      // tell widget the alarm file has changed
      WIDGETS["mralarm"].reload();
      E.showMenu(); // remove this menu
      
      showMainMenu();
    };
  }
  menu['< Back'] = function() {
    E.showMenu();
    showMainMenu();
  };
  return E.showMenu(menu);
}

// show the screen that displays on app launch
function showMainScreen() {
  let nextAlarm = getNextAlarm();
  let msg;
  if (nextAlarm === null) {
    msg = "No upcoming alarms";
  } else {
    msg = "Next alarm:\n"+nextAlarm.day+"\n"+nextAlarm.time;
    if (nextAlarm.name !== undefined) {
      msg += "\n"+nextAlarm.name;
    }
  }
  E.showPrompt(msg,{
    title:"MrAlarm",
    buttons: {"Alarms":1,"Exit":2}
  }).then(function(button) {
    if (button==1) {
      showMainMenu();
    } else {
      load();
    }
  });
}

showMainScreen();
