//  src/Pages/shop/MyListings.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyListings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-8">Please login to manage your listings</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-lime-500 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-lime-400">My Listings</span>
          </h1>
          <p className="text-xl text-gray-300">Manage your products</p>
        </div>

        <div className="flex justify-end mb-8">
          <Link
            to="/shop/submit"
            className="bg-lime-500 text-white px-6 py-2 rounded-xl font-semibold"
          >
            Add New Listing
          </Link>
        </div>

        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
          <p className="text-gray-400 mb-6">Start by creating your first listing</p>
          <Link
            to="/shop/submit"
            className="bg-lime-500 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Create First Listing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyListings;
