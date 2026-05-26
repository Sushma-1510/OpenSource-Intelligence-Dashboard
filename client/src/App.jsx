import React from 'react';
import { DashboardProvider } from './context/DashboardContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <DashboardProvider>
      <div className="min-h-screen pb-16 transition-colors duration-300 bg-background-light dark:bg-background-dark">
        {/* Top Navigation */}
        <Navbar />
        
        {/* Main Dashboard Layout */}
        <Dashboard />
      </div>
    </DashboardProvider>
  );
}

export default App;
