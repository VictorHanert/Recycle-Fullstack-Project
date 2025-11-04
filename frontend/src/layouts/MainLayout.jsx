import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";

function MainLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navigation Bar */}
        <Navbar user={user} isAuthenticated={isAuthenticated} onLogout={logout} />

        {/* Main content */}
        <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
            {children}
        </main>
        
        {/* Footer */}
        <Footer />
    </div>
  );
}

export default MainLayout;
