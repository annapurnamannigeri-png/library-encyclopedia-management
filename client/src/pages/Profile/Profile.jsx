import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, AlertTriangle } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state for fine waivers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchHistory = async () => {
      try {
        setError(null);
        const res = await api.get('/issues/history', { signal: abortController.signal });
        if (Array.isArray(res.data)) {
          setHistory(res.data);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') return;
        console.error(err);
        setError('Failed to load history.');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    return () => abortController.abort();
  }, []);

  const openWaiverModal = (issueId) => {
    setSelectedIssueId(issueId);
    setWaiverReason('');
    setIsModalOpen(true);
  };

  const handleReturn = async (issueId) => {
    if (!window.confirm("Simulate returning this book?")) return;
    try {
      const res = await api.post('/issues', { action: "return", issue_id: issueId });
      alert(`Book returned! Fine calculated: ₹${res.data.fine_amount || 0}`);
      
      // Refresh history
      const histRes = await api.get('/issues/history');
      setHistory(histRes.data);
    } catch (error) {
       alert(`Error: ${error.response?.data?.message || 'Failed to return book'}`);
    }
  };

  const submitWaiver = async () => {
    if (!waiverReason) {
      alert("Please provide a reason.");
      return;
    }
    setSubmittingWaiver(true);
    try {
      await api.post('/issues/request-fine-waiver', {
        issue_id: selectedIssueId,
        reason: waiverReason
      });
      alert('Waiver request submitted successfully.');
      setIsModalOpen(false);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to submit request'}`);
    } finally {
      setSubmittingWaiver(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-textSubtle">Manage your account and view your borrowing history.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shrink-0">
          <User size={48} className="text-white" />
        </div>
        
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-bold">{user?.name}</h2>
          
          <div className="flex flex-wrap gap-4 text-textSubtle">
            <div className="flex items-center">
              <Mail size={18} className="mr-2" />
              <span>{user?.role === 'student' ? user?.usn : user?.email}</span>
            </div>
            <div className="flex items-center">
              <Shield size={18} className="mr-2" />
              <span className="capitalize">{user?.role} Account</span>
            </div>
            <div className="flex items-center">
               <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white">
                 Borrow Limit: {user?.borrow_limit} Books
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6">Complete Borrowing History</h2>
        
        {error ? (
          <div className="text-center py-8 text-red-400">
            <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-8 text-textSubtle">Loading history...</div>
        ) : !Array.isArray(history) || history.length === 0 ? (
          <div className="text-center py-8 text-textSubtle">You haven't borrowed any books yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-textSubtle uppercase">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due / Returned</th>
                  <th className="py-3 px-4">Status & Fines</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(issue => {
                  const isReturned = issue.status === 'returned';
                  const isOverdue = !isReturned && new Date(issue.return_date) < new Date();
                  const hasFine = Number(issue.fine_amount) > 0;
                  
                  return (
                    <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{issue.title}</td>
                      <td className="py-3 px-4 text-textSubtle">{new Date(issue.issue_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-textSubtle">
                        {isReturned 
                          ? new Date(issue.actual_return_date).toLocaleDateString()
                          : new Date(issue.return_date).toLocaleDateString()
                        }
                        {isReturned && ' (Returned)'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className={`w-max px-2 py-1 rounded-full text-xs font-medium ${
                            isReturned ? 'bg-secondary/20 text-secondary' :
                            isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                          }`}>
                            {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                          </span>
                          {hasFine && (
                            <span className="text-red-400 flex items-center mt-1">
                              <AlertTriangle size={12} className="mr-1" /> ₹{issue.fine_amount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {!isReturned && (
                          <button 
                            onClick={() => handleReturn(issue.id)}
                            className="bg-secondary/20 hover:bg-secondary/30 text-secondary text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            Return Book
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
