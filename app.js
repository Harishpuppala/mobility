const firebaseConfig = {

apiKey: "AIzaSyAvjtrYcKPdME8cClw2uUrspUldYXFw6B-g",
authDomain: "mobility-ca790.firebaseapp.com",
databaseURL: "https://mobility-ca790-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "mobility-ca790",
storageBucket: "mobility-ca790.firebasestorage.app",
messagingSenderId: "832491995447",
appId: "1:832491995447:web:9f5de3b844e3119f79ab2"

};


/* ===================================================== */
/* FIREBASE INIT */
/* ===================================================== */

if (!firebase.apps.length) {

firebase.initializeApp(firebaseConfig);

}


/* ===================================================== */
/* GLOBAL AUTH STATE */
/* ===================================================== */

let currentFacultyId = null;

let isAuthenticated = false;


/* ===================================================== */
/* SESSION SETTINGS */
/* ===================================================== */

const FACULTY_SESSION_TIMEOUT = 3600000;

const WARNING_LIMIT = 30000;

const OFFLINE_LIMIT = 40000;


/* ===================================================== */
/* DATABASE REFERENCES */
/* ===================================================== */

const db = firebase.database();

const driversRef =
db.ref("drivers");

const requestsRef =
db.ref("requests");

const facultyAuthRef =
db.ref("facultyAuth");


/* ===================================================== */
/* REMOVE SERVICE WORKERS */
/* ===================================================== */

if ('serviceWorker' in navigator) {

navigator.serviceWorker
.getRegistrations()
.then(function(registrations){

registrations.forEach(function(registration){

registration.unregister();

});

});

}


/* ===================================================== */
/* SESSION RESTORE */
/* ===================================================== */

function initializeFacultySession(){

const savedFaculty =
localStorage.getItem("facultyId");

const savedAuth =
localStorage.getItem("facultyAuthenticated");


if(!savedFaculty || savedAuth !== "true"){

currentFacultyId = null;

isAuthenticated = false;

return;

}


/* Validate with Firebase */

facultyAuthRef
.child(savedFaculty)
.once("value")

.then(function(snapshot){

const data = snapshot.val();

if(!data){

localStorage.clear();

return;

}


const age =
Date.now() - (data.lastLogin || 0);


/* Reset stale sessions */

if(age > FACULTY_SESSION_TIMEOUT){

facultyAuthRef
.child(savedFaculty)
.update({

loggedIn:false

});

localStorage.clear();

return;

}


/* Restore valid session */

if(data.loggedIn){

currentFacultyId =
savedFaculty;

isAuthenticated =
true;

}

})

.catch(function(error){

console.error(
"Session restore error:",
error
);

});

}

initializeFacultySession();


/* ===================================================== */
/* MAP */
/* ===================================================== */

var map = null;

const markers = {};


/* ===================================================== */
/* INITIALIZE MAP */
/* ===================================================== */

function initializeMap(){

if(map){

return;

}


const mapElement =
document.getElementById("map");


if(!mapElement){

console.error(
"Map container not found"
);

return;

}


/* Create map */

map = L.map("map",{

preferCanvas:true,
zoomControl:true

}).setView(

[16.463261979207143,
80.50698185003442],

16

);


/* OpenStreetMap */

L.tileLayer(

'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

{

maxZoom:19,
attribution:'© OpenStreetMap'

}

).addTo(map);


/* Important fix */

setTimeout(function(){

map.invalidateSize(true);

updateMap();

},1000);

}


/* ===================================================== */
/* BUGGY ICONS */
/* ===================================================== */

const greenIcon = L.icon({

iconUrl:
"https://cdn-icons-png.flaticon.com/512/744/744465.png",

iconSize:[38,38],

iconAnchor:[19,19]

});


const redIcon = L.icon({

iconUrl:
"https://cdn-icons-png.flaticon.com/512/744/744467.png",

iconSize:[38,38],

iconAnchor:[19,19]

});


/* ===================================================== */
/* UPDATE MAP */
/* ===================================================== */

function updateMap(){

const now = new Date();


/* Update time */

const lastUpdateElement =
document.getElementById("lastUpdate");

if(lastUpdateElement){

lastUpdateElement.innerText =

"Last updated: " +

now.toLocaleTimeString("en-IN",{

timeZone:"Asia/Kolkata",
hour:"numeric",
minute:"numeric",
second:"numeric",
hour12:true

});

}


/* Active count */

let activeCount = 0;


/* Get drivers */

driversRef
.once("value")

.then(function(snapshot){


/* Remove old markers */

Object.keys(markers).forEach(function(id){

if(!snapshot.hasChild(id)){

if(markers[id] && map){

map.removeLayer(markers[id]);

}

delete markers[id];

}

});


/* Process drivers */

snapshot.forEach(function(child){

const id = child.key;

const data = child.val();


if(!data){

return;

}


const lat = data.lat;

const lng = data.lng;

const lastTime = data.time;


if(!lat || !lng || !lastTime){

return;

}


const age =
Date.now() - lastTime;


/* Remove offline drivers */

if(age > OFFLINE_LIMIT){

driversRef
.child(id)
.remove();

if(markers[id] && map){

map.removeLayer(markers[id]);

delete markers[id];

}

return;

}


/* Active buggy */

activeCount++;

let icon = greenIcon;


/* Warning */

if(age > WARNING_LIMIT){

icon = redIcon;

}


/* Add marker */

if(map){

if(markers[id]){

markers[id]
.setLatLng([lat,lng]);

markers[id]
.setIcon(icon);

}
else{

markers[id] =

L.marker(
[lat,lng],
{icon:icon}
)

.addTo(map)

.bindPopup(

"<b>" +
id.toUpperCase() +
"</b>"

);

}

}

});


/* Update active buggy count */

const activeElement =
document.getElementById("activeBuggies");

if(activeElement){

activeElement.innerText =

"Active Buggies: " +
activeCount;

}

})

.catch(function(error){

console.error(
"Driver fetch error:",
error
);

});

}


/* ===================================================== */
/* CLEAN REQUESTS */
/* ===================================================== */

function cleanRequests(){

requestsRef
.once("value")

.then(function(snapshot){

snapshot.forEach(function(child){

const d = child.val();


if(!d){

requestsRef
.child(child.key)
.remove();

return;

}


const count =
d.count || 0;

const assignedTo =
d.assignedTo || null;

const reqTime =
d.time || 0;


/* Remove empty */

if(count <= 0){

requestsRef
.child(child.key)
.remove();

return;

}


/* Remove old requests */

if(reqTime){

const age =
Date.now() - reqTime;

if(age > 7200000){

requestsRef
.child(child.key)
.remove();

return;

}

}


/* Remove legacy */

if(!reqTime){

requestsRef
.child(child.key)
.remove();

return;

}


/* Validate assigned buggy */

if(assignedTo){

driversRef
.child(assignedTo)
.once("value")

.then(function(driverSnap){

const driver =
driverSnap.val();

if(!driver){

requestsRef
.child(child.key)
.child("assignedTo")
.remove();

return;

}


const age =
Date.now() -
(driver.time || 0);


if(age > OFFLINE_LIMIT){

requestsRef
.child(child.key)
.child("assignedTo")
.remove();

}

});

}

});

});

}

cleanRequests();


/* ===================================================== */
/* LIVE CLAIM STATUS */
/* ===================================================== */

requestsRef.on("value",function(snapshot){

let claimedMessage = "";


snapshot.forEach(function(child){

const data = child.val();

if(!data){

return;

}


if(data.assignedTo){

claimedMessage +=

"🚗 " +

child.key.replaceAll("_"," ") +

" claimed by " +

data.assignedTo.toUpperCase() +

"<br>";

}

});


const statusBox =
document.getElementById("requestStatus");


if(statusBox){

if(claimedMessage !== ""){

statusBox.innerHTML =
claimedMessage;

}

}

});


/* ===================================================== */
/* VERIFY FACULTY */
/* ===================================================== */

function verifyFacultyAccess(){

if(!isAuthenticated){

document.getElementById("requestStatus")
.innerText =

"Faculty authentication required.";

return false;

}


if(!currentFacultyId){

document.getElementById("requestStatus")
.innerText =

"Invalid faculty session.";

return false;

}


return true;

}


/* ===================================================== */
/* REQUEST BUGGY */
/* ===================================================== */

function requestBuggy(block){

if(!verifyFacultyAccess()){

return;

}


/* Prevent spam */

const lastRequest =

localStorage.getItem(

"lastBuggyRequest_" +
currentFacultyId

);


if(lastRequest){

const diff =

Date.now() -
parseInt(lastRequest);


if(diff < 600000){

document.getElementById("requestStatus")
.innerText =

"You already requested recently.";

return;

}

}


/* Save request */

requestsRef
.child(block)

.transaction(function(data){

if(data === null){

return {

count:1,
assignedTo:null,
time:Date.now(),
facultyId:currentFacultyId

};

}


/* Increment */

return {

count:(data.count || 0) + 1,

assignedTo:
data.assignedTo || null,

time:Date.now(),

facultyId:currentFacultyId

};

});


/* Save cooldown */

localStorage.setItem(

"lastBuggyRequest_" +
currentFacultyId,

Date.now()

);


/* Status */

document.getElementById("requestStatus")
.innerText =

"Request sent from " +

block.replaceAll("_"," ") +

". Please wait for the buggy.";

}


/* ===================================================== */
/* AUTO REFRESH */
/* ===================================================== */

setInterval(function(){

updateMap();

},5000);


/* ===================================================== */
/* HEARTBEAT */
/* ===================================================== */

setInterval(function(){

if(
isAuthenticated &&
currentFacultyId
){

facultyAuthRef
.child(currentFacultyId)
.update({

lastLogin:Date.now()

});

}

},60000);


/* ===================================================== */
/* FORCE REFRESH */
/* ===================================================== */

window.onpageshow = function(event){

if(event.persisted){

window.location.reload();

}

};
