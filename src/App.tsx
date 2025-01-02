import { useState } from 'react';
import Dashboard from './components/Dashboard';
import WinningBids from './components/WinningBids';
import { LayoutDashboard, Award } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'winning-bids'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 h-16">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'dashboard'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('winning-bids')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'winning-bids'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Award className="w-5 h-5 mr-2" />
              Winning Bids
            </button>
          </div>
        </div>
      </nav>

      {currentView === 'dashboard' ? <Dashboard /> : <WinningBids />}
    </div>
  );
}

export default App;