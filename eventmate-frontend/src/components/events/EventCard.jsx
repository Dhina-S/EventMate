import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EventCard = ({ event }) => {
  // 1. Handle fallback for missing data
  if (!event) return null;

  // ✅ Destructure eventType to check if it's a Movie
  const { id, title, date, location, price, imageUrl, image, category, eventType } = event;

  // 2. Resolve Image (Backend uses 'imageUrl', Dummy uses 'image')
  const displayImage = imageUrl || image || 'https://via.placeholder.com/400x200';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
      }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full"
    >
      
      {/* Event Image Container with Zoom Effect */}
      <div className="relative h-52 overflow-hidden">
        <img 
          src={displayImage} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay Gradient for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

        {/* Category Tag */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-700 dark:text-blue-400 shadow-sm">
          {category || 'Event'}
        </div>

        {/* ✅ FIXED: Price Tag Logic */}
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
           {eventType === 'MOVIE' 
              ? "Varies"  // Shows 'Varies' for movies
              : (price === 0 ? "Free" : `₹${price}`) // Shows Price or Free for others
           }
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* ✅ FIXED: Date Display for Movies */}
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
          {date || (eventType === 'MOVIE' ? 'Multiple Shows' : 'Date TBA')}
        </p>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-6">
          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span className="truncate">{location}</span>
        </div>

        {/* Action Button - Pushed to bottom */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link 
            to={`/events/${id}`} 
            className="block w-full text-center bg-gray-50 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-200 hover:text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;