import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

// Set default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MyMapComponent = () => {
  const [position, setPosition] = useState(null);

  const locations = [
    { lat: 23.828553, lng: 90.370353, description: "Soadul, Dhaka" },
    { lat: 23.794052, lng: 90.353548, description: "Pothole, Dhaka" },
    { lat: 23.78, lng: 90.279, description: "Dhamrai, Dhaka" },
    { lat: 23.695197, lng: 90.418225, description: "Soadul tour, Dhaka" },
    {
      lat: 23.727357299999998,
      lng: 90.4195674,
      description: "Zurin's Office, Dhaka",
    },
    {
      lat: 23.8092,
      lng: 90.3709,
      description: "Sabid home, Dhaka",
    },
  ];

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

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
        Pothole, Cracks and Open manhole Locations Map
      </h2>
      <div className="w-full max-w-6xl h-[75vh] md:h-[80vh] rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <MapContainer center={position} zoom={12} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={position}>
            <Popup>Your Current Location</Popup>
          </Marker>
          {locations.map((loc, index) => (
            <Marker key={index} position={[loc.lat, loc.lng]}>
              <Popup>{loc.description}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MyMapComponent;
