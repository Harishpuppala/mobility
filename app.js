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
/* MAP INITIALIZATION */
/* ===================================================== */

var map = L.map('map').setView([16.463261979207143, 80.50698185003442], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);


/* ===================================================== */
/* BUGGY TRACKING */
/* ===================================================== */

const markers = {};

const greenIcon = L.icon({
iconUrl:"https://cdn-icons-png.flaticon.com/512/744/744465.png",
iconSize:[38,38],
iconAnchor:[19,19]
});

const redIcon = L.icon({
iconUrl:"https://cdn-icons-png.flaticon.com/512/744/744467.png",
iconSize:[38,38],
iconAnchor:[19,19]
});

const WARNING_LIMIT = 30000;
const OFFLINE_LIMIT = 40000;

const driversRef = firebase.database().ref("drivers");


function updateMap(){

const now = new Date();

document.getElementById("lastUpdate").innerText =
"Last updated: " + now.toLocaleTimeString("en-IN",{
timeZone:"Asia/Kolkata",
hour:"numeric",
minute:"numeric",
second:"numeric",
hour12:true
});

let activeCount = 0;

driversRef.once("value").then(function(snapshot){

snapshot.forEach(function(child){

const id = child.key;
const data = child.val();

if(!data) return;

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

activeCount++;

let icon = greenIcon;

if(age > WARNING_LIMIT){
icon = redIcon;
}


/* Update marker */

if(markers[id]){

markers[id].setLatLng([lat,lng]);
markers[id].setIcon(icon);

}else{

markers[id] = L.marker([lat,lng],{icon:icon})
.addTo(map)
.bindPopup("<b>"+id+"</b>");

}

});

document.getElementById("activeBuggies").innerText =
"Active Buggies: " + activeCount;

});

}

setInterval(updateMap,5000);
updateMap();


/* ===================================================== */
/* PASSENGER REQUEST SYSTEM */
/* ===================================================== */

const requestsRef = firebase.database().ref("requests");

/* ❌ NO MAP MARKERS FOR REQUESTS */

/* Just listen (optional, but no UI action needed) */

requestsRef.on("value",function(snapshot){
/* intentionally empty */
});


/* ===================================================== */
/* PASSENGER REQUEST BUTTON */
/* ===================================================== */

function requestBuggy(block){

const lastRequest = localStorage.getItem("lastBuggyRequest");

if(lastRequest){

const diff = Date.now() - lastRequest;

if(diff < 600000){

document.getElementById("requestStatus").innerText =
"You already requested a buggy. Please wait a few minutes.";

return;

}

}


/* Safe request increment */

firebase.database()
.ref("requests/"+block)
.transaction(function(data){

if(data === null){
return {count:1};
}

return {count:(data.count || 0) + 1};

});


localStorage.setItem("lastBuggyRequest",Date.now());

document.getElementById("requestStatus").innerText =
"Request sent successfully. A buggy will arrive soon.";

}
