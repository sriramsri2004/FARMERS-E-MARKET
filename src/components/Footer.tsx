
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-farmer-50 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Farmers E-Market</h3>
            <p className="text-gray-600 text-sm">
              Connecting farmers directly with local market buyers, reducing the influence of middlemen and ensuring better prices for everyone.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 text-sm hover:text-farmer-700">Home</Link></li>
              <li><Link to="/market" className="text-gray-600 text-sm hover:text-farmer-700">Market</Link></li>
              <li><Link to="/prices" className="text-gray-600 text-sm hover:text-farmer-700">Live Prices</Link></li>
              <li><Link to="/about" className="text-gray-600 text-sm hover:text-farmer-700">About Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">For Users</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-gray-600 text-sm hover:text-farmer-700">Register</Link></li>
              <li><Link to="/login" className="text-gray-600 text-sm hover:text-farmer-700">Login</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 text-sm hover:text-farmer-700">Dashboard</Link></li>
              <li><Link to="/help" className="text-gray-600 text-sm hover:text-farmer-700">Help & Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: contact@farmmarket.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Farm Road, Countryside, CA 94123</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Farmers E-Market. All rights reserved.</p>
          <div className="flex items-center mt-4 md:mt-0">
            <p className="text-sm text-gray-600">Made with</p>
            <svg className="w-4 h-4 mx-1 text-farmer-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-gray-600">for farmers everywhere</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
