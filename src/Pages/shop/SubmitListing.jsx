// src/Pages/shop/SubmitListing.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SubmitListing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    type: '',
    title: '',
    description: '',
    price: '',
    externalLink: '',
    tags: '',
    featured: false,
    vendorInfo: {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      website: '',
      bio: ''
    }
  });

  const categories = {
    'digital-products': {
      name: 'Digital Products',
      types: [
        { id: 'ebooks', name: 'eBooks', icon: '📘' },
        { id: 'templates', name: 'Templates', icon: '📁' },
        { id: 'prompts', name: 'AI Prompts', icon: '🧠' },
        { id: 'tools', name: 'Dev Tools', icon: '🔗' }
      ]
    },
    'courses': {
      name: 'Courses & Learning',
      types: [
        { id: 'bootcamp', name: 'Bootcamp', icon: '🚀' },
        { id: 'course', name: 'Online Course', icon: '💻' },
        { id: 'workshop', name: 'Workshop', icon: '🛠️' },
        { id: 'certification', name: 'Certification', icon: '🏆' }
      ]
    },
    'jobs': {
      name: 'Jobs & Projects',
      types: [
        { id: 'remote-job', name: 'Remote Job', icon: '🌍' },
        { id: 'freelance', name: 'Freelance Project', icon: '💼' },
        { id: 'startup', name: 'Startup Role', icon: '🚀' },
        { id: 'contract', name: 'Contract Work', icon: '📝' }
      ]
    },
    'hardware': {
      name: 'Tech Hardware',
      types: [
        { id: 'laptop', name: 'Laptops', icon: '💻' },
        { id: 'accessories', name: 'Accessories', icon: '⌨️' },
        { id: 'dev-kit', name: 'Dev Kits', icon: '🧰' },
        { id: 'furniture', name: 'Workspace', icon: '🪑' }
      ]
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please login to submit a listing');
      navigate('/login');
      return;
    }

    if (!formData.title || !formData.description || !formData.externalLink || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      new URL(formData.externalLink);
    } catch {
      toast.error('Please enter a valid external link');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        vendorId: currentUser.uid,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      console.log('Submitting listing:', submissionData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Listing submitted successfully! It will be reviewed within 24 hours.');
      navigate('/my-listings');
      
    } catch (error) {
      console.error('Error submitting listing:', error);
      toast.error('Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('vendorInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vendorInfo: {
          ...prev.vendorInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Login Required</h1>
          <p className="text-gray-300 mb-8">Please login to submit a listing</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Submit Your Listing
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Share your products, courses, or opportunities with the FavoredOnline community
          </p>
          <div className="mt-6 bg-lime-500/20 border border-lime-400/30 rounded-xl p-4 inline-block">
            <p className="text-lime-400 font-semibold">100% Revenue to You • No Commission Fees</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Product Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categories).map(([key, category]) => (
                <label
                  key={key}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.category === key
                      ? 'border-lime-400 bg-lime-400/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={formData.category === key}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-white font-semibold text-lg">{category.name}</div>
                </label>
              ))}
            </div>

            {formData.category && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Product Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories[formData.category].types.map((type) => (
                    <label
                      key={type.id}
                      className={`cursor-pointer p-3 rounded-lg border text-center transition-all duration-300 ${
                        formData.type === type.id
                          ? 'border-lime-400 bg-lime-400/20 text-lime-400'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-semibold">{type.name}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Product Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete React Developer Roadmap 2025"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product, what it includes, and what users will learn or gain..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Price</label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., $29.99 or Free"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">External Link *</label>
                  <input
                    type="url"
                    name="externalLink"
                    value={formData.externalLink}
                    onChange={handleInputChange}
                    placeholder="https://gumroad.com/l/your-product"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="React, JavaScript, Frontend, Projects"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isSubmitting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 transform hover:scale-105'
              } text-white`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
            </button>
            <p className="text-gray-400 text-sm mt-4">
              Your listing will be reviewed within 24 hours
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitListing;
