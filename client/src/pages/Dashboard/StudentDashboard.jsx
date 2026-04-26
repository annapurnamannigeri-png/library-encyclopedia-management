import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { BookMarked, AlertCircle, Library, XCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [history, setHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(null);

  const fetchData = async (signal) => {
    try {
      setError(null);
      const [historyRes, reservationsRes] = await Promise.all([
        api.get('/issues/history', { signal }),
        api.get('/reservations/my-reservations', { signal })
      ]);
      setHistory(historyRes.data);
      setReservations(reservationsRes.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);
    return () => abortController.abort();
  }, []);

  const handleTransactionSuccess = () => {
    fetchData();
  };

  const handleReserve = async (bookId) => {
    setReserving(bookId);
    try {
      const res = await api.post('/reservations/reserve', { book_id: bookId });
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setReserving(null);
    }
  };

  const activeIssues = history.filter(item => item.status === 'issued' || item.status === 'overdue');
  const totalFine = history.reduce((sum, item) => sum + Number(item.fine_amount || 0), 0);

  if (loading) return <div className="p-8 text-textSubtle">Loading dashboard...</div>;
  
  if (error) return (
    <div className="p-8 flex items-center justify-center">
      <div className="glass-card p-6 text-center space-y-4 border-red-500/30">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-1 tracking-tight">Student Dashboard</h1>
          <p className="text-textSubtle">Welcome back! Manage your library activity here.</p>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center space-x-6 border-primary/20 hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-4 bg-primary/20 rounded-2xl text-primary shadow-lg shadow-primary/10">
            <BookMarked size={32} />
          </div>
          <div>
            <p className="text-textSubtle text-sm font-medium tracking-wide uppercase">Active Books</p>
            <p className="text-3xl font-bold">{activeIssues.length}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center space-x-6 border-red-500/20 hover:border-red-500/40 transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-4 bg-red-500/20 rounded-2xl text-red-500 shadow-lg shadow-red-500/10">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-textSubtle text-sm font-medium tracking-wide uppercase">Total Fines Due</p>
            <p className="text-3xl font-bold">₹{totalFine}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center space-x-6 border-accent/20 hover:border-accent/40 transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-4 bg-accent/20 rounded-2xl text-accent shadow-lg shadow-accent/10">
            <Library size={32} />
          </div>
          <div>
            <p className="text-textSubtle text-sm font-medium tracking-wide uppercase">Total Borrowed</p>
            <p className="text-3xl font-bold">{history.length}</p>
          </div>
        </div>
      </div>

      {/* Currently Borrowed Books Section */}
      <div className="glass-card p-8 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <div className="w-2 h-8 bg-primary rounded-full" />
          Currently Borrowed Books
        </h2>

        {activeIssues.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white/2 rounded-3xl border border-white/5 border-dashed">
            <Library className="mx-auto text-white/5 mb-6" size={64} />
            <p className="text-white/40 text-xl font-medium">Your borrowing list is currently empty.</p>
            <p className="text-textSubtle mt-2">Browse the catalog to find your next read.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs text-textSubtle uppercase tracking-[0.2em] font-black">
                  <th className="py-5 px-6">Book Details</th>
                  <th className="py-5 px-6">Issue Date</th>
                  <th className="py-5 px-6">Due Date</th>
                  <th className="py-5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeIssues.map(issue => {
                  const isOverdue = new Date(issue.return_date) < new Date();
                  return (
                    <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                      <td className="py-6 px-6">
                        <p className="font-bold text-lg text-white group-hover:text-primary transition-colors underline decoration-transparent group-hover:decoration-primary/30 underline-offset-4">{issue.title}</p>
                        <p className="text-sm text-textSubtle mt-1 italic opacity-80">by {issue.author}</p>
                      </td>
                      <td className="py-6 px-6 text-sm text-textSubtle font-medium">{new Date(issue.issue_date).toLocaleDateString(undefined, { dateStyle: 'medium'})}</td>
                      <td className="py-6 px-6 text-sm text-textSubtle font-medium">{new Date(issue.return_date).toLocaleDateString(undefined, { dateStyle: 'medium'})}</td>
                      <td className="py-6 px-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest border ${
                            isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                          <button 
                            onClick={() => handleReserve(issue.book_id)}
                            disabled={reserving === issue.book_id}
                            className="text-[10px] text-accent hover:text-accent/80 font-bold uppercase tracking-wider underline underline-offset-4 decoration-accent/30 transition-all disabled:opacity-50"
                          >
                            {reserving === issue.book_id ? 'Reserving...' : 'Reserve My Book'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Smart Reservations Section */}
      <div className="glass-card p-8 border-white/5 relative overflow-hidden bg-accent/5">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <div className="w-2 h-8 bg-accent rounded-full" />
          Your Smart Reservations
        </h2>

        {reservations.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/2 rounded-3xl border border-white/5 border-dashed">
            <p className="text-white/40 text-lg font-medium">No active reservations.</p>
            <p className="text-textSubtle mt-2 text-sm">Reserve books that are currently issued to be next in line!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reservations.map(res => (
              <div key={res.id} className="glass-card p-5 border-accent/20 flex flex-col justify-between hover:border-accent/40 transition-all group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-accent transition-colors">{res.title}</h3>
                    <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                      PQ: #{res.queuePosition}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-textSubtle uppercase tracking-widest font-black opacity-50">Reserved On</p>
                      <p className="text-white font-medium">{new Date(res.created_at).toLocaleDateString(undefined, { dateStyle: 'medium'})}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-textSubtle uppercase tracking-widest font-black opacity-50">Expect Back</p>
                      <p className="text-accent font-bold">
                        {res.current_due_date ? new Date(res.current_due_date).toLocaleDateString(undefined, { dateStyle: 'medium'}) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[10px] text-textSubtle italic">Auto-issues once returned</p>
                   <button className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest transition-colors">
                     Cancel
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
