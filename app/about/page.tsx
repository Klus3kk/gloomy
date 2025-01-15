export default function About() {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">About Gloomy</h1>
        <p className="text-lg max-w-2xl mx-auto mb-6">
          Gloomy is the ultimate file downloading platform designed to ensure secure,
          organized, and seamless downloads for everyone. With cutting-edge technology,
          Gloomy is here to revolutionize how you manage and access files.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Blazing Fast Downloads</h2>
            <p>Experience unparalleled speed with Gloomy’s optimized file delivery system.</p>
          </div>
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Secure Platform</h2>
            <p>Your files are encrypted and safe from unauthorized access.</p>
          </div>
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Global Reach</h2>
            <p>Access your files from anywhere in the world, 24/7.</p>
          </div>
        </div>
      </div>
    );
  }
  