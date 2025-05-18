
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="mt-5 min-h-screen bg-farmer-50">
      {/* Hero Section */}
      <section className="relative py-16 md:py-32 bg-gradient-to-br from-farmer-50 to-farmer-100 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Farm Fresh to <br />Local Market
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-lg">
                Connect directly with local farmers. Cut out the middleman. Support sustainable agriculture and get the freshest produce at the best prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/market">
                  <Button className="bg-farmer-700 hover:bg-farmer-800 text-white px-8 py-6 rounded-md flex items-center">
                    Explore Market
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="border-farmer-600 text-farmer-700 hover:bg-farmer-50 px-8 py-6 rounded-md">
                    Join Today
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-64 md:h-96 lg:h-full rounded-3xl overflow-hidden shadow-2xl animate-scale-in transform hover:scale-105 transition-transform duration-500">
              <img src="/lovable-uploads/banner.jpg" alt="Fresh vegetables collage" className="w-full h-full object-cover rounded-3xl bg-gradient-to-br from-white to-farmer-50" />
            </div>
          </div>
        </div>
        {/* Background pattern */}
       <div className="absolute inset-0 opacity-40">
          <img src="/lovable-uploads/bg.png" alt="Fresh vegetables collage" className="w-full h-full object-cover rounded-3xl bg-gradient-to-br from-white to-farmer-50" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Choose Farmers E-Market</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We connect farmers directly to consumers, creating a transparent marketplace that benefits everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-farmer-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-farmer-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-farmer-700">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10h-2"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fresh & Local</h3>
              <p className="text-gray-600">All produce comes directly from verified local farmers in your region, ensuring maximum freshness.</p>
            </div>
            
            <div className="bg-farmer-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-farmer-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-farmer-700">
                  <path d="M20 7h-9"/>
                  <path d="M14 17H5"/>
                  <circle cx="17" cy="17" r="3"/>
                  <circle cx="7" cy="7" r="3"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fair Pricing</h3>
              <p className="text-gray-600">By eliminating middlemen, farmers earn more while consumers pay less for higher quality produce.</p>
            </div>
            
            <div className="bg-farmer-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="bg-farmer-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-farmer-700">
                  <path d="M2 12h20"/>
                  <path d="M12 2v20"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Prices</h3>
              <p className="text-gray-600">Track live market prices to make informed buying and selling decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-farmer-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to join our growing community?</h2>
          <p className="text-lg text-farmer-100 max-w-2xl mx-auto mb-8">
            Whether you're a farmer looking to sell your produce or a buyer seeking fresh local food, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register?role=farmer">
              <Button className="bg-white text-farmer-700 hover:bg-farmer-100 px-8 py-6 rounded-md">
                Join as a Farmer
              </Button>
            </Link>
            <Link to="/register?role=buyer">
              <Button className="bg-farmer-600 hover:bg-farmer-800 text-white px-8 py-6 rounded-md">
                Join as a Buyer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
