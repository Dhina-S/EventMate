import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaTimes, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import api from '../../services/api'; 
import { useAuth } from '../../context/AuthContext'; 
import EventCard from '../../components/events/EventCard';
import Loader from '../../components/common/Loader';
import useRecommendations from '../../hooks/useRecommendations'; // ✅ FIX: shared hook

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [activeTab, setActiveTab] = useState("bookings");

  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // ✅ FIX: Use shared hook instead of duplicated inline logic
  const { recommendations, recLoading } = useRecommendations(user);
  
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null); 
  const [cancellingId, setCancellingId] = useState(null);

  // 1. Fetch Favorites
  useEffect(() => {
      const fetchFavorites = async () => {
          try {
              const res = await api.get('/api/users/favorites');
              setFavorites(res.data || []);
          } catch (e) {
              console.error("Failed to load favorites");
          }
      };
      if (user) fetchFavorites();
  }, [user]);

  // 2. Fetch Bookings
  const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      try {
          const res = await api.get('/api/bookings/my-bookings'); 
          const allBookings = Array.isArray(res.data) ? res.data : [];
          // Sort: Newest first
          allBookings.sort((a, b) => b.id - a.id);
          setBookings(allBookings);
      } catch (err) {
          if (import.meta.env.DEV) console.error("Failed to load bookings", err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (activeTab === 'bookings' || activeTab === 'recommendations') fetchBookings();
  }, [user, activeTab]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return;
    }
    setCancellingId(id);
    try {
      await api.put(`/api/bookings/cancel/${id}`);
      alert("Booking cancelled successfully.");
      fetchBookings(); 
    } catch (error) {
      alert(error.response?.data || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const getTicketCount = (booking) => {
      if (!booking) return 0;
      if (booking.seats && typeof booking.seats === 'string' && booking.seats.trim() !== '') {
          return booking.seats.split(',').length;
      }
      if (booking.ticketsCount && booking.ticketsCount > 0) return booking.ticketsCount;
      return 1;
  };

  const getDisplayPrice = (booking, count) => {
      const total = Number(booking.totalPrice);
      const price = Number(booking.event?.price);
      if (total > 0) return `₹${total}`;
      if (price === 0) return "Free";
      if (price > 0 && count > 0) return `₹${price * count}`;
      return "Paid";
  };

  if (!user) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hello, {user.name || "User"}! 👋</h1>
          <p className="opacity-90">Welcome to your dashboard.</p>
        </div>
        <div className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold text-sm">
          {user.role ? user.role.replace('ROLE_', '') : 'User'} Account
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <nav className="space-y-2">
              <button onClick={() => setActiveTab("bookings")} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'bookings' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>🎟️ My Bookings</button>
              <button onClick={() => setActiveTab("recommendations")} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'recommendations' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>✨ Recommended (AI)</button>
              <button onClick={() => setActiveTab("wishlist")} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'wishlist' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>❤️ Saved Events</button>
              <button onClick={() => setActiveTab("profile")} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>👤 Profile Settings</button>
              <button onClick={() => navigate('/notifications')} className="w-full text-left px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition">🔔 Notifications</button>
              <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition">🚪 Logout</button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="w-full md:w-3/4">
          
          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
             <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Bookings</h2>
                {loading ? (
                    <div className="flex justify-center p-10"><Loader /></div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-700">
                        <p className="text-gray-500 mb-4">You haven't booked any events yet.</p>
                        <Link to="/events" className="text-blue-600 font-bold hover:underline">Browse Events</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => {
                            const count = getTicketCount(booking);
                            const title = booking.event?.title || "Event Info Unavailable";
                            
                            // ✅ FIX: Prioritize Showtime Date for Movies
                            const date = booking.showTime 
                                ? `${booking.showTime.showDate} | ${booking.showTime.showTime?.substring(0,5)}` 
                                : (booking.event?.date || "Date N/A");

                            const location = booking.event?.location || "Location N/A";
                            const status = booking.status || "PENDING";
                            const priceDisplay = getDisplayPrice(booking, count);

                            let statusColor = "bg-yellow-100 text-yellow-700";
                            if(status === 'CONFIRMED') statusColor = "bg-green-100 text-green-700";
                            if(status === 'CANCELLED') statusColor = "bg-red-100 text-red-700";

                            return (
                                <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row transition hover:shadow-lg">
                                    <div className={`h-2 md:h-auto md:w-2 ${status === 'CONFIRMED' ? 'bg-green-500' : (status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500')}`}></div>
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block ${statusColor}`}>
                                                    {status}
                                                </span>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                                    {title}
                                                </h3>
                                            </div>
                                            <div className="flex gap-2">
                                                {status === 'CONFIRMED' && (
                                                    <button onClick={() => setSelectedBooking(booking)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition shadow-md">
                                                        <FaTicketAlt className="mr-2" /> View Ticket
                                                    </button>
                                                )}
                                                {(status === 'CONFIRMED' || status === 'PENDING') && (
                                                    <button onClick={() => handleCancelBooking(booking.id)} disabled={cancellingId === booking.id} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition">
                                                        {cancellingId === booking.id ? 'Cancelling...' : <><FaTrashAlt className="mr-2" /> Cancel</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center"><FaCalendarAlt className="mr-2 text-blue-500" /> {date}</div>
                                            <div className="flex items-center"><FaMapMarkerAlt className="mr-2 text-red-500" /> {location}</div>
                                            <div className="flex items-center font-bold text-gray-800 dark:text-white">Total: {priceDisplay}</div>
                                        </div>
                                        {booking.seats && (
                                            <p className="mt-4 text-sm text-gray-500">Seats: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 border dark:border-gray-600">{booking.seats}</span></p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
             </div>
          )}

          {/* RECOMMENDATIONS TAB (Real Data) */}
          {activeTab === 'recommendations' && (
             <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Recommended for You 🤖</h2>
                {recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recommendations.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                ) : (
                    <p className="text-gray-500">Book an event to see recommendations here!</p>
                )}
             </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
             <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">❤️ Saved Events</h2>
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {favorites.map(event => (
                            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-100 dark:border-gray-700">
                                <Link to={`/events/${event.id}`}>
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover rounded-md mb-3"/>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{event.title}</h3>
                                    <p className="text-sm text-gray-500">{event.date}</p>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500">No saved events yet.</p>}
             </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
               <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Profile</h2>
               <form>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Full Name</label>
                    <input type="text" defaultValue={user.name} className="border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email</label>
                    <input type="email" defaultValue={user.email} className="border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900" disabled />
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Save Changes</button>
               </form>
            </div>
          )}
        </main>
      </div>

      {/* QR CODE MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="font-bold text-lg">Your Tickets</h3>
              <button onClick={() => setSelectedBooking(null)} className="hover:bg-blue-700 p-1 rounded"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-6">
                {(() => {
                    const count = getTicketCount(selectedBooking);
                    const hasSeats = selectedBooking.seats && typeof selectedBooking.seats === 'string' && selectedBooking.seats.trim() !== '';
                    const ticketArray = hasSeats ? selectedBooking.seats.split(',') : Array.from({length: count}, (_, i) => `GEN-${i+1}`);
                    return ticketArray.map((seat, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 relative text-center">
                            <h4 className="text-xl font-bold text-blue-600">{selectedBooking.event?.title || "Ticket"}</h4>
                            
                            {/* ✅ FIX: Correct Date in QR Modal too */}
                            <p className="text-xs text-gray-500 uppercase mt-1">
                                {selectedBooking.showTime 
                                    ? `${selectedBooking.showTime.showDate} | ${selectedBooking.showTime.showTime?.substring(0,5)}` 
                                    : selectedBooking.event?.date}
                            </p>

                            <div className="flex justify-center my-4">
                                <QRCodeCanvas value={`BOOKING:${selectedBooking.id}-UID:${hasSeats ? seat : index + 1}`} size={120} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{hasSeats ? `Seat: ${seat}` : `General Admission #${index + 1}`}</p>
                            <p className="text-[10px] text-green-600 font-bold mt-2 bg-green-100 inline-block px-2 rounded-full uppercase">• {selectedBooking.status}</p>
                        </div>
                    ));
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;