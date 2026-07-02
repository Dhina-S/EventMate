import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaMagic, FaMoneyBillWave, FaSave, FaArrowLeft, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import api from '../../services/api';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Type & Tiers State
  const [eventType, setEventType] = useState("NORMAL"); 
  const [seatTiers, setSeatTiers] = useState([]);

  const [formData, setFormData] = useState({
    title: '', date: '', time: '', location: '', category: 'Music', description: '',
    price: '', 
    totalCapacity: '',
    isSeated: false,
    totalRows: '', totalCols: '',
    seatConfig: '' 
  });

  const standardInputClass = "w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors";

  // 1. Fetch Existing Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/events/${id}`);
        const event = response.data;

        setEventType(event.eventType || "NORMAL");

        // PARSE SEAT CONFIG IF MOVIE (1-2:500:VIP -> Visual Objects)
        if (event.seatConfig) {
            const tiers = event.seatConfig.split(',').map(rule => {
                const [range, price, name] = rule.split(':');
                const [start, end] = range.split('-');
                return {
                    name: name || 'Standard',
                    price: price || 0,
                    startRow: start,
                    endRow: end || start
                };
            });
            setSeatTiers(tiers);
        } else {
            // Default tier if empty
            setSeatTiers([{ name: 'Standard', price: 0, startRow: 1, endRow: 5 }]);
        }

        const timeValue = event.time ? event.time.substring(0, 5) : '';

        setFormData({
          title: event.title,
          date: event.date || '',
          time: timeValue,
          location: event.location,
          category: event.category,
          description: event.description,
          price: event.price,
          totalCapacity: event.totalCapacity || '',
          isSeated: event.seated,
          totalRows: event.totalRows || '',
          totalCols: event.totalCols || '',
          seatConfig: event.seatConfig || ''
        });

        if (event.imageUrl) {
          setPreviewUrl(event.imageUrl);
        }
      } catch (error) {
        console.error("Failed to fetch event", error);
        toast.error("Could not load event details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Tier Management Logic (Same as Create Page)
  const addSeatTier = () => {
      const lastTier = seatTiers[seatTiers.length - 1];
      setSeatTiers([...seatTiers, { 
          name: 'New Tier', 
          price: 0, 
          startRow: lastTier ? parseInt(lastTier.endRow) + 1 : 1, 
          endRow: lastTier ? parseInt(lastTier.endRow) + 5 : 5 
      }]);
  };

  const removeSeatTier = (index) => {
      if (seatTiers.length > 1) {
          const newTiers = seatTiers.filter((_, i) => i !== index);
          setSeatTiers(newTiers);
      }
  };

  const updateSeatTier = (index, field, value) => {
      const newTiers = [...seatTiers];
      newTiers[index][field] = value;
      setSeatTiers(newTiers);
  };

  const generateSeatConfig = () => {
      return seatTiers.map(t => `${t.startRow}-${t.endRow}:${t.price}:${t.name}`).join(',');
  };

  const calculateTotalRows = () => {
      if (seatTiers.length === 0) return 0;
      return Math.max(...seatTiers.map(t => parseInt(t.endRow)));
  };

  const handleAiGenerate = async () => {
    if (!formData.title) return toast.error("Please enter a Title first.");
    if (!aiKeywords.trim()) return toast.error("Please enter keywords.");

    setAiLoading(true);
    try {
      const response = await api.post('/api/ai/generate-description', {
        title: formData.title,
        category: formData.category,
        keywords: aiKeywords
      });
      
      if (response.data?.description) {
        setFormData(prev => ({ ...prev, description: response.data.description }));
        toast.success("Description generated!");
        setShowAiModal(false);
        setAiKeywords("");
      }
    } catch {
      toast.error("AI Generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
        let finalImageUrl = previewUrl; 
        if (imageFile) {
            const uploadData = new FormData();
            uploadData.append("file", imageFile);
            const uploadRes = await api.post('/api/images/upload', uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            finalImageUrl = uploadRes.data.imageUrl; 
        }

        let safeTime = formData.time;
        if(safeTime && safeTime.length === 5) safeTime += ":00";

        let finalPrice = 0;
        let finalSeatConfig = formData.seatConfig;
        let finalTotalRows = formData.totalRows;

        // LOGIC: Movie Auto-Calc
        if (eventType === "MOVIE") {
            finalSeatConfig = generateSeatConfig();
            finalTotalRows = calculateTotalRows();
            
            if (seatTiers.some(t => t.price <= 0)) {
                toast.error("Please set a price greater than 0 for all tiers.");
                setUpdating(false);
                return;
            }
        } else {
            // Standard Validation
            finalPrice = parseFloat(formData.price) || 0;
        }

        const payload = {
            ...formData,
            time: safeTime,
            imageUrl: finalImageUrl, 
            price: finalPrice, 
            eventType: eventType, // Pass back event type
            
            // Movie Overrides
            totalRows: eventType === "MOVIE" ? parseInt(finalTotalRows) : (formData.isSeated ? parseInt(formData.totalRows) : null),
            totalCols: parseInt(formData.totalCols) || 12,
            seatConfig: eventType === "MOVIE" ? finalSeatConfig : (formData.isSeated ? formData.seatConfig : null),
            seated: eventType === "MOVIE" ? true : formData.isSeated
        };

        await api.put(`/api/events/${id}`, payload);
        toast.success("Event Updated Successfully! 🎉");
        navigate('/admin/events');

    } catch (error) {
        console.error("Update failed:", error);
        toast.error("Failed to update event.");
    } finally {
        setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 dark:text-gray-300">Loading Event Details...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/admin/events')} className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <FaArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Edit {eventType === "MOVIE" ? "Movie" : "Event"}
        </h1>
      </div>
      
      <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-6">
        
        {/* Basic Info */}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={standardInputClass} required />
            </div>

            {/* HIDE DATE/TIME FOR MOVIES */}
            {eventType === "NORMAL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className={`${standardInputClass} pl-10`} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Time</label>
                        <div className="relative">
                            <FaClock className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="time" name="time" value={formData.time} onChange={handleChange} className={`${standardInputClass} pl-10`} required />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-3.5 text-gray-400" />
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className={`${standardInputClass} pl-10`} required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className={standardInputClass} disabled={eventType === "MOVIE"}>
                        {eventType === "MOVIE" ? <option value="Movies">Movies</option> : (
                            <>
                                <option value="Music">Music</option>
                                <option value="Technology">Technology</option>
                                <option value="Others">Others</option>
                            </>
                        )}
                    </select>
                </div>
            </div>
        </div>

        {/* MOVIE TIER CONFIGURATOR */}
        {eventType === "MOVIE" && (
            <div className="p-6 bg-purple-50 dark:bg-gray-700/50 rounded-xl border border-purple-100 dark:border-gray-600 animate-fadeIn">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-purple-600" /> 
                    Seat Pricing
                </h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">Total Columns per Row</label>
                    <input type="number" name="totalCols" value={formData.totalCols} onChange={handleChange} className={standardInputClass} />
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold dark:text-gray-300">Pricing Tiers (Visual Editor)</label>
                    
                    {seatTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                            <div className="col-span-4">
                                <label className="text-xs text-gray-500 mb-1 block">Tier Name</label>
                                <input type="text" value={tier.name} onChange={(e) => updateSeatTier(index, 'name', e.target.value)} className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Start Row</label>
                                <input type="number" value={tier.startRow} onChange={(e) => updateSeatTier(index, 'startRow', e.target.value)} className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">End Row</label>
                                <input type="number" value={tier.endRow} onChange={(e) => updateSeatTier(index, 'endRow', e.target.value)} className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs text-gray-500 mb-1 block">Price (₹)</label>
                                <input type="number" value={tier.price} onChange={(e) => updateSeatTier(index, 'price', e.target.value)} className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-1 flex justify-center pb-2">
                                <button type="button" onClick={() => removeSeatTier(index)} className="text-red-500 hover:text-red-700">
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={addSeatTier} className="text-sm flex items-center text-purple-600 font-semibold hover:text-purple-800 mt-2">
                        <FaPlus className="mr-1" /> Add Another Tier
                    </button>
                </div>
            </div>
        )}

        {/* STANDARD PRICING (OLD) */}
        {eventType === "NORMAL" && (
            <div className="p-6 bg-blue-50 dark:bg-gray-700/50 rounded-xl border border-blue-100 dark:border-gray-600 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                        <FaMoneyBillWave className="mr-2 text-blue-600" /> Pricing & Capacity
                    </h3>
                    <label className="flex items-center cursor-pointer select-none">
                        <span className="mr-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                            {formData.isSeated ? "💺 Seated Event" : "🎫 General Admission"}
                        </span>
                        <div className="relative">
                            <input type="checkbox" name="isSeated" checked={formData.isSeated} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                </div>

                {formData.isSeated ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold mb-1">Total Rows</label><input type="number" name="totalRows" value={formData.totalRows} onChange={handleChange} className={standardInputClass} /></div>
                            <div><label className="block text-sm font-bold mb-1">Total Columns</label><input type="number" name="totalCols" value={formData.totalCols} onChange={handleChange} className={standardInputClass} /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Tiered Pricing Config</label>
                            <textarea name="seatConfig" rows="3" value={formData.seatConfig} onChange={handleChange} className={`${standardInputClass} font-mono text-sm`}></textarea>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-bold mb-1">Total Capacity</label><input type="number" name="totalCapacity" value={formData.totalCapacity} onChange={handleChange} className={standardInputClass} /></div>
                        <div><label className="block text-sm font-bold mb-1">Ticket Price (₹)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className={standardInputClass} /></div>
                    </div>
                )}
            </div>
        )}

        {/* ✅ FIXED: Description & AI Button (Now visible for ALL types) */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                <button type="button" onClick={() => setShowAiModal(true)} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center hover:bg-purple-200">
                    <FaMagic className="mr-1"/> AI Generate
                </button>
            </div>
            <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className={standardInputClass} required></textarea>
        </div>

        {/* ✅ FIXED: Image Upload (Now visible for ALL types) */}
        <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Event Banner</label>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-white"
            />
            {previewUrl && (
                <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
            )}
        </div>

        <button type="submit" disabled={updating} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center">
            {updating ? "Updating..." : <><FaSave className="mr-2" /> Update Event</>}
        </button>
      </form>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 relative animate-fadeIn border dark:border-gray-700">
            <button onClick={() => setShowAiModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <FaMagic className="mr-2 text-purple-600" /> Generate Description
            </h3>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Keywords</label>
              <input type="text" value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} placeholder="e.g. exciting" className={standardInputClass} />
            </div>
            <button onClick={handleAiGenerate} disabled={aiLoading} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              {aiLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEventPage;