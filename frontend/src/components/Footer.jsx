function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              <a href="/" className="text-xl font-medium text-gray-100">
                <img src="/logo.png" alt="ReCycle" className="h-10 w-10 inline-block" />
                Re
                <span className="font-bold text-gray-200">Cycle</span>
              </a>
            </h3>
            <p className="text-gray-300">
              The marketplace for pre-owned bicycles. Find your perfect ride or give your bike a new life with our cycling community.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/products" className="text-gray-300 hover:text-white">
                  Products
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-300 hover:text-white">
                  Profile
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-white">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="text-gray-300 space-y-2">
              <p>📧 support@recycle.dk</p>
              <p>📞 (+45) 5545 6677</p>
              <p>📍 Guldbergsgade 29n, Copenhagen, Denmark</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">© {new Date().getFullYear()} ReCycle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
