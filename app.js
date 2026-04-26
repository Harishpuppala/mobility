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

/* Initialize Map */

var map = L.map('map').setView([16.463261979207143, 80.5069818500344], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19
}).addTo(map);

/* Store buggy markers */

const markers = {};

/* Firebase reference */

const driversRef = firebase.database().ref("drivers");

/* Listen for live updates */

driversRef.on("value", function(snapshot){

    snapshot.forEach(function(child){

        const id = child.key;
        const data = child.val();

        const lat = data.lat;
        const lng = data.lng;

        if(!lat || !lng) return;

        /* Update marker if already exists */

        if(markers[id]){

            markers[id].setLatLng([lat,lng]);

        } 
        else {

            /* Create new marker */

            markers[id] = L.marker([lat,lng])
            .addTo(map)
            .bindPopup("Buggy: " + id);

        }

    });

});
