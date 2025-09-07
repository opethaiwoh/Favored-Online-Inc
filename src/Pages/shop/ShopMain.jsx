// File 1: src/Pages/shop/ShopMain.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ShopMain = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading featured listings
    setTimeout(() => {
      setFeaturedListings([
        {
          id: 1,
          title: "React Developer Roadmap 2025",
          category: "Digital Products",
          type: "eBook",
          price: "$29.99",
          vendor: "Alex Chen",
          rating: 4.8,
          image: "/Images/shop/ebook-react.jpg",
          featured: true,
          link: "https://gumroad.com/l/react-roadmap-2025"
        },
        {
          id: 2,
          title: "Full-Stack Notion Template",
          category: "Digital Products", 
          type: "Template",
          price: "$19.99",
          vendor: "Sarah Martinez",
          rating: 4.9,
          image: "/Images/shop/notion-template.jpg",
          featured: true,
          link: "https://gumroad.com/l/fullstack-notion"
        },
        {
          id: 3,
          title: "AI Bootcamp - Build 5 Projects",
          category: "Courses",
          type: "Course",
          price: "$199.99",
          vendor: "TechAcademy Pro",
          rating: 4.7,
          image: "/Images/shop/ai-bootcamp.jpg",
          featured: true,
          link: "https://teachable.com/ai-bootcamp"
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const shopCategories = [
    {
      id: 'digital-products',
      title: 'Digital Products',
      icon: '📘',
      description: 'eBooks, templates, AI prompts & dev tools',
      count: '240+ items',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'courses',
      title: 'Courses & Learning',
      icon: '👨🏫',
      description: 'Bootcamps, courses & learning programs',
      count: '85+ courses',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'jobs',
      title: 'Jobs & Projects',
      icon: '💼',
      description: 'Remote jobs, freelance & startup gigs',
      count: '120+ opportunities',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'hardware',
      title: 'Tech Hardware',
      icon: '💻',
      description: 'Dev kits, productivity gear & equipment',
      count: '180+ products',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
                🛍️ FavoredOnline Shop
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Discover tools, courses, and opportunities that enhance your tech career. 
              <br />
              <span className="text-lime-400 font-semibold">100% to sellers • External hosting • Community-driven</span>
            </p>
          </div>

          {/* AI-Powered Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🧠 AI Search: Find tools for your next project..."
                className="w-full px-6 py-4 pl-12 text-lg rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <span className="text-2xl">🔍</span>
              </div>
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-lime-400">625+</div>
              <div className="text-gray-300">Total Listings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-blue-400">180+</div>
              <div className="text-gray-300">Verified Vendors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-purple-400">4.8★</div>
              <div className="text-gray-300">Avg Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-gray-300">To Sellers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Categories */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Shop Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopCategories.map((category) => (
              <Link
                key={category.id}
                to={`/shop/${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 p-6 hover:scale-105 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{category.description}</p>
                  <div className="text-lime-400 font-semibold text-sm">{category.count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">⭐ Featured This Week</h2>
            <Link 
              to="/shop/featured"
              className="text-lime-400 hover:text-lime-300 font-semibold"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse">
                  <div className="w-full h-48 bg-gray-700 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300"
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
                    <div className="absolute top-3 left-3 bg-lime-500 text-black px-2 py-1 rounded-lg text-xs font-bold">
                      FEATURED
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
                      {listing.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime-400 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">by {listing.vendor}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-lime-400">{listing.price}</span>
                      <div className="flex items-center text-yellow-400">
                        <span className="text-sm font-semibold">{listing.rating}</span>
                        <span className="ml-1">⭐</span>
                      </div>
                    </div>
                    <a
                      href={listing.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300 text-center block"
                      onClick={() => toast.success('Opening external store...')}
                    >
                      View Product →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vendor CTA */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-lime-500/20 to-green-600/20 backdrop-blur-md rounded-3xl p-8 border border-lime-400/30">
            <h2 className="text-3xl font-bold text-white mb-4">🚀 Become a Vendor</h2>
            <p className="text-gray-300 mb-6 text-lg">
              List your tech products, courses, or services. No commission fees - you keep 100%!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop/submit"
                className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
              >
                📝 Submit Listing
              </Link>
              {currentUser && (
                <Link
                  to="/my-listings"
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
                >
                  📊 My Listings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopMain;
