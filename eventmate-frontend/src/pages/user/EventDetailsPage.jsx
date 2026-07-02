import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'; 
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import SeatSelection from '../../components/events/SeatSelection'; 
import ReviewSection from '../../components/ReviewSection';
import AiChatWidget from '../../components/AiChatWidget';
import toast from 'react-hot-toast'; // ✅ FIX: Use toast instead of alert()

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // General State
  const [ticketCount, setTicketCount] = useState(1);
  const [ticketType, setTicketType] = useState("General");

  // Seated State
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Favorites State
  const [isFavorite, setIsFavorite] = useState(false);

  // ✅ MOVIE SCHEDULING STATE
  const [showTimes, setShowTimes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShowTime, setSelectedShowTime] = useState(null);

  // 1. Fetch Event Data
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await api.get(`/api/events/${id}`);
        setEvent(response.data);

        // Standard Event Occupied Seats
        if (response.data.seated && response.data.eventType !== "MOVIE") { 
             const seatRes = await api.get(`/api/seats/occupied/${id}`);
             setOccupiedSeats(seatRes.data);
        }
        
        setLoading(false);
      } catch {
        setError("Event not found or server error.");
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  // 2. Fetch Showtimes (Handles both Movie & Standard)
  useEffect(() => {
      api.get(`/api/showtimes/event/${id}`)
          .then(res => {
              const allShows = res.data;
              setShowTimes(allShows);
              
              if (allShows.length > 0) {
                  const dates = [...new Set(allShows.map(s => s.showDate))].sort();
                  setUniqueDates(dates);
                  
                  // Default to first available date
                  setSelectedDate(dates[0]);
              }
          })
          .catch(err => {
              if (import.meta.env.DEV) console.error("Failed to load showtimes", err);
          });
  }, [id]);

  // 3. Fetch Occupied Seats when Showtime Changes (Crucial for Movies)
  useEffect(() => {
    if (selectedShowTime) {
        // Fetch occupied seats SPECIFIC to this showtime
        api.get(`/api/seats/occupied/showtime/${selectedShowTime.id}`)
            .then(res => setOccupiedSeats(res.data))
            .catch(err => {
                if (import.meta.env.DEV) console.error("Failed to load seats", err);
            });
    }
  }, [selectedShowTime]);

  // 4. Check Favorite
  useEffect(() => {
    const checkFavorite = async () => {
        if (!user) return;
        try {
            const res = await api.get('/api/users/favorites');
            const isFav = res.data.some(fav => fav.id === parseInt(id));
            setIsFavorite(isFav);
        } catch (e) {
            if (import.meta.env.DEV) console.error("Failed to check favorites", e);
        }
    };
    checkFavorite();
  }, [id, user]);

  const toggleFavorite = async () => {
      if (!user) {
          // ✅ FIX: Use toast instead of browser-blocking alert()
          toast.error("Please login to save events!");
          return;
      }

      try {
          if (isFavorite) {
              await api.delete(`/api/users/favorites/${id}`);
              setIsFavorite(false);
          } else {
              await api.post(`/api/users/favorites/${id}`);
              setIsFavorite(true);
          }
      } catch (error) {
          if (import.meta.env.DEV) console.error("Failed to toggle favorite", error);
      }
  };

  const handleIncrement = () => {
    if (event && ticketCount < event.availableSeats) {
        setTicketCount(prev => prev + 1);
    }
  };
  const handleDecrement = () => setTicketCount(prev => (prev > 1 ? prev - 1 : 1));

  const handleSeatClick = (seatId) => {
      if (selectedSeats.includes(seatId)) {
          setSelectedSeats(selectedSeats.filter(s => s !== seatId));
      } else {
          setSelectedSeats([...selectedSeats, seatId]);
      }
  };

  const calculateSeatedTotal = () => {
    if (!event || !event.seatConfig || selectedSeats.length === 0) return 0;
    
    let total = 0;
    const rules = event.seatConfig.split(/[,\n]/); 
    
    selectedSeats.forEach(seatId => {
        const row = parseInt(seatId.split('-')[0]);
        let seatPrice = event.price; 
        
        for (let rule of rules) {
            const parts = rule.split(':');
            if (parts.length >= 2) {
                const range = parts[0].split('-');
                const start = parseInt(range[0]);
                const end = parseInt(range[1] || range[0]);
                
                if (row >= start && row <= end) {
                    seatPrice = parseFloat(parts[1]);
                    break; 
                }
            }
        }
        total += seatPrice;
    });
    return total;
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-center py-20 text-red-500 text-xl">{error}</div>;
  if (!event) return null;

  // Determine booking mode
  const isMovie = event.eventType === "MOVIE";
  const isSeatedEvent = event.seated; 
  const displayImage = event.imageUrl || 'https://via.placeholder.com/800x400';
  
  // ✅ FIX: Logic to calculate available seats safely
  let availableSeatsCount = event.availableSeats;
  let isSoldOut = event.availableSeats === 0;

  if (isMovie) {
      if (selectedShowTime && selectedShowTime.hall) {
          availableSeatsCount = selectedShowTime.hall.totalCapacity - occupiedSeats.length;
          isSoldOut = availableSeatsCount <= 0;
      } else {
          // If no showtime selected, we don't have a count yet
          availableSeatsCount = null; 
          isSoldOut = false;
      }
  }

  const totalPrice = isSeatedEvent 
      ? calculateSeatedTotal() 
      : (event.price * (ticketType === "VIP" ? 2 : 1) * ticketCount);

  // Filter shows based on selected date
  const availableShowsForDate = showTimes
    .filter(st => st.showDate === selectedDate)
    .sort((a,b) => a.showTime.localeCompare(b.showTime));

  const handleBooking = () => {
    if (!user) {
        const confirmLogin = window.confirm("You must be logged in to book tickets. Go to Login page?");
        if (confirmLogin) {
            navigate('/login', { state: { from: location.pathname } });
        }
        return;
    }

    if (isMovie && !selectedShowTime) {
        alert("Please select a date and showtime.");
        return;
    }

    if (isSeatedEvent) {
        if (selectedSeats.length === 0) {
            alert("Please select at least one seat.");
            return;
        }
        
        const bookingState = { 
            event: event, 
            ticketCount: selectedSeats.length, 
            totalPrice: totalPrice, 
            seats: selectedSeats.join(","),
            showTime: selectedShowTime 
        };

        navigate('/book-event', { state: bookingState });

    } else {
        const bookingState = { 
            event: event, 
            ticketCount: ticketCount, 
            totalPrice: totalPrice, 
            ticketType: ticketType,
            showTime: selectedShowTime 
        };

        navigate('/book-event', { state: bookingState });
    }
  };

  // ✅ Helper to render the Availability Badge Text
  const renderAvailabilityText = () => {
    if (isMovie) {
        if (!selectedShowTime) return "Select a Showtime";
        if (isSoldOut) return "SOLD OUT";
        return `${availableSeatsCount} Seats Left`;
    }
    // Standard Event
    if (isSoldOut) return "SOLD OUT";
    return `${availableSeatsCount} Seats Left`;
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600">Home</Link> / <Link to="/events" className="hover:text-blue-600">Events</Link> / <span className="text-gray-900 dark:text-white font-medium">{event.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <img src={displayImage} alt={event.title} className="w-full h-96 object-cover rounded-xl shadow-md mb-8" />
          
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
              
              <button 
                onClick={toggleFavorite}
                className={`p-3 rounded-full shadow-sm border transition ${
                    isFavorite 
                    ? "bg-red-50 border-red-200 text-red-600" 
                    : "bg-white border-gray-200 text-gray-400 hover:text-red-400"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
          </div>
          
          <div className="flex flex-wrap gap-6 mb-8 text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                  <span className="text-2xl mr-2">📅</span>
                  <div>
                      <p className="text-sm font-semibold">Date</p>
                      <p className="text-sm">{isMovie ? "Multiple Dates" : event.date}</p>
                  </div>
              </div>
              <div className="flex items-center">
                  <span className="text-2xl mr-2">⏰</span>
                  <div>
                      <p className="text-sm font-semibold">Time</p>
                      <p className="text-sm">{isMovie ? "Check Schedule" : (event.time || "TBA")}</p>
                  </div>
              </div>
              <div className="flex items-center">
                  <span className="text-2xl mr-2">📍</span>
                  <div><p className="text-sm font-semibold">Location</p><p className="text-sm">{event.location}</p></div>
              </div>
              <div className="flex items-center">
                  <span className="text-2xl mr-2">🎟️</span>
                  <div>
                      <p className="text-sm font-semibold">Availability</p>
                      {/* ✅ FIX: No more 'null' text. Using helper function. */}
                      <p className={`text-sm font-bold ${isSoldOut ? 'text-red-500' : 'text-green-600'}`}>
                          {renderAvailabilityText()}
                      </p>
                  </div>
              </div>
          </div>

          <div className="mb-8"><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About this Event</h2><p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p></div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Book Tickets</h3>
            
            {/* ✅ MOVIE SCHEDULING UI */}
            {isMovie && uniqueDates.length > 0 && (
                <div className="mb-6 animate-fadeIn">
                    
                    {/* Date Selector Strip */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                        {uniqueDates.map(date => (
                            <button
                                key={date}
                                onClick={() => { setSelectedDate(date); setSelectedShowTime(null); setSelectedSeats([]); }}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                                    selectedDate === date 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400"
                                }`}
                            >
                                {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                <br/>
                                <span className="text-xs font-normal opacity-80">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            </button>
                        ))}
                    </div>

                    {/* Showtime Selector */}
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Showtime</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {availableShowsForDate.map((st) => (
                             <button
                                key={st.id}
                                onClick={() => { setSelectedShowTime(st); setSelectedSeats([]); }}
                                className={`px-2 py-2 text-sm rounded-lg border transition text-center ${
                                    selectedShowTime?.id === st.id
                                    ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 dark:ring-blue-900"
                                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                                }`}
                            >
                                {st.showTime.substring(0, 5)}
                                <div className="text-[10px] opacity-70 truncate">{st.hall ? st.hall.name : "Main Hall"}</div>
                            </button>
                        ))}
                        {availableShowsForDate.length === 0 && (
                            <p className="text-xs text-gray-400 col-span-3">No shows available for this date.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ✅ SEAT SELECTION UI (Hidden until showtime is picked for movies) */}
            {(isSeatedEvent && (!isMovie || selectedShowTime)) ? (
                <div className="mb-6 animate-fadeIn">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Your Seats</h4>
                    <SeatSelection 
                        rows={isMovie && selectedShowTime?.hall ? selectedShowTime.hall.totalRows : (event.totalRows || 10)} 
                        cols={isMovie && selectedShowTime?.hall ? selectedShowTime.hall.totalCols : (event.totalCols || 12)} 
                        occupiedSeats={occupiedSeats}
                        selectedSeats={selectedSeats}
                        onSeatClick={handleSeatClick}
                        seatConfig={event.seatConfig} 
                    />
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Selected: <span className="font-bold text-blue-600">{selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}</span>
                        </p>
                    </div>
                </div>
            ) : null}

            {/* General Admission UI */}
            {!isSeatedEvent && (
                <>
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ticket Type</label>
                    <select value={ticketType} onChange={(e) => setTicketType(e.target.value)} disabled={isSoldOut} className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-700 dark:text-white dark:bg-gray-700">
                        <option value="General">General Admission</option>
                        <option value="VIP">VIP Access (2x Price)</option>
                    </select>
                    </div>
                    <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md w-max">
                        <button onClick={handleDecrement} disabled={isSoldOut} className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100">-</button>
                        <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{ticketCount}</span>
                        <button onClick={handleIncrement} disabled={isSoldOut || ticketCount >= availableSeatsCount} className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100">+</button>
                    </div>
                    </div>
                </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 border-b py-4 mb-6">
              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-right">
                    <div>₹{totalPrice}</div>
                    {isSeatedEvent && totalPrice === 0 && (
                        <div className="text-xs text-gray-400 font-normal">(Select seats to see price)</div>
                    )}
                </span>
              </div>
            </div>

            <button 
              onClick={handleBooking} 
              disabled={isSoldOut || (isSeatedEvent && selectedSeats.length === 0) || (isMovie && !selectedShowTime)} 
              className={`w-full text-white py-3 rounded-lg font-semibold transition shadow-md ${
                  isSoldOut || (isSeatedEvent && selectedSeats.length === 0) || (isMovie && !selectedShowTime) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSoldOut ? "Sold Out" : "Proceed to Booking"}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">Secure payment via Stripe/Razorpay</p>
          </div>
        </div>
      </div>

      <ReviewSection eventId={id} />
      <AiChatWidget eventId={id} />

    </div>
  );
};

export default EventDetailsPage;