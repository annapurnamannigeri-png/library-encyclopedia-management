import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchReservations = async () => {
      try {
        setError(null);
        const res = await api.get('/reservations/my-reservations', { signal: abortController.signal });
        if (Array.isArray(res.data)) {
          setReservations(res.data);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') return;
        console.error(err);
        setError('Failed to fetch reservations.');
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
    return () => abortController.abort();
  }, []);

  const cancelReservation = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      await api.delete(`/reservations/cancel/${id}`);
      window.location.reload(); // Quick explicit reload or better fetch function reference
    } catch (error) {
      alert("Error cancelling reservation");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Reservations</h1>
        <p className="text-textSubtle">Track your queue positions for reserved books.</p>
      </div>

      <div className="glass-card p-6">
        {error ? (
          <p className="text-red-400 text-center py-6">{error}</p>
        ) : loading ? (
          <p className="text-textSubtle text-center py-6">Loading reservations...</p>
        ) : !Array.isArray(reservations) || reservations.length === 0 ? (
          <p className="text-textSubtle text-center py-6">You have no active reservations.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-textSubtle uppercase">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Date Reserved</th>
                  <th className="py-3 px-4">Queue Position</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-medium">{res.title}</td>
                    <td className="py-3 px-4 text-textSubtle">{new Date(res.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
                        #{res.queuePosition} in Queue
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => cancelReservation(res.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
