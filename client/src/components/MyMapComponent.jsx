import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const currentLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon.Default();

const MyMapComponent = () => {
  const [position, setPosition] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("http://localhost:8000/locations/");
        const data = await response.json();
        console.log("Fetched locations:", data);
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  if (!position) {
    return (
      <div className="text-center mt-10 text-lg text-gray-700">
        Loading map and location...
      </div>
    );
  }

  const getIconByClassName = (className) => {
    if (className.toLowerCase() === "pothole") {
      return redIcon;
    } else if (className.toLowerCase() === "crack") {
      return blueIcon;
    } else if (className.toLowerCase() === "open manhole") {
      return greenIcon;
    } else {
      return defaultIcon;
    }
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        🚧 Pothole, Crack, and Open Manhole Locations Map
      </h2>
      <div className="w-full sm:max-w-6xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300 px-2 sm:px-0">
        {position ? (
          <MapContainer
            center={position}
            zoom={12}
            className="h-full w-full rounded-2xl"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={position} icon={currentLocationIcon}>
              <Popup>You are here 📍</Popup>
            </Marker>

            {locations
              .filter(
                (loc) =>
                  loc.location &&
                  loc.location.latitude != null &&
                  loc.location.longitude != null
              )
              .map((loc, index) => (
                <Marker
                  key={index}
                  position={[loc.location.latitude, loc.location.longitude]}
                  icon={getIconByClassName(loc.class_name)}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-semibold capitalize">
                        {loc.class_name}
                      </h3>
                      <p className="text-gray-600">
                        Latitude: {loc.location.latitude.toFixed(4)}
                      </p>
                      <p className="text-gray-600">
                        Longitude: {loc.location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        ) : (
          <div className="text-center mt-10 text-lg text-gray-700">
            Loading map and location...
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMapComponent;
