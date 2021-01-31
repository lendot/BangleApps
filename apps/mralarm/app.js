Bangle.loadWidgets();
Bangle.drawWidgets();

const s = require("Storage");

var alarms = s.readJSON("mralarm.json",1)||[];
alarms = alarms.sort((a,b)=>a.hr-b.hr);

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
    let txt = (alarm.on?"on  ":"off ")+formatTime(alarm.hr);
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

  let alarmNames = ['','Wake up','Bedtime','Glucose'];
  let nameIndex = 0;

  let daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  let onoff = ['Off','On'];
  
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
    }
  };

  // add toggles for each day of the week
  function addDay(day,i,weekDays) {
    menu[day] = {
      value: days[i],
      format: v=>onoff[v],
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
    var hr = hrs+(mins/60);

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
    s.write("mralarm.json",JSON.stringify(alarms));

    // tell widget the alarm file has changed
    WIDGETS["mralarm"].reload();
    
    showMainMenu();
  };
  if (!newAlarm) {
    menu["> Delete"] = function() {
      alarms.splice(alarmIndex,1);
      s.write("mralarm.json",JSON.stringify(alarms));

      // tell widget the alarm file has changed
      WIDGETS["mralarm"].reload();
      
      showMainMenu();
    };
  }
  menu['< Back'] = showMainMenu;
  return E.showMenu(menu);
}

showMainMenu();
