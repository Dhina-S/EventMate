import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import EventSkeleton from '../../components/common/EventSkeleton';
import api from '../../services/api'; 

const CATEGORIES = ["All", "Music", "Technology", "Workshop", "Business", "Sports"];

const EventListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true); // Initial load
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  
  // Local state for input to allow fast typing without re-rendering parent immediately
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");

  // 1. Debounce Logic: Update URL only when user stops typing for 500ms
  // This fixes the issue of the input losing focus or page reloading on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if(searchQuery) {
                newParams.set('search', searchQuery);
            } else {
                newParams.delete('search');
            }
            return newParams;
        }, { replace: true });
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [searchQuery, setSearchParams]);

  // 2. Fetch Data from Backend (Triggered by URL changes)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let endpoint = '/api/events';
        
        // If there is a search query in URL, use the Smart Search Endpoint
        const queryFromUrl = searchParams.get('search') || '';
        if (queryFromUrl) {
            endpoint = `/api/events/search?query=${queryFromUrl}`;
        }

        const response = await api.get(endpoint);
        setEvents(response.data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams]); 

  // 3. Sync Category with Search (Optional UI Polish)
  useEffect(() => {
    const queryFromUrl = searchParams.get('search') || '';
    // Only update category if the search matches a known category exactly
    const matchedCategory = CATEGORIES.find(cat => cat.toLowerCase() === queryFromUrl.toLowerCase());
    if (matchedCategory) {
      setSelectedCategory(matchedCategory);
    }
  }, [searchParams]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchQuery(""); // Clear search bar visually
    // The debounce effect will handle clearing the URL parameter
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Just update local state, let Debounce handle the rest
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setSortBy("date");
    // Debounce will handle URL reset
  };

  // Client-side Filtering (Category & Sorting)
  // Note: Search filtering is handled by the backend query now
  const filteredEvents = events.filter(event => {
    return selectedCategory === "All" || 
           (event.category && event.category.toLowerCase() === selectedCategory.toLowerCase());
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Header Section - Always Visible (Prevents Focus Loss) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
          Explore Events
        </h1>

        {/* Search Bar */}
        <div className="w-full md:w-1/2 relative">
            <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search events (AI Powered)..." 
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full md:w-auto">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-1/4">
          <EventFilters 
            selectedCategory={selectedCategory} 
            setSelectedCategory={handleCategoryChange} 
            onReset={handleResetFilters}
          />
        </aside>

        {/* Event Grid */}
        <section className="w-full md:w-3/4">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {Array.from({ length: 6 }).map((_, i) => (
                 <EventSkeleton key={i} />
               ))}
             </div>
          ) : error ? (
             <div className="text-center py-20 text-red-500">{error}</div>
          ) : sortedEvents.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } }
              }}
              initial="hidden"
              animate="visible"
            >
              {sortedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No events found matching "{searchQuery}"</p>
              <button 
                onClick={handleResetFilters} 
                className="text-blue-600 font-semibold hover:underline"
              >
                Clear Filters &amp; Search
              </button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EventListPage;