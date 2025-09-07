// Pages/shop/ShopSearch.jsx - AI-powered search results
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const ShopSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all'
  });

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, filters]);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    try {
      // Simulate AI-powered search with suggestions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = [
        {
          id: 1,
          title: "React Developer Roadmap 2025",
          category: "Digital Products",
          type: "eBooks",
          price: "$29.99",
          vendor: "Alex Chen",
          rating: 4.8,
          reviews: 124,
          description: "Complete guide to mastering React in 2025 with 20+ real projects",
          image: "/Images/shop/ebook-react.jpg",
          link: "https://gumroad.com/l/react-roadmap-2025",
          relevanceScore: 95,
          tags: ["React", "JavaScript", "Frontend", "Projects"]
        },
        {
          id: 2,
          title: "AI Bootcamp - Build 5 Projects",
          category: "Courses",
          type: "Bootcamp",
          price: "$199.99",
          vendor: "TechAcademy Pro",
          rating: 4.7,
          reviews: 89,
          description: "Master AI development with hands-on projects using Python, TensorFlow, and OpenAI",
          image: "/Images/shop/ai-bootcamp.jpg",
          link: "https://teachable.com/ai-bootcamp",
          relevanceScore: 88,
          tags: ["AI", "Python", "TensorFlow", "Projects"]
        }
      ];

      // Filter results based on search query and filters
      let filteredResults = mockResults.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Apply additional filters
      if (filters.category !== 'all') {
        filteredResults = filteredResults.filter(item => 
          item.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }

      setResults(filteredResults);
      
      // Generate AI suggestions
      const aiSuggestions = [
        "Try searching for 'Next.js templates' instead",
        "Looking for React projects? Check out our project-based courses",
        "Consider browsing our Digital Products category",
        "Need help with AI? Explore our AI prompts collection"
      ];
      setSuggestions(aiSuggestions.slice(0, 2));
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              🔍 Search Results
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Searching for: <span className="text-cyan-400 font-semibold">"{query}"</span>
          </p>
          {!isLoading && (
            <p className="text-gray-400 mt-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Refine Your Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">All Categories</option>
                <option value="digital">Digital Products</option>
                <option value="courses">Courses & Learning</option>
                <option value="jobs">Jobs & Projects</option>
                <option value="hardware">Tech Hardware</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">Any Price</option>
                <option value="free">Free</option>
                <option value="under-50">Under $50</option>
                <option value="50-200">$50 - $200</option>
                <option value="over-200">Over $200</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-cyan-400/30 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">🧠 AI Suggestions</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <p key={index} className="text-cyan-300">💡 {suggestion}</p>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or filters
            </p>
            <div className="space-y-3">
              <Link
                to="/shop"
                className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
              >
                Browse All Products
              </Link>
              <div className="text-gray-400">or</div>
              <Link
                to="/shop/submit"
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                List Your Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <div
                key={product.id}
                className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/Images/placeholder-product.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-cyan-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {product.relevanceScore}% Match
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
                    {product.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">by {product.vendor}</p>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-cyan-400">{product.price}</span>
                    <div className="flex items-center text-yellow-400">
                      <span className="text-sm font-semibold">{product.rating}</span>
                      <span className="ml-1">⭐</span>
                      <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
                    </div>
                  </div>
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 text-center block text-sm"
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
  );
};

// Pages/shop/FeaturedListings.jsx - Featured products page
export const FeaturedListings = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFeatured = [
        {
          id: 1,
          title: "React Developer Roadmap 2025",
          category: "Digital Products",
          price: "$29.99",
          vendor: "Alex Chen",
          rating: 4.8,
          reviews: 124,
          description: "Complete guide to mastering React in 2025",
          image: "/Images/shop/ebook-react.jpg",
          link: "https://gumroad.com/l/react-roadmap-2025",
          featuredUntil: "2024-02-01"
        }
        // Add more featured products...
      ];
      
      setFeaturedProducts(mockFeatured);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              ⭐ Featured Products
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Hand-picked products with premium visibility
          </p>
        </div>
        
        {/* Featured products grid would go here */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">Featured products section is under construction</p>
        </div>
      </div>
    </div>
  );
};

export default ShopSearch;
