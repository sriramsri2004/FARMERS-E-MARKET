
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout';
import Home from './pages/Home';
import Market from './pages/Market';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Prices from './pages/Prices';
import FarmerProducts from './pages/FarmerProducts';
import { AuthProvider } from './contexts/AuthContext';
import DatabaseMigrationInstructions from './components/DatabaseMigrationInstructions';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="market" element={<Market />} />
            <Route path="prices" element={<Prices />} />
            <Route path="products" element={<FarmerProducts />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
