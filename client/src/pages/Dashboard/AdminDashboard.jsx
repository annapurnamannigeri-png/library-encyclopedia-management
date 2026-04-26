import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Book, Users, AlertTriangle, ChevronRight, Loader2, X, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Detail view state
  const [selectedType, setSelectedType] = useState(null); // 'all', 'issued', 'overdue'
  const [detailBooks, setDetailBooks] = useState([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const abortControllerRef = React.useRef(null);
  
  const fetchStats = async () => {
    try {
      setError(null);
      const res = await api.get('/admin/stats', { signal: abortControllerRef.current?.signal });
      setStats(res.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error(err);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    fetchStats();
    return () => abortControllerRef.current?.abort();
  }, []);

  const refreshDashboard = () => {
    fetchStats();
    if (selectedType) {
      fetchDetails(selectedType);
    }
  };

  const fetchDetails = async (type) => {
    setFetchingDetails(true);
    try {
      const res = await api.get(`/admin/added-books?type=${type}`);
      setDetailBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch book details", err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleCardClick = async (type) => {
    if (selectedType === type) {
      setSelectedType(null);
      return;
    }
    
    setSelectedType(type);
    fetchDetails(type);
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/books/${id}`);
      refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete book. It might be currently issued to a student.");
    }
  };

  if (loading) return <div className="p-8 text-textSubtle">Loading statistics...</div>;
  if (error) return (
    <div className="p-8 flex items-center justify-center">
      <div className="glass-card p-6 text-center space-y-4 border-red-500/30">
        <AlertTriangle className="mx-auto text-red-500" size={48} />
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
          Retry Connection
        </button>
      </div>
    </div>
  );
  if (!stats) return <div className="p-8 text-textSubtle">No data available.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-primary">Admin Overview</h1>
        <p className="text-textSubtle">System statistics and library health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => handleCardClick('all')}
          className={`glass-card p-6 flex flex-col justify-between text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${selectedType === 'all' ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-textSubtle text-sm">Total Books</p>
              <p className="text-3xl font-semibold mt-1">{stats.totalBooks}</p>
            </div>
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <Book size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-textSubtle mt-2">
            <span>View your added books</span>
            <ChevronRight size={14} className={selectedType === 'all' ? 'rotate-90 transition-transform' : ''} />
          </div>
        </button>

        <button 
          onClick={() => handleCardClick('issued')}
          className={`glass-card p-6 flex flex-col justify-between text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${selectedType === 'issued' ? 'ring-2 ring-secondary ring-offset-4 ring-offset-background' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-textSubtle text-sm">Issued Books</p>
              <p className="text-3xl font-semibold mt-1">{stats.issuedBooks}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
              <Users size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-textSubtle mt-2">
            <span>View issued items</span>
            <ChevronRight size={14} className={selectedType === 'issued' ? 'rotate-90 transition-transform' : ''} />
          </div>
        </button>

        <button 
           onClick={() => handleCardClick('overdue')}
           className={`glass-card p-6 flex flex-col justify-between text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${selectedType === 'overdue' ? 'ring-2 ring-red-500 ring-offset-4 ring-offset-background' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-textSubtle text-sm">Overdue Books</p>
              <p className="text-3xl font-semibold mt-1">{stats.overdueBooks}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-textSubtle mt-2">
            <span>View overdue items</span>
            <ChevronRight size={14} className={selectedType === 'overdue' ? 'rotate-90 transition-transform' : ''} />
          </div>
        </button>
      </div>

      {selectedType && (
        <div className="glass-card p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-semibold flex items-center">
              {selectedType === 'all' ? 'All Books Added By You' : 
               selectedType === 'issued' ? 'Issued Books (From Your Catalog)' : 
               'Overdue Books (From Your Catalog)'}
              {fetchingDetails && <Loader2 className="ml-3 animate-spin text-primary" size={20} />}
            </h2>
            <button onClick={() => setSelectedType(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} className="text-textSubtle" />
            </button>
          </div>

          {fetchingDetails ? (
            <div className="py-12 text-center text-textSubtle">Fetching details...</div>
          ) : detailBooks.length === 0 ? (
            <div className="py-12 text-center text-textSubtle">No books found in this category.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-textSubtle uppercase tracking-wider">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detailBooks.map(book => (
                    <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4 font-medium text-white group-hover:text-primary transition-colors">{book.title}</td>
                      <td className="py-4 px-4 text-textSubtle">{book.author}</td>
                      <td className="py-4 px-4 text-xs">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md">{book.category}</span>
                      </td>
                      <td className="py-4 px-4">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                           book.available_quantity > 0 ? 'bg-secondary/20 text-secondary' : 'bg-red-500/10 text-red-400'
                         }`}>
                           {book.available_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                         </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-sm">{book.total_quantity}</td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Book"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-6 mt-8">
        <h2 className="text-xl font-semibold mb-6">Most Borrowed Books</h2>
        <div className="h-64 w-full">
          {stats.topBooks.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topBooks}>
                <XAxis dataKey="title" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="borrow_count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-textSubtle">Not enough data to display chart</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
