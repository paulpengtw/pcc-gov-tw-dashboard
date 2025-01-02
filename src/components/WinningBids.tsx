import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface WinningBid {
  date: number;
  brief: {
    type: string;
    title: string;
    companies: {
      ids: string[];
      names: string[];
      name_key: {
        [key: string]: string[];
      };
    };
  };
  unit_name: string;
  job_number: string;
}

export default function WinningBids() {
  const [companyId, setCompanyId] = useState('');
  const [winningBids, setWinningBids] = useState<WinningBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWinningBids = async () => {
    if (!companyId.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=1`
      );
      const data = await response.json();
      
      // Filter only winning bids
      const winningRecords = data.records.filter((record: WinningBid) => {
        const companyNames = record.brief.companies.names;
        return companyNames.some(name => 
          record.brief.companies.name_key[name]?.some(role => 
            role.includes('得標廠商')
          )
        );
      });
      
      setWinningBids(winningRecords);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: number) => {
    const dateStr = date.toString();
    return `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Winning Bids Search</h1>
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="Enter Company ID"
              className="w-full px-4 py-2 border rounded-lg pr-10"
            />
            <button
              onClick={fetchWinningBids}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">Loading...</div>
      )}

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {winningBids.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {winningBids.map((bid, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bid.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {bid.brief.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.brief.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.unit_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.job_number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 