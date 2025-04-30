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
        <section className="w-full max-w-6xl bg-white rounded-3xl shadow-lg p-4 border border-blue-200">
          <h2 className="text-3xl font-bold text-yellow-500 mb-4 text-center drop-shadow-sm">
            🗺️ View and Track Hazards
          </h2>
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Explore all reported hazards on the map. Tap on a marker to see
            details like type, image, and GPS coordinates.
          </p>
          <MyMapComponent />
        </section>

        <section className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-yellow-500 mb-3">
              📍 Report Road Hazards
            </h2>
            <p className="text-gray-600 text-lg">
              Choose your method to document road issues
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Camera Options Card */}
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-dashed border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 p-2 rounded-lg">📸</span>
                Media Capture
              </h3>
              <div className="space-y-4">
                <Link
                  to="/camera"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-800 px-6 py-4 rounded-lg transition-all border-2 border-blue-200 hover:border-blue-300 hover:shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  Take Photo
                </Link>
                <Link
                  to="/live"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-800 px-6 py-4 rounded-lg transition-all border-2 border-blue-200 hover:border-blue-300 hover:shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Start Live Recording
                </Link>
              </div>
            </div>

            {/* Upload Card */}
            <div className="bg-orange-50 p-6 rounded-xl border-2 border-dashed border-orange-200">
              <h3 className="text-xl font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <span className="bg-orange-100 p-2 rounded-lg">📁</span>
                File Upload
              </h3>
              <div className="space-y-4">
                <Upload />
                <p className="text-sm text-orange-700 text-center">
                  Supported formats: JPG, PNG, MP4 (Max 100MB)
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-4">
            All submissions are automatically geotagged and reviewed by our AI
            system
          </p>
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
