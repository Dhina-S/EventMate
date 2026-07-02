import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; 

const ManageEventsPage = () => {
  const navigate = useNavigate(); 
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
        // ✅ Call the specific endpoint for the logged-in organizer
        const response = await api.get('/api/events/my-events');
        setEvents(response.data);
        setLoading(false);
    } catch (error) {
        console.error("Fetch error", error);
        setLoading(false);
    }
  };

  // 1. Fetch Events
  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Delete Logic
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
          await api.delete(`/api/events/${id}`);
          // Remove from UI immediately
          setEvents(events.filter(event => event.id !== id));
          alert("Event Deleted.");
      } catch {
          alert("Failed to delete. You might not have permission.");
      }
    }
  };

  if(loading) return <div>Loading events...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Events</h2>
        <Link to="/admin/create-event" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add New Event
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
              <th className="px-5 py-3 text-left">Title</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Price</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">
                    {event.title}
                    {/* ✅ FIX: Show Movie Badge if eventType is MOVIE */}
                    {event.eventType === 'MOVIE' && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                            Movie
                        </span>
                    )}
                </td>
                <td className="px-5 py-5 text-sm text-gray-500 dark:text-gray-300">
                    {/* ✅ FIX: Show 'Multiple Shows' for movies instead of a single date */}
                    {event.eventType === 'MOVIE' ? 'Multiple Shows' : event.date}
                </td>
                <td className="px-5 py-5 text-sm">
                  <span className="px-3 py-1 font-semibold text-green-900 bg-green-200 rounded-full text-xs">
                    {event.category}
                  </span>
                </td>
                <td className="px-5 py-5 text-sm text-gray-500 dark:text-gray-300">
                    {/* ✅ FIX: Show 'Varies' for movies */}
                    {event.eventType === 'MOVIE' ? 'Varies' : `₹${event.price}`}
                </td>
                <td className="px-5 py-5 text-sm">
                  
                  {/* ✅ FIX: Add Schedule Button ONLY for Movies */}
                  {event.eventType === 'MOVIE' && (
                      <button 
                        onClick={() => navigate(`/admin/schedule-movie/${event.id}`)}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 mr-4 font-semibold text-xs border border-purple-200 transition"
                      >
                        📅 Schedule
                      </button>
                  )}

                  {/* Existing Edit Button */}
                  <button 
                    onClick={() => navigate(`/admin/edit-event/${event.id}`)} 
                    className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                  >
                    Edit
                  </button>

                  {/* Existing Delete Button */}
                  <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEventsPage;