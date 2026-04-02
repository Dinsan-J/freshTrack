import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BarcodeScanner from './pages/BarcodeScanner';
import AddProduct from './pages/AddProduct';
import Notifications from './components/Notifications';

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-20 md:pb-0 font-sans relative">
        <Navbar />
        <Notifications />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-32 min-h-[calc(100vh-80px)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<BarcodeScanner />} />
            <Route path="/add" element={<AddProduct />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
