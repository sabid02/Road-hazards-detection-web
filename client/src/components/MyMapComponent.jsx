import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

// Default icon setup for markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const positions = [
  { lat: 23.806, lng: 90.368, description: "Mirpur 1, Dhaka" },
  { lat: 23.81, lng: 90.412, description: "Banani, Dhaka" },
  { lat: 23.78, lng: 90.279, description: "Dhamrai, Dhaka" },
  { lat: 23.795, lng: 90.404, description: "Mohammadpur, Dhaka" },
];

const MyMapComponent = () => {
  return (
    <MapContainer
      center={[23.806, 90.368]}
      zoom={12}
      style={{ height: "1000px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {positions.map((position, index) => (
        <Marker key={index} position={[position.lat, position.lng]}>
          <Popup>{position.description}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MyMapComponent;
