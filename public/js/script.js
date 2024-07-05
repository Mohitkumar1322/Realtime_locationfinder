const socket = io(); // Connect to socket.io server

// Initialize the map and set its view to an initial location
const map = L.map("map").setView([0, 0], 2); // Initial view at [0, 0] with zoom level 2

// Add OpenStreetMap tiles to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Object to store markers for different users
const markers = {};

// Array to store coordinates of users
let userCoordinates = [];

// Event listener for receiving location updates from socket.io server
socket.on('updateLocation', function(data) {
    const { id, latitude, longitude } = data;

    console.log(`Received location update for ${id}: [${latitude}, ${longitude}]`);

    // Update the map view to the new coordinates
    map.setView([latitude, longitude], 13); // Zoom level 13 (adjust as needed)

    // Check if a marker for this user already exists
    if (markers[id]) {
        // Move the existing marker to the new coordinates
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // Create a new marker for this user and store it
        markers[id] = L.marker([latitude, longitude]).addTo(map)
            .bindPopup("User is here")
            .openPopup();
    }

    // Update userCoordinates array
    userCoordinates = Object.values(markers).map(marker => marker.getLatLng());

    // If there are exactly two users, find and display the shortest path between them
    if (userCoordinates.length === 2) {
        displayShortestPath(userCoordinates);
    }
});

// Function to display the shortest path between two points
function displayShortestPath(coords) {
    const [start, end] = coords;
    console.log(`Displaying route between: ${start} and ${end}`);

    // Clear any existing route
    if (window.routeControl) {
        map.removeControl(window.routeControl);
    }

    // Create a new route control
    window.routeControl = L.Routing.control({
        waypoints: [start, end],
        routeWhileDragging: false
    }).addTo(map);
}

// Geolocation watch to continuously send user's location to server
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(function(position) {
        const { latitude, longitude } = position.coords;
        socket.emit('sendLocation', { latitude, longitude }); // Emit location data to server
    }, function(error) {
        console.log(error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
} else {
    console.log("Geolocation is not supported by this browser.");
}

socket.on('removeMarker', function(id) {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];

        // Update userCoordinates array
        userCoordinates = Object.values(markers).map(marker => marker.getLatLng());

        // If there are exactly two users, find and display the shortest path between them
        if (userCoordinates.length === 2) {
            displayShortestPath(userCoordinates);
        } else {
            // Clear any existing route if less than two users
            if (window.routeControl) {
                map.removeControl(window.routeControl);
            }
        }
    }
});
