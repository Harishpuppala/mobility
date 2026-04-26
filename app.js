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


/* Initialize map */

var map = L.map('map').setView([16.463261979207143, 80.50698185003442], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);


/* Marker storage */

const markers = {};


/* Marker icons */

const greenIcon = new L.Icon({
iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
iconSize:[25,41],
iconAnchor:[12,41],
popupAnchor:[1,-34],
shadowSize:[41,41]
});

const redIcon = new L.Icon({
iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
iconSize:[25,41],
iconAnchor:[12,41],
popupAnchor:[1,-34],
shadowSize:[41,41]
});


const WARNING_LIMIT = 30000;
const OFFLINE_LIMIT = 40000;


/* Firebase reference */

const driversRef = firebase.database().ref("drivers");


function updateMap(){

/* Update IST timestamp */

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


/* Determine marker color */

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


/* Update active buggy counter */

document.getElementById("activeBuggies").innerText =
"Active Buggies: " + activeCount;

});

}


/* Update every 5 seconds */

setInterval(updateMap, 5000);


/* Initial load */

updateMap();
