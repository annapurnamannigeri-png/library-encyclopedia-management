import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const FineRequests = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState('');
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
          throw new Error('Invalid data format');
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') return;
        console.error(err);
        setError('Failed to load fines.');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    return () => abortController.abort();
  }, []);

  const issuesWithFines = Array.isArray(history) ? history.filter(issue => Number(issue.fine_amount) > 0) : [];

  const submitWaiver = async (e) => {
    e.preventDefault();
    if (!waiverReason || !selectedIssueId) return;
    
    setSubmittingWaiver(true);
    try {
      await api.post('/issues/request-fine-waiver', {
        issue_id: parseInt(selectedIssueId),
        reason: waiverReason
      });
      alert('Waiver request submitted successfully.');
      setWaiverReason('');
      setSelectedIssueId('');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to submit request'}`);
    } finally {
      setSubmittingWaiver(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fine Requests Dashboard</h1>
        <p className="text-textSubtle">Submit excuses for overdue books to request a fine waiver.</p>
      </div>

      <div className="glass-card p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Request New Waiver</h2>
        
        {error ? (
          <p className="text-red-400 py-4">{error}</p>
        ) : loading ? (
          <p className="text-textSubtle">Loading your fines...</p>
        ) : issuesWithFines.length === 0 ? (
          <p className="text-textSubtle">You currently have no fines to request waivers for.</p>
        ) : (
          <form onSubmit={submitWaiver} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-textSubtle mb-1">Select Issue / Fine</label>
              <select 
                className="input-field bg-black/40"
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                required
              >
                <option value="" disabled>Select a book</option>
                {issuesWithFines.map(issue => (
                   <option key={issue.id} value={issue.id}>
                     {issue.title} - Fine: ₹{issue.fine_amount}
                   </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-textSubtle mb-1">Excuse / Reason</label>
              <textarea
                className="input-field h-32 resize-none"
                placeholder="E.g., Medical emergency..."
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                required
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={submittingWaiver}
              className="btn-primary w-full py-3"
            >
              {submittingWaiver ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FineRequests;
