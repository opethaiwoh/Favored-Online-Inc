import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const DigitalProducts = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-blue-400">Digital Products</span>
          </h1>
          <p className="text-xl text-gray-300">
            eBooks, templates, AI prompts & dev tools
          </p>
        </div>

        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">Products loading...</p>
        </div>
      </div>
    </div>
  );
};

export const Courses = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-purple-400">Courses & Learning</span>
          </h1>
          <p className="text-xl text-gray-300">
            Bootcamps, courses & learning programs
          </p>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">Courses section is under construction</p>
          <Link 
            to="/shop" 
            className="inline-block mt-6 bg-purple-500 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Jobs = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-green-400">Jobs & Projects</span>
          </h1>
          <p className="text-xl text-gray-300">
            Remote jobs, freelance projects & startup opportunities
          </p>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">Jobs section is under construction</p>
        </div>
      </div>
    </div>
  );
};

export const Hardware = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-orange-400">Tech Hardware</span>
          </h1>
          <p className="text-xl text-gray-300">
            Dev kits, productivity gear & equipment
          </p>
        </div>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">Hardware section is under construction</p>
        </div>
      </div>
    </div>
  );
};

export default DigitalProducts;
