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
  };
}

export default function WinningBids() {
  const [companyId, setCompanyId] = useState('');
  const [winningBids, setWinningBids] = useState<WinningBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitNames, setUnitNames] = useState<Record<string, string>>({});
  const [fetchingNames, setFetchingNames] = useState(false);

  const fetchUnitName = async (bid: WinningBid) => {
    try {
      console.log('Fetching unit name for ID:', bid.unit_id);
      const response = await fetch(`https://pcc.g0v.ronny.tw/api/listbyunit?unit_id=${bid.unit_id}`);
      if (!response.ok) {
        console.log('First API call failed for unit ID:', bid.unit_id);
        return null;
      }
      
      const data = await response.json();
      console.log('First API response:', data);
      
      if (data.records && data.records.length > 0) {
        const tenderApiUrl = data.records[0].tender_api_url.replace('http://', 'https://');
        console.log('Tender API URL:', tenderApiUrl);
        const tenderResponse = await fetch(tenderApiUrl);
        if (!tenderResponse.ok) {
          console.log('Second API call failed for unit ID:', bid.unit_id);
          return null;
        }
        
        const tenderData = await tenderResponse.json();
        console.log('Tender data:', tenderData);
        const unitName = tenderData.records?.[0]?.detail?.["機關資料:機關名稱"] || null;
        console.log('Found unit name:', unitName);
        return unitName;
      }
      return null;
    } catch (error) {
      console.error('Error fetching unit name:', error);
      return null;
    }
  };

  const fetchUnitNames = async () => {
    console.log('Starting to fetch unit names');
    setFetchingNames(true);
    
    for (const bid of winningBids) {
      console.log('Checking unit:', bid.unit_name, 'isUnitId:', isUnitId(bid.unit_name));
      if (isUnitId(bid.unit_name) && bid.unit_id) {
        const actualName = await fetchUnitName(bid);
        console.log('Got actual name:', actualName, 'for unit:', bid.unit_name);
        if (actualName) {
          setUnitNames(prev => ({
            ...prev,
            [bid.unit_name]: actualName
          }));
          console.log(`${bid.unit_name} => ${actualName}`);
        }
      }
    }
    
    setFetchingNames(false);
  };

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
          try {
            console.log('Fetching tender details for:', record.job_number);
            const tenderResponse = await fetch(
              `https://pcc.g0v.ronny.tw/api/tender?unit_id=${record.unit_id}&job_number=${record.job_number}`
            );
            const tenderData = await tenderResponse.json();
            
            const recordWithDetails = tenderData.records?.[0]?.detail?.url
              ? {
                  ...record,
                  detail: {
                    url: tenderData.records[0].detail.url
                  }
                }
              : record;

            // Append each record as it's processed
            setWinningBids(prev => [...prev, recordWithDetails]);
          } catch (err) {
            console.error('Error fetching tender details:', err);
            // Still add the record even if tender details fail
            setWinningBids(prev => [...prev, record]);
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

  useEffect(() => {
    if (winningBids.length > 0) {
      fetchUnitNames();
    }
  }, [winningBids]);

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchWinningBids();
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
          <button
            onClick={fetchUnitNames}
            disabled={fetchingNames || winningBids.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              fetchingNames || winningBids.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {fetchingNames ? 'Fetching Names...' : 'Refresh Unit Names'}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setCompanyId('05076416');
              fetchWinningBids();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            資策會
          </button>
          <button
            type="button"
            onClick={() => {
              setCompanyId('04170821');
              fetchWinningBids();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            電腦公會
          </button>
          <button
            type="button"
            onClick={() => {
              setCompanyId('02750963');
              fetchWinningBids();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            工研院
          </button>
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
                    {unitNames[bid.unit_name] || bid.unit_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.detail?.url ? (
                      <a 
                        href={bid.detail.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {bid.job_number}
                      </a>
                    ) : (
                      bid.job_number
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}               <tbody className="bg-white divide-y divide-gray-200">
                  {unitCounts.map((unit, index) => (
                    <tr
                      key={unit.unit_name}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unitNames[unit.unit_name] || unit.unit_name}
                      </td>
                      {years.map((year) => (
                        <td
                          key={year}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {unit.years[year] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}