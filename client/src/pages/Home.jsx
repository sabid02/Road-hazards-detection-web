import MyMapComponent from "../components/MyMapComponent";
import Upload from "../components/Upload";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 px-4 py-10 md:px-8">
      {/* Header */}
      <header className="text-center mb-16 bg-yellow-400 p-10 md:p-16 rounded-3xl shadow-2xl max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
          🚧 Road Hazards Tracker
        </h1>
        <p className="mt-5 text-white text-md md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
          Help make your city safer by reporting potholes, cracks, and open
          manholes. Your report could prevent the next accident.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center gap-20 mt-10">
        {/* Map Section */}
        <section className="w-full max-w-6xl bg-white rounded-3xl shadow-lg p-10 border border-blue-200">
          <h2 className="text-3xl font-bold text-yellow-500 mb-4 text-center drop-shadow-sm">
            🗺️ View and Track Hazards
          </h2>
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Explore all reported hazards on the map. Tap on a marker to see
            details like type, image, and GPS coordinates.
          </p>
          <MyMapComponent />
        </section>

        {/* Upload Section */}
        <section className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-10 border border-blue-200">
          <h2 className="text-2xl font-bold text-yellow-500 text-center mb-4">
            📸 Upload or Capture Evidence
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Upload photos or videos of damaged roads. We'll detect hazards and
            tag their locations for you.
          </p>
          <div className="flex justify-center mb-6">
            <Link
              to="/camera"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-transform transform hover:scale-105 text-lg font-semibold shadow-md"
            >
              📷 Launch Camera
            </Link>
          </div>
          <Upload />
        </section>

        {/* Image Section */}
        <div className="relative mt-6 max-w-3xl mx-auto overflow-hidden rounded-3xl shadow-xl group">
          <img
            src="/cover1.jpg"
            alt="Road Hazards"
            className="w-full h-auto object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* Road Safety Section */}
        <section className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-10 border border-blue-200 mt-10">
          <h2 className="text-2xl font-bold text-yellow-500 text-center mb-4">
            🛣️ Importance of Road Safety
          </h2>
          <p className="text-gray-700 text-md leading-relaxed mb-4">
            Road safety is a shared responsibility that affects everyone. By
            adhering to traffic rules and being vigilant, we can significantly
            reduce accidents and save lives. Key practices include:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Always wear seat belts and ensure passengers do the same.</li>
            <li>Obey speed limits and traffic signals.</li>
            <li>Avoid distractions such as mobile phones while driving.</li>
            <li>Never drive under the influence of alcohol or drugs.</li>
            <li>Use pedestrian crossings and be alert as a pedestrian.</li>
          </ul>
          <p className="text-gray-700 text-md leading-relaxed">
            By following these guidelines, we contribute to a safer environment
            for all road users. Let's work together to make our roads safer and
            more reliable.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-20 mb-6">
        &copy; {new Date().getFullYear()}{" "}
        <span className="font-semibold text-yellow-500">
          Road Hazards Tracker
        </span>
        . Built with <span className="text-red-500">❤️</span> for safer streets.
      </footer>
    </div>
  );
};

export default Home;
