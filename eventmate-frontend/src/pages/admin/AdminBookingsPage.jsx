import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/admin/bookings');
      const sortedBookings = response.data.sort((a, b) => b.id - a.id);
      setBookings(sortedBookings);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure? This will refund the seats.")) {
      try {
        await api.put(`/api/bookings/cancel/${id}`);
        alert("Booking Cancelled!");
        fetchBookings(); 
      } catch {
        alert("Failed to cancel booking.");
      }
    }
  };

  if (loading) return <div className="p-8">Loading Bookings...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">All Bookings</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
            <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Event</th>
                <th className="px-5 py-3 text-left">Tickets</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Action</th>
                </tr>
            </thead>
            <tbody>
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">#{booking.id}</td>
                        <td className="px-5 py-4 text-sm font-medium dark:text-white whitespace-nowrap">
                            <div className="flex flex-col">
                                <span>{booking.user?.name || "Guest"}</span>
                                <span className="text-xs text-gray-400">{booking.user?.email}</span>
                            </div>
                        </td>
                        <td className="px-5 py-4 text-sm dark:text-gray-300 whitespace-nowrap truncate max-w-[200px]" title={booking.event?.title}>
                            {booking.event?.title}
                        </td>
                        <td className="px-5 py-4 text-sm dark:text-gray-300">{booking.ticketsCount}</td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">₹{booking.totalPrice}</td>
                        <td className="px-5 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {booking.status}
                        </span>
                        </td>
                        <td className="px-5 py-4 text-sm">
                        {booking.status !== 'CANCELLED' && (
                            <button 
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                            >
                            Cancel
                            </button>
                        )}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingsPage;