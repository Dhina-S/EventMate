import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaCamera, FaUser, FaLock, FaEnvelope, FaPhone, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const OrganizerProfilePage = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); 
  const fileInputRef = useRef(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    profileImage: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/users/profile');
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        phoneNumber: res.data.phoneNumber || '',
        bio: res.data.bio || '',
        profileImage: res.data.profileImage || ''
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load profile", error);
      toast.error("Failed to load profile data.");
      setLoading(false);
    }
  };

  // Fetch Profile Data
  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Selection (Convert to Base64)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Submit Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/profile', {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        profileImage: formData.profileImage
      });
      
      // ✅ FIX: Update global auth state with new data
      updateUser({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        profileImage: formData.profileImage
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    }
  };

  // Submit Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      await api.put('/api/users/profile', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update password.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Organizer Settings</h2>
      
      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-8">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Profile Details
        </button>
        <button 
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Security & Password
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-10">
            
            {/* Avatar Section with File Upload */}
            <div className="flex flex-col items-center">
              <div 
                className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 mb-4 overflow-hidden relative group cursor-pointer border-4 border-white dark:border-gray-600 shadow-lg"
                onClick={() => fileInputRef.current.click()} 
              >
                {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <FaUser size={40} />
                )}
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center text-white text-xs text-center p-2 transition-all">
                   <FaCamera size={20} className="mb-1" />
                   <span>Upload</span>
                </div>
              </div>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg"
              />

              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <FaUpload size={12} /> Upload Photo
              </button>
              <p className="text-xs text-gray-400 mt-1">Max size 2MB</p>
            </div>

            {/* Fields Section */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Organization Name</label>
                  <div className="relative">
                      <FaUser className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email Address</label>
                  <div className="relative opacity-70">
                      <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed" 
                      />
                  </div>
                </div>
              </div>

              <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Phone Number</label>
                  <div className="relative">
                      <FaPhone className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                  </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Bio / Description</label>
                <textarea 
                    name="bio"
                    rows="4" 
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about your organization..."
                    className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                    Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
           <form onSubmit={handleUpdatePassword} className="max-w-lg">
               <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                   <p className="text-sm text-yellow-800 dark:text-yellow-200">
                       Note: Changing your password will require you to log in again on other devices.
                   </p>
               </div>

               <div className="space-y-4">
                   <div>
                       <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Current Password</label>
                       <div className="relative">
                           <FaLock className="absolute left-3 top-3 text-gray-400" />
                           <input 
                             type="password" 
                             name="currentPassword"
                             value={passwordData.currentPassword}
                             onChange={handlePasswordChange}
                             className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                             required 
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">New Password</label>
                       <div className="relative">
                           <FaLock className="absolute left-3 top-3 text-gray-400" />
                           <input 
                             type="password" 
                             name="newPassword"
                             value={passwordData.newPassword}
                             onChange={handlePasswordChange}
                             className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                             required 
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Confirm New Password</label>
                       <div className="relative">
                           <FaLock className="absolute left-3 top-3 text-gray-400" />
                           <input 
                             type="password" 
                             name="confirmPassword"
                             value={passwordData.confirmPassword}
                             onChange={handlePasswordChange}
                             className="w-full border dark:border-gray-600 rounded-lg pl-10 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                             required 
                           />
                       </div>
                   </div>
               </div>

               <div className="pt-6">
                <button type="submit" className="bg-gray-800 dark:bg-gray-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-gray-900 transition shadow-md">
                    Update Password
                </button>
              </div>
           </form>
        )}
      </div>
    </div>
  );
};

export default OrganizerProfilePage;