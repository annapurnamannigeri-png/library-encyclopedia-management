import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const IssueManagement = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await api.get('/admin/issues');
      setIssues(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Issue Management</h1>
        <p className="text-textSubtle">Monitor all circulating and returned library materials.</p>
      </div>

      <div className="glass-card p-6">
        {loading ? (
          <p className="text-textSubtle text-center py-6">Loading issues...</p>
        ) : issues.length === 0 ? (
          <p className="text-textSubtle text-center py-6">No issues found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse auto-cols-auto">
              <thead>
                <tr className="border-b border-white/10 text-sm text-textSubtle uppercase">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fine Amount</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => {
                  const isReturned = issue.status === 'returned';
                  const isOverdue = !isReturned && new Date(issue.return_date) < new Date();
                  
                  return (
                    <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                      <td className="py-3 px-4 font-medium max-w-[200px] truncate" title={issue.book_title}>{issue.book_title}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span>{issue.user_name}</span>
                          <span className="text-xs text-textSubtle">{issue.usn_or_email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-textSubtle">{new Date(issue.issue_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-textSubtle font-medium">{new Date(issue.return_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isReturned ? 'bg-secondary/20 text-secondary' :
                          isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                        }`}>
                          {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-red-400">
                         {Number(issue.fine_amount) > 0 ? `₹${issue.fine_amount}` : '-'}
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

export default IssueManagement;
