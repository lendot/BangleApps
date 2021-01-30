Bangle.loadWidgets();
Bangle.drawWidgets();

var alarms = require("Storage").readJSON("mralarm.json",1)||[];
alarms = alarms.sort((a,b)=>a.hr-b.hr);

let alarmNames = ['','Wake up','Bedtime','Glucose'];

function formatTime(t) {
  var hrs = (0|t).toString(); // get integer portion of t, i.e., the hour
  var mins = Math.round((t-hrs)*60).toString();
  return hrs.padStart(2," ")+":"+mins.padStart(2,"0");
}

function getCurrentHr() {
  var time = new Date();
  return time.getHours()+(time.getMinutes()/60)+(time.getSeconds()/3600);
}

function showMainMenu() {
  const menu = {
    '': { 'title': 'Alarms' },
    'New Alarm': ()=>editAlarm(-1)
  };
  alarms.forEach((alarm,idx)=>{
    txt = (alarm.on?"on  ":"off ")+formatTime(alarm.hr);
    //    if (alarm.rp) txt += " (repeat)";
    if (alarm.name) {
      txt += " "+alarm.name;
    }
    menu[txt] = function() {
      editAlarm(idx);
    };
  });
  menu['< Back'] =  ()=>{load();};
  return E.showMenu(menu);
}

function editAlarm(alarmIndex) {
  var newAlarm = alarmIndex<0;
  var hrs = 12;
  var mins = 0;
  var en = true;
  var repeat = true;
  var as = false;
  var name = "";
  var days = [true,true,true,true,true,true,true]; // 0-6 sun-sat

  let nameIndex = 0;
  
  if (!newAlarm) {
    var a = alarms[alarmIndex];
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
      value: en,
      format: v=>v?"Yes":"No",
      onchange: v=>repeat=v
    },
    'Sunday': {
      value: days[0],
      format: v=>v?"On":"Off",
      onchange: v=>days[0]=v
    },
    'Monday': {
      value: days[1],
      format: v=>v?"On":"Off",
      onchange: v=>days[1]=v
    },
    'Tueday': {
      value: days[2],
      format: v=>v?"On":"Off",
      onchange: v=>days[2]=v
    },
    'Wednesday': {
      value: days[3],
      format: v=>v?"On":"Off",
      onchange: v=>days[3]=v
    },
    'Thursday': {
      value: days[4],
      format: v=>v?"On":"Off",
      onchange: v=>days[4]=v
    },
    'Friday': {
      value: days[5],
      format: v=>v?"On":"Off",
      onchange: v=>days[5]=v
    },
    'Saturday': {
      value: days[6],
      format: v=>v?"On":"Off",
      onchange: v=>days[6]=v
    },
    'Auto snooze': {
      value: as,
      format: v=>v?"Yes":"No",
      onchange: v=>as=v
    }
  };
  function getAlarm() {
    var hr = hrs+(mins/60);
    var day = 0;
    // If alarm is for tomorrow not today (eg, in the past), set day
    if (hr < getCurrentHr())
      day = (new Date()).getDate();
    // Save alarm
    return {
      name: name,
      on : en, hr : hr,
      last : day, rp : repeat, as: as,
      days: days
    };
  }
  menu["> Save"] = function() {
    if (newAlarm) alarms.push(getAlarm());
    else alarms[alarmIndex] = getAlarm();
    require("Storage").write("mralarm.json",JSON.stringify(alarms));

    // tell widget the alarm file has changed
    WIDGETS["mralarm"].reload();
    
    showMainMenu();
  };
  if (!newAlarm) {
    menu["> Delete"] = function() {
      alarms.splice(alarmIndex,1);
      require("Storage").write("mralarm.json",JSON.stringify(alarms));

      // tell widget the alarm file has changed
      WIDGETS["mralarm"].reload();
      
      showMainMenu();
    };
  }
  menu['< Back'] = showMainMenu;
  return E.showMenu(menu);
}

showMainMenu();
