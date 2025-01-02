import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import WinningBids from './components/WinningBids';
import { LayoutDashboard, Award } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8 h-16">
          <Link
            to="/"
            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
              currentPath === '/'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <Link
            to="/winning-bids"
            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
              currentPath === '/winning-bids'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Award className="w-5 h-5 mr-2" />
            Winning Bids
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router basename="/pcc-gov-tw-dashboard">
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/winning-bids" element={<WinningBids />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;