import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Default icon setup for markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MyMapComponent = () => {
  const [position, setPosition] = useState(null);

  // Example locations array
  const locations = [
    { lat: 23.800825, lng: 90.356745, description: "Mirpur 1, Dhaka" },
    { lat: 23.81, lng: 90.412, description: "Banani, Dhaka" },
    { lat: 23.78, lng: 90.279, description: "Dhamrai, Dhaka" },
    { lat: 23.795, lng: 90.404, description: "Mohammadpur, Dhaka" },
  ];

  useEffect(() => {
    // Get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  if (!position) {
    return <div>Loading...</div>; // Display loading message while waiting for location
  }

  return (
    <MapContainer
      center={position}
      zoom={12}
      style={{ height: "80vh", width: "80vw" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
  );
};

export default MyMapComponent;
