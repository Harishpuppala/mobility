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


/* ----------------------------- */
/* MAP INITIALIZATION */
/* ----------------------------- */

var map = L.map('map').setView([16.463261979207143, 80.50698185003442], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);


/* ----------------------------- */
/* BUGGY TRACKING SECTION */
/* ----------------------------- */

const markers = {};


/* Car icons */

const greenIcon = L.icon({
iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
iconSize: [38,38],
iconAnchor: [19,19]
});

const redIcon = L.icon({
iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744467.png",
iconSize: [38,38],
iconAnchor: [19,19]
});


const WARNING_LIMIT = 30000;
const OFFLINE_LIMIT = 40000;

const driversRef = firebase.database().ref("drivers");


function updateMap(){

const now = new Date();

document.getElementById("lastUpdate").innerText =
"Last updated: " + now.toLocaleTimeString("en-IN", {
timeZone: "Asia/Kolkata",
hour: "numeric",
minute: "numeric",
second: "numeric",
hour12: true
});

let activeCount = 0;


driversRef.once("value").then(function(snapshot){

snapshot.forEach(function(child){

const id = child.key;
const data = child.val();

const lat = data.lat;
const lng = data.lng;
const lastUpdate = data.time;

if(!lat || !lng || !lastUpdate) return;

const age = Date.now() - lastUpdate;


/* Remove offline buggy */

if(age > OFFLINE_LIMIT){

if(markers[id]){
map.removeLayer(markers[id]);
delete markers[id];
}

return;

}


/* Active buggy */

activeCount++;

let icon = greenIcon;

if(age > WARNING_LIMIT){
icon = redIcon;
}


/* Update marker */

if(markers[id]){

markers[id].setLatLng([lat,lng]);
markers[id].setIcon(icon);

}
else{

markers[id] = L.marker([lat,lng],{icon:icon})
.addTo(map)
.bindPopup("Buggy: "+id);

}

});


document.getElementById("activeBuggies").innerText =
"Active Buggies: " + activeCount;

});

}


/* Refresh every 5 seconds */

setInterval(updateMap, 5000);
updateMap();


/* ----------------------------- */
/* PASSENGER REQUEST SYSTEM */
/* ----------------------------- */


/* Block locations */

const blocks = {
CV_RAMAN: {name:"CV Raman", lat:16.4638, lng:80.5074},
SR_BLOCK: {name:"SR Block", lat:16.4631, lng:80.5063},
ADMIN: {name:"Admin", lat:16.4625, lng:80.5070},
X_LAB: {name:"X Lab", lat:16.4636, lng:80.5059},
JC_BOSE: {name:"JC Bose", lat:16.4642, lng:80.5068}
};


const requestMarkers = {};
const requestsRef = firebase.database().ref("requests");


/* Listen for demand updates */

requestsRef.on("value", function(snapshot){

snapshot.forEach(function(child){

const block = child.key;
const count = child.val().count || 0;

const info = blocks[block];
if(!info) return;


/* Update demand panel */

const element = document.getElementById("count_"+block);

if(element){
element.innerText = count;
}


/* Update map markers */

if(count > 0){

if(!requestMarkers[block]){

requestMarkers[block] = L.marker([info.lat,info.lng]).addTo(map);

}

requestMarkers[block].bindPopup(
"<b>"+info.name+"</b><br>Requests: "+count
);

}
else{

if(requestMarkers[block]){
map.removeLayer(requestMarkers[block]);
delete requestMarkers[block];
}

}

});

});


/* ----------------------------- */
/* PASSENGER REQUEST BUTTON */
/* ----------------------------- */

function requestBuggy(block){

const lastRequest = localStorage.getItem("lastBuggyRequest");

if(lastRequest){

const diff = Date.now() - lastRequest;

if(diff < 600000){

document.getElementById("requestStatus").innerText =
"You have already requested a buggy. Please wait 10 minutes.";

return;

}

}


/* Increase request count */

firebase.database()
.ref("requests/"+block+"/count")
.transaction(function(count){

if(count === null){
return 1;
}

return count + 1;

});


localStorage.setItem("lastBuggyRequest", Date.now());

document.getElementById("requestStatus").innerText =
"Your request has been sent. A buggy will arrive shortly.";

}


/* ----------------------------- */
/* DRIVER BOARDED BUTTON */
/* ----------------------------- */

function boarded(block){

firebase.database()
.ref("requests/"+block+"/count")
.transaction(function(count){

if(count > 0){
return count - 1;
}

});

}
