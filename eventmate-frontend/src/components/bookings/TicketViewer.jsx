import React from 'react';
import QRCode from 'react-qr-code';

const TicketViewer = ({ booking, onClose }) => {
  if (!booking) return null;

  // 🧠 Logic: Parse "A1,A2" into array OR create array from count
  const tickets = booking.seats 
    ? booking.seats.split(',').map(s => ({ type: 'Seat', label: s.trim() })) 
    : Array.from({ length: booking.ticketsCount }, (_, i) => ({ type: 'General', label: `Entry #${i+1}` }));

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
        <div>
            <h2 className="text-xl font-bold">Your Tickets</h2>
            <p className="text-xs opacity-70">{booking.event.title} • {tickets.length} Ticket(s)</p>
        </div>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-xl transition">
          ✕
        </button>
      </div>

      {/* 🎟️ SCROLLABLE TICKET LIST */}
      <div className="w-full max-w-md h-[80vh] overflow-y-auto space-y-6 px-2 pb-20 scrollbar-hide">
        {tickets.map((ticket, index) => (
          <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-2xl relative transform transition hover:scale-[1.01]">
            
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 text-white text-center relative">
               <h3 className="text-lg font-bold mb-1">{booking.event.title}</h3>
               <p className="text-xs opacity-90">{booking.event.date} | {booking.event.time}</p>
               <p className="text-[10px] mt-1 opacity-75 uppercase tracking-wider">{booking.event.location}</p>
               
               {/* Punch Holes Visual */}
               <div className="absolute -bottom-3 left-[-10px] w-6 h-6 bg-black/95 rounded-full"></div>
               <div className="absolute -bottom-3 right-[-10px] w-6 h-6 bg-black/95 rounded-full"></div>
            </div>

            {/* Ticket Body */}
            <div className="p-6 flex flex-col items-center border-t-2 border-dashed border-gray-300">
               
               {/* Seat Badge */}
               <div className="mb-4 text-center">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      {ticket.type === 'Seat' ? 'Seat Number' : 'Ticket Type'}
                  </span>
                  <span className="text-3xl font-black text-gray-800">
                      {ticket.label}
                  </span>
               </div>

               {/* QR Code */}
               <div className="p-2 bg-white rounded-lg shadow-inner border border-gray-200">
                   <QRCode 
                     value={booking.ticketNumber || String(booking.id)} 
                     size={140} 
                   />
               </div>
               
               <p className="text-[10px] text-gray-400 mt-4 font-mono text-center">
                   ID: {booking.ticketNumber ? booking.ticketNumber.split('-')[0].toUpperCase() : booking.id}-{index + 1} <br/> 
                   <span className="text-green-600 font-bold">● VALID ENTRY</span>
               </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-6 text-white/40 text-xs">
          Scroll down to see all tickets ({tickets.length})
      </div>
    </div>
  );
};

export default TicketViewer;