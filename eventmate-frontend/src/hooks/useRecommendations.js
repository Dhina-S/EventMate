/**
 * useRecommendations — Custom hook to fetch AI event recommendations.
 *
 * Logic:
 *  1. If the user has bookings → fetch recommendations based on their latest booked event.
 *  2. If no bookings → fall back to the first 4 events from the catalog.
 *  3. If user is not logged in → do nothing.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';

const useRecommendations = (user) => {
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        const res = await api.get('/api/bookings/my-bookings');
        const allBookings = Array.isArray(res.data) ? res.data : [];

        if (allBookings.length > 0) {
          allBookings.sort((a, b) => b.id - a.id);
          const lastEventId = allBookings[0]?.event?.id;
          if (lastEventId) {
            const recRes = await api.get(`/api/events/recommendations/${lastEventId}`);
            setRecommendations(recRes.data || []);
          }
        } else {
          const fallbackRes = await api.get('/api/events');
          if (Array.isArray(fallbackRes.data)) {
            setRecommendations(fallbackRes.data.slice(0, 4));
          }
        }
      } catch (error) {
        // Silently fail — recommendations are non-critical
        if (import.meta.env.DEV) {
          console.error('Failed to load recommendations', error);
        }
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  return { recommendations, recLoading };
};

export default useRecommendations;
