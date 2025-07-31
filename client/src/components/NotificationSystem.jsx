import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";

const NotificationSystem = () => {
  const [counts, setCounts] = useState({
    openManhole: 0,
    potholes: 0,
    cracks: 0,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("http://localhost:8000/locations/");
        const data = await response.json();
        console.log("Fetched locations:", data);

        // Count detections for each class
        const openManholeCount = data.filter(
          (detection) =>
            detection.class_id === 2 ||
            detection.class_name.toLowerCase() === "open manhole"
        ).length;

        const potholesCount = data.filter(
          (detection) => detection.class_name.toLowerCase() === "pothole"
        ).length;

        const cracksCount = data.filter(
          (detection) => detection.class_name.toLowerCase() === "cracks"
        ).length;

        setCounts({
          openManhole: openManholeCount,
          potholes: potholesCount,
          cracks: cracksCount,
        });
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchLocations, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-10">
      <div className="flex items-center space-x-2">
        <h1 className="text-sm">Open Manholes</h1>
        <div className="flex items-center space-x-1">
          <Bell className="w-6 h-6 text-red-600 cursor-pointer hover:text-red-800" />
          <AlertTriangle className="w-4 h-4 text-red-600" title="Urgent" />
        </div>
        {counts.openManhole > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {counts.openManhole}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <h1 className="text-sm">Potholes</h1>
        <Bell className="w-6 h-6 text-blue-600 cursor-pointer hover:text-blue-800" />
        {counts.potholes > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {counts.potholes}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <h1 className="text-sm">Cracks</h1>
        <Bell className="w-6 h-6 text-green-600 cursor-pointer hover:text-green-800" />
        {counts.cracks > 0 && (
          <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {counts.cracks}
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;
