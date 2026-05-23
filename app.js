const firebaseConfig = {
apiKey: "AIzaSyAvjtrYcKPdME8cClw2uUrspUldYXFw6B-g",
authDomain: "mobility-ca790.firebaseapp.com",
databaseURL: "https://mobility-ca790-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "mobility-ca790",
storageBucket: "mobility-ca790.firebasestorage.app",
messagingSenderId: "832491995447",
appId: "1:832491995447:web:9f5de3b844e3119f79ab2"
};

firebase.initializeApp(firebaseConfig);


/* ===================================================== */
/* AUTHENTICATION STATE */
/* ===================================================== */

let currentFacultyId = null;
let isAuthenticated = false;

/* Approved faculty IDs */

const APPROVED_FACULTY = [
"22295",
"22296",
"22297",
"22298",
"22299",
"23104",
"23019"
];


/* ===================================================== */
/* CHECK AUTH STATE */
/* ===================================================== */

function initializeFacultySession(){

const savedFaculty =
localStorage.getItem("facultyId");

const savedAuth =
localStorage.getItem("facultyAuthenticated");

if(
savedFaculty &&
savedAuth === "true" &&
APPROVED_FACULTY.includes(savedFaculty)
){

currentFacultyId = savedFaculty;
isAuthenticated = true;

console.log(
"Faculty authenticated:",
currentFacultyId
);

}
else{

isAuthenticated = false;
currentFacultyId = null;

}

}

initializeFacultySession();


/* ===================================================== */
/* FORCE FRESH DATA */
/* ===================================================== */

if ('serviceWorker' in navigator) {

navigator.serviceWorker
.getRegistrations()
.then(function(registrations) {

registrations.forEach(function(registration) {

registration.unregister();

});

});

}


/* ===================================================== */
/* MAP INITIALIZATION */
/* ===================================================== */

var map = L.map('map').setView(
[16.463261979207143, 80.50698185003442],
16
);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19
}
).addTo(map);


/* ===================================================== */
/* BUGGY TRACKING */
/* ===================================================== */

const markers = {};

/* Active buggy */

const greenIcon = L.icon({

iconUrl:
"https://cdn-icons-png.flaticon.com/512/744/744465.png",

iconSize:[38,38],
iconAnchor:[19,19]

});

/* Warning buggy */

const redIcon = L.icon({

iconUrl:
"https://cdn-icons-png.flaticon.com/512/744/744467.png",

iconSize:[38,38],
iconAnchor:[19,19]

});


/* Timing */

const WARNING_LIMIT = 30000;
const OFFLINE_LIMIT = 40000;

const driversRef =
firebase.database().ref("drivers");


/* ===================================================== */
/* UPDATE LIVE MAP */
/* ===================================================== */

function updateMap(){

const now = new Date();

/* Last updated */

document.getElementById("lastUpdate").innerText =
"Last updated: " +
now.toLocaleTimeString("en-IN",{
timeZone:"Asia/Kolkata",
hour:"numeric",
minute:"numeric",
second:"numeric",
hour12:true
});

let activeCount = 0;


/* Read drivers */

driversRef.once("value")
.then(function(snapshot){


/* Remove stale markers */

Object.keys(markers).forEach(function(id){

const exists = snapshot.hasChild(id);

if(!exists){

if(markers[id]){

map.removeLayer(markers[id]);

delete markers[id];

}

}

});


snapshot.forEach(function(child){

const id = child.key;
const data = child.val();

if(!data) return;

const lat = data.lat;
const lng = data.lng;
const lastUpdate = data.time;

if(!lat || !lng || !lastUpdate) return;

const age = Date.now() - lastUpdate;


/* Remove offline drivers */

if(age > OFFLINE_LIMIT){

firebase.database()
.ref("drivers/"+id)
.remove();

if(markers[id]){

map.removeLayer(markers[id]);

delete markers[id];

}

return;

}


/* Active */

activeCount++;

let icon = greenIcon;


/* Warning */

if(age > WARNING_LIMIT){

icon = redIcon;

}


/* Update marker */

if(markers[id]){

markers[id].setLatLng([lat,lng]);

markers[id].setIcon(icon);

}
else{

markers[id] = L.marker(
[lat,lng],
{icon:icon}
)
.addTo(map)
.bindPopup("<b>"+id+"</b>");

}

});


/* Active count */

document.getElementById("activeBuggies").innerText =
"Active Buggies: " + activeCount;

});


/* ===================================================== */
/* AUTO CLEAN INVALID / OLD REQUESTS */
/* ===================================================== */

firebase.database()
.ref("requests")
.once("value")
.then(function(snapshot){

snapshot.forEach(function(child){

const d = child.val();

if(!d){

firebase.database()
.ref("requests/"+child.key)
.remove();

return;

}

const count = d.count || 0;
const assignedTo = d.assignedTo || null;
const reqTime = d.time || 0;


/* Remove empty requests */

if(count <= 0){

firebase.database()
.ref("requests/"+child.key)
.remove();

return;

}


/* Remove requests older than 2 hours */

if(reqTime){

const age = Date.now() - reqTime;

if(age > 7200000){

firebase.database()
.ref("requests/"+child.key)
.remove();

return;

}

}


/* Remove old legacy requests without timestamp */

if(!reqTime){

firebase.database()
.ref("requests/"+child.key)
.remove();

return;

}


/* Remove invalid assignment */

if(assignedTo){

firebase.database()
.ref("drivers/"+assignedTo)
.once("value")
.then(function(driverSnap){

const driver = driverSnap.val();

if(!driver){

firebase.database()
.ref("requests/"+child.key+"/assignedTo")
.remove();

return;

}

const age = Date.now() - (driver.time || 0);

if(age > OFFLINE_LIMIT){

firebase.database()
.ref("requests/"+child.key+"/assignedTo")
.remove();

}

});

}

});

});


/* Refresh every 5 sec */

setInterval(updateMap,5000);

updateMap();


/* ===================================================== */
/* PASSENGER REQUEST SYSTEM */
/* ===================================================== */

const requestsRef =
firebase.database().ref("requests");


/* ===================================================== */
/* LIVE CLAIM STATUS */
/* ===================================================== */

requestsRef.on("value",function(snapshot){

let claimedMessage = "";

snapshot.forEach(function(child){

const data = child.val();

if(!data) return;

if(data.assignedTo){

claimedMessage +=
"🚗 " +
child.key.replaceAll("_"," ") +
" claimed by " +
data.assignedTo.toUpperCase() +
"<br>";

}

});


/* Show live claim message */

const statusBox =
document.getElementById("requestStatus");

if(claimedMessage !== ""){

statusBox.innerHTML = claimedMessage;

}

});


/* ===================================================== */
/* FACULTY AUTH CHECK */
/* ===================================================== */

function verifyFacultyAccess(){

if(!isAuthenticated){

document.getElementById("requestStatus").innerText =
"Faculty authentication required.";

return false;

}

if(!currentFacultyId){

document.getElementById("requestStatus").innerText =
"Invalid faculty session.";

return false;

}

if(!APPROVED_FACULTY.includes(currentFacultyId)){

document.getElementById("requestStatus").innerText =
"Faculty not authorized.";

return false;

}

return true;

}


/* ===================================================== */
/* PASSENGER REQUEST BUTTON */
/* ===================================================== */

function requestBuggy(block){

/* Faculty validation */

if(!verifyFacultyAccess()){

return;

}


const lastRequest =
localStorage.getItem(
"lastBuggyRequest_" + currentFacultyId
);


/* Prevent spam */

if(lastRequest){

const diff =
Date.now() - parseInt(lastRequest);


/* 10 minute lock */

if(diff < 600000){

document.getElementById("requestStatus").innerText =

"You already requested a buggy recently. Please wait a few minutes.";

return;

}

}


/* Safe increment */

firebase.database()
.ref("requests/"+block)
.transaction(function(data){

if(data === null){

return {

count:1,
assignedTo:null,
time:Date.now(),
facultyId:currentFacultyId

};

}


/* Keep assignment */

return {

count:(data.count || 0) + 1,
assignedTo:data.assignedTo || null,
time:Date.now(),
facultyId:currentFacultyId

};

});


/* Save local time */

localStorage.setItem(
"lastBuggyRequest_" + currentFacultyId,
Date.now()
);


/* Success */

document.getElementById("requestStatus").innerText =

"Request sent successfully from " +
block.replaceAll("_"," ") +
". Please wait for the buggy.";

}


/* ===================================================== */
/* FORCE HARD REFRESH ON BACK CACHE */
/* ===================================================== */

window.onpageshow = function(event){

if(event.persisted){

window.location.reload();

}

};
