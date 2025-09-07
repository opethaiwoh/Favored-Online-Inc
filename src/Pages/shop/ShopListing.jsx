// Pages/shop/MyListings.jsx - Vendor dashboard to manage listings
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MyListings = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalClicks: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (currentUser) {
      loadUserListings();
    }
  }, [currentUser]);

  const loadUserListings = async () => {
    try {
      // Simulate API call to fetch user's listings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockListings = [
        {
          id: 1,
          title: "React Developer Roadmap 2025",
          category: "Digital Products",
          type: "eBooks",
          price: "$29.99",
          status: "active",
          featured: true,
          views: 1250,
          clicks: 89,
          revenue: 435.84,
          createdAt: "2024-01-15",
          image: "/Images/shop/ebook-react.jpg",
          link: "https://gumroad.com/l/react-roadmap-2025"
        },
        {
          id: 2,
          title: "Notion Productivity Template",
          category: "Digital Products",
          type: "Templates",
          price: "$19.99",
          status: "active",
          featured: false,
          views: 845,
          clicks: 62,
          revenue: 279.72,
          createdAt: "2024-01-10",
          image: "/Images/shop/notion-template.jpg",
          link: "https://gumroad.com/l/notion-template"
        },
        {
          id: 3,
          title: "AI Prompts for Developers",
          category: "Digital Products",
          type: "AI Prompts",
          price: "$14.99",
          status: "pending",
          featured: false,
          views: 0,
          clicks: 0,
          revenue: 0,
          createdAt: "2024-01-20",
          image: "/Images/shop/ai-prompts.jpg",
          link: "https://gumroad.com/l/ai-prompts"
        }
      ];

      setListings(mockListings);
      
      // Calculate stats
      const totalViews = mockListings.reduce((sum, listing) => sum + listing.views, 0);
      const totalClicks = mockListings.reduce((sum, listing) => sum + listing.clicks, 0);
      const totalRevenue = mockListings.reduce((sum, listing) => sum + listing.revenue, 0);
      
      setStats({
        totalListings: mockListings.length,
        activeListings: mockListings.filter(l => l.status === 'active').length,
        totalViews,
        totalClicks,
        revenue: totalRevenue
      });
      
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'paused': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleToggleFeatured = async (listingId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setListings(prev => prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, featured: !listing.featured }
          : listing
      ));
      
      toast.success('Featured status updated!');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const filteredListings = activeTab === 'all' 
    ? listings 
    : listings.filter(listing => listing.status === activeTab);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🔒 Access Denied</h1>
          <p className="text-gray-300 mb-8">Please login to manage your listings</p>
          <Link 
            to="/login"
            className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              📊 My Listings
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Manage your products and track performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-lime-400">{stats.totalListings}</div>
            <div className="text-gray-300 text-sm">Total Listings</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.activeListings}</div>
            <div className="text-gray-300 text-sm">Active</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.totalViews.toLocaleString()}</div>
            <div className="text-gray-300 text-sm">Total Views</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.totalClicks}</div>
            <div className="text-gray-300 text-sm">Total Clicks</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-yellow-400">${stats.revenue.toFixed(2)}</div>
            <div className="text-gray-300 text-sm">Revenue</div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'pending', 'paused'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {tab} ({tab === 'all' ? listings.length : listings.filter(l => l.status === tab).length})
              </button>
            ))}
          </div>

          <div className="lg:ml-auto">
            <Link
              to="/shop/submit"
              className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
            >
              ➕ Add New Listing
            </Link>
          </div>
        </div>

        {/* Listings Table/Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
            <p className="text-gray-400 mb-6">
              {activeTab === 'all' ? 'Start by creating your first listing' : `No ${activeTab} listings`}
            </p>
            <Link
              to="/shop/submit"
              className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
            >
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20"
              >
                <div className="relative">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/Images/placeholder-product.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(listing.status)}`}>
                      {listing.status.toUpperCase()}
                    </span>
                    {listing.featured && (
                      <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        FEATURED
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">{listing.category} • {listing.type}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-blue-400 font-bold">{listing.views}</div>
                      <div className="text-xs text-gray-400">Views</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-purple-400 font-bold">{listing.clicks}</div>
                      <div className="text-xs text-gray-400">Clicks</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-green-400 font-bold">${listing.revenue}</div>
                      <div className="text-xs text-gray-400">Revenue</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-lime-400">{listing.price}</span>
                    <div className="text-sm text-gray-400">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={listing.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors text-center"
                    >
                      View Live
                    </a>
                    <button
                      onClick={() => handleToggleFeatured(listing.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        listing.featured
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title={listing.featured ? 'Remove from featured' : 'Make featured (+$9.99/week)'}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                      title="Delete listing"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revenue Analytics */}
        <div className="mt-16 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Revenue Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">${stats.revenue.toFixed(2)}</div>
              <div className="text-gray-300">Total Revenue</div>
              <div className="text-sm text-gray-400 mt-1">All time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {stats.totalClicks > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-gray-300">Click Rate</div>
              <div className="text-sm text-gray-400 mt-1">Views to clicks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                ${stats.totalClicks > 0 ? (stats.revenue / stats.totalClicks).toFixed(2) : 0}
              </div>
              <div className="text-gray-300">Avg. per Click</div>
              <div className="text-sm text-gray-400 mt-1">Revenue per click</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListings;
