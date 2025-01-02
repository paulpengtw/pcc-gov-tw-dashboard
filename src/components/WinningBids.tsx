import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const isUnitId = (unitName: string) => {
  // Match any of these patterns:
  // 1. Contains both letters and numbers (e.g., "A.29.1")
  // 2. Starts with a number (e.g., "29.1")
  // 3. Contains only numbers and punctuation (e.g., "1.2.3")
  return /[A-Za-z].*\d|\d.*[A-Za-z]/.test(unitName) || // Pattern 1
         /^\d/.test(unitName) || // Pattern 2
         /^[\d\.\-]+$/.test(unitName); // Pattern 3
};

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
  unit_id: string;
  job_number: string;
  tender_api_url: string;
  detail?: {
    url?: string;
    budget?: string;
    award_amount?: string;
    is_huge_amount?: boolean;
  };
}

export default function WinningBids() {
  const [companyId, setCompanyId] = useState('');
  const [winningBids, setWinningBids] = useState<WinningBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitNames, setUnitNames] = useState<Record<string, string>>({});
  const [fetchingNames, setFetchingNames] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchWinningBids();
    }
  }, [companyId]);

  const fetchWinningBids = async () => {
    if (!companyId.trim()) return;
    
    setLoading(true);
    setError(null);
    setWinningBids([]); // Clear previous results
    
    try {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const threeYearsAgoTimestamp = parseInt(
        threeYearsAgo.getFullYear().toString() +
        (threeYearsAgo.getMonth() + 1).toString().padStart(2, '0') +
        threeYearsAgo.getDate().toString().padStart(2, '0')
      );

      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log('Fetching page:', currentPage);
        const response = await fetch(
          `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=${currentPage}`
        );
        const data = await response.json();
        
        // Filter winning bids from the last 3 years
        const winningRecords = data.records.filter((record: WinningBid) => {
          const companyNames = record.brief.companies.names;
          const isWinningBid = companyNames.some(name => 
            record.brief.companies.name_key[name]?.some(role => 
              role.includes('得標廠商')
            )
          );
          return isWinningBid && record.date >= threeYearsAgoTimestamp;
        });

        // Process each winning record one by one
        for (const record of winningRecords) {
          // Add the record immediately
          setWinningBids(prev => [...prev, record]);

          // Always fetch tender details
          (async () => {
            try {
              console.log('Fetching tender details for:', record.job_number);
              const tenderResponse = await fetch(
                `https://pcc.g0v.ronny.tw/api/tender?unit_id=${record.unit_id}&job_number=${record.job_number}`
              );
              const tenderData = await tenderResponse.json();
              
              if (tenderData.records?.[0]) {
                const tenderRecord = tenderData.records[0];
                setWinningBids(prev => 
                  prev.map(bid => 
                    bid.job_number === record.job_number
                      ? {
                          ...bid,
                          detail: {
                            url: tenderRecord.detail?.url,
                            budget: tenderRecord.detail?.["採購資料:預算金額"] || tenderRecord.detail?.["已公告資料:預算金額"],
                            award_amount: tenderRecord.detail?.["決標資料:總決標金額"],
                            is_huge_amount: tenderRecord.detail?.["採購資料:採購金額級距"]?.includes("巨額")
                          }
                        }
                      : bid
                  )
                );
              }
            } catch (err) {
              console.error('Error fetching tender details:', err);
            }
          })();

          // Only fetch unit name if needed
          if (isUnitId(record.unit_name)) {
            (async () => {
              try {
                console.log('Fetching unit name for ID:', record.unit_id);
                const response = await fetch(`https://pcc.g0v.ronny.tw/api/listbyunit?unit_id=${record.unit_id}`);
                if (!response.ok) {
                  console.log('First API call failed for unit ID:', record.unit_id);
                  return;
                }
                
                const data = await response.json();
                console.log('First API response:', data);
                
                if (data.records && data.records.length > 0) {
                  const tenderApiUrl = data.records[0].tender_api_url.replace('http://', 'https://');
                  console.log('Tender API URL:', tenderApiUrl);
                  const tenderResponse = await fetch(tenderApiUrl);
                  if (!tenderResponse.ok) {
                    console.log('Second API call failed for unit ID:', record.unit_id);
                    return;
                  }
                  
                  const tenderData = await tenderResponse.json();
                  console.log('Tender data:', tenderData);
                  const unitName = tenderData.records?.[0]?.detail?.["機關資料:機關名稱"] || null;
                  console.log('Found unit name:', unitName);
                  if (unitName) {
                    setUnitNames(prev => ({
                      ...prev,
                      [record.unit_name]: unitName
                    }));
                    console.log(`${record.unit_name} => ${unitName}`);
                  }
                }
              } catch (error) {
                console.error('Error fetching unit name:', error);
              }
            })();
          }
        }

        // Check if we should continue to next page
        hasMorePages = data.records.some((record: WinningBid) => record.date >= threeYearsAgoTimestamp) 
          && currentPage < data.total_pages;
        currentPage++;
      }
      
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
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <div className="relative w-[320px] shrink-0">
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
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
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCompanyId('05076416')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                資策會
              </button>
              <button
                type="button"
                onClick={() => setCompanyId('04170821')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                電腦公會
              </button>
              <button
                type="button"
                onClick={() => setCompanyId('02750963')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                工研院
              </button>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg w-[400px] shrink-0">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Description</h3>
            <span className="text-sm text-amber-600">
                數字只要是這個顏色
            </span>
            <span className="text-sm text-black-700">
                就是巨額標案
            </span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Award Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {winningBids.map((bid, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bid.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {bid.detail?.url ? (
                      <a 
                        href={bid.detail.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {bid.brief.title}
                      </a>
                    ) : (
                      bid.brief.title
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unitNames[bid.unit_name] || bid.unit_name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${bid.detail?.is_huge_amount ? 'font-semibold text-amber-600' : 'text-gray-500'}`}>
                    {bid.detail?.budget || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${bid.detail?.is_huge_amount ? 'font-semibold text-amber-600' : 'text-gray-500'}`}>
                    {bid.detail?.award_amount || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.brief.type}
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