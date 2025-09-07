// src/Pages/companies/CreateCompany.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { safeFirestoreOperation } from '../../utils/errorHandler';
import NotificationBell from '../../components/NotificationBell';

const CreateCompany = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    foundedYear: '',
    companySize: '',
    companyType: 'private'
  });

  const [errors, setErrors] = useState({});

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Entertainment', 'Automotive', 'Aerospace', 'Energy',
    'Telecommunications', 'Media', 'Gaming', 'E-commerce', 'Consulting',
    'Real Estate', 'Agriculture', 'Transportation', 'Biotechnology', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees',
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const checkCompanyNameExists = async (companyName) => {
    try {
      const q = query(
        collection(db, 'companies'),
        where('companyName', '==', companyName.trim())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking company name:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.warning('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      // Check if company name already exists
      const nameExists = await checkCompanyNameExists(formData.companyName);
      if (nameExists) {
        setErrors({ companyName: 'A company with this name already exists' });
        setSubmitting(false);
        return;
      }

      await safeFirestoreOperation(async () => {
        // FIXED: Prepare company data with proper null handling and validation
        const companyData = {
          // Required fields
          companyName: formData.companyName.trim(),
          description: formData.description.trim(),
          industry: formData.industry,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          
          // Optional fields - only include if they have values, otherwise omit entirely
          ...(formData.location.trim() && { location: formData.location.trim() }),
          ...(formData.website.trim() && { website: formData.website.trim() }),
          ...(formData.foundedYear && { foundedYear: parseInt(formData.foundedYear) }),
          ...(formData.companySize && { companySize: formData.companySize }),
          
          // Always included fields with defaults
          companyType: formData.companyType,
          createdByEmail: currentUser.email,
          createdByName: currentUser.displayName || currentUser.email,
          status: 'active',
          isVerified: false,
          memberCount: 1,
          postCount: 0,
          updatedAt: serverTimestamp()
        };

        console.log('Creating company with data:', companyData); // Debug log

        const companyRef = await addDoc(collection(db, 'companies'), companyData);

        // FIXED: Add creator as admin member with proper field structure
        const memberData = {
          companyId: companyRef.id,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email,
          role: 'admin',
          status: 'active',
          joinedAt: serverTimestamp(),
          // Optional fields
          ...(currentUser.photoURL && { userPhoto: currentUser.photoURL })
        };

        console.log('Creating member with data:', memberData); // Debug log

        await addDoc(collection(db, 'company_members'), memberData);
        return companyRef;
      }, 'creating company');

      toast.success('Company page created successfully!');
      navigate('/companies');
      
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-6">Create Your Company Page</h1>
          <p className="text-xl text-gray-200 mb-8">
            Build your company's presence and connect with tech professionals.
          </p>
          <Link to="/companies" className="text-lime-400 hover:text-lime-300">
            ← Back to Companies
          </Link>
        </div>

        {/* Form */}
        <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Company Name */}
            <div>
              <label className="block text-lime-300 font-semibold mb-2">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-all ${
                  errors.companyName ? 'border-red-500' : 'border-white/20 focus:border-lime-400'
                }`}
                placeholder="Enter your company name..."
                maxLength={100}
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-lime-300 font-semibold mb-2">Company Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none h-32 resize-vertical transition-all ${
                  errors.description ? 'border-red-500' : 'border-white/20 focus:border-lime-400'
                }`}
                placeholder="Describe your company, its mission, and what makes it unique..."
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
              <div className="text-right text-gray-400 text-xs mt-1">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Industry and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lime-300 font-semibold mb-2">Industry *</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${
                    errors.industry ? 'border-red-500' : 'border-white/20 focus:border-lime-400'
                  }`}
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-400 text-sm mt-1">{errors.industry}</p>
                )}
              </div>

              <div>
                <label className="block text-lime-300 font-semibold mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none transition-all"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>

            {/* Website and Founded Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lime-300 font-semibold mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-all ${
                    errors.website ? 'border-red-500' : 'border-white/20 focus:border-lime-400'
                  }`}
                  placeholder="https://yourcompany.com"
                />
                {errors.website && (
                  <p className="text-red-400 text-sm mt-1">{errors.website}</p>
                )}
              </div>

              <div>
                <label className="block text-lime-300 font-semibold mb-2">Founded Year</label>
                <input
                  type="number"
                  name="foundedYear"
                  value={formData.foundedYear}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none transition-all"
                  placeholder="e.g., 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Company Size and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lime-300 font-semibold mb-2">Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all"
                >
                  <option value="">Select Company Size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lime-300 font-semibold mb-2">Company Type</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all"
                >
                  <option value="private">Private Company</option>
                  <option value="public">Public Company</option>
                  <option value="startup">Startup</option>
                  <option value="nonprofit">Non-Profit</option>
                  <option value="government">Government</option>
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Company...
                  </div>
                ) : (
                  '🏢 Create Company Page'
                )}
              </button>

              <Link
                to="/companies"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-bold transition-all text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
