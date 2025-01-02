import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ProcurementRecord, UnitCount, ApiResponse } from '../types';

const isUnitId = (unitName: string) => {
  // Match any of these patterns:
  // 1. Contains both letters and numbers (e.g., "A.29.1")
  // 2. Starts with a number (e.g., "29.1")
  // 3. Contains only numbers and punctuation (e.g., "1.2.3")
  return /[A-Za-z].*\d|\d.*[A-Za-z]/.test(unitName) || // Pattern 1
         /^\d/.test(unitName) || // Pattern 2
         /^[\d\.\-]+$/.test(unitName); // Pattern 3
};

interface CompanyNameKey {
  [key: string]: string[];
}

interface CompanyIdKey {
  [key: string]: string[];
}

interface Companies {
  ids: string[];
  names: string[];
  id_key: CompanyIdKey;
  name_key: CompanyNameKey;
}

interface Brief {
  type: string;
  title: string;
  companies: Companies;
}

interface ProcurementData {
  date: number;
  brief: Brief;
  unit_name: string;
  unit_id: string;
}

export default function Dashboard() {
  const [companyId, setCompanyId] = useState('05076416');
  const [inputValue, setInputValue] = useState('05076416');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitCounts, setUnitCounts] = useState<UnitCount[]>([]);
  const [unitNames, setUnitNames] = useState<Record<string, string>>({});
  const [fetchingNames, setFetchingNames] = useState(false);

  const fetchUnitName = async (unitId: string) => {
    try {
      console.log('Fetching unit name for ID:', unitId);
      const response = await fetch(`https://pcc.g0v.ronny.tw/api/listbyunit?unit_id=${unitId}`);
      if (!response.ok) {
        console.log('First API call failed for unit ID:', unitId);
        return null;
      }
      
      const data = await response.json();
      console.log('First API response:', data);
      
      if (data.records && data.records.length > 0) {
        console.log('Tender API URL:', data.records[0].tender_api_url);
        const tenderResponse = await fetch(data.records[0].tender_api_url);
        if (!tenderResponse.ok) {
          console.log('Second API call failed for unit ID:', unitId);
          return null;
        }
        
        const tenderData = await tenderResponse.json();
        console.log('Tender data:', tenderData);
        const unitName = tenderData.records?.[0]?.detail?.["機關資料：機關名稱"] || null;
        console.log('Found unit name:', unitName);
        return unitName;
      }
      return null;
    } catch (error) {
      console.error('Error fetching unit name:', error);
      return null;
    }
  };

  const processData = (records: ProcurementData[]) => {
    const unitMap = new Map<string, UnitCount>();

    records.forEach((record) => {
      // Check if the company won the bid
      const companyWonBid = Object.entries(record.brief.companies.name_key).some(([name, keys]) => {
        // Find the corresponding company ID
        const companyIdEntry = Object.entries(record.brief.companies.id_key).find(([id, idKeys]) => {
          // Match the bidder number (e.g., "投標廠商 1") between name_key and id_key
          const nameKey = keys[0];  // e.g., "投標廠商：投標廠商 1:廠商名稱"
          const idKey = idKeys[0];  // e.g., "投標廠商：投標廠商 1:廠商代碼"
          return nameKey.split(':')[1] === idKey.split(':')[1];
        });

        // Only count if this is our target company and they won the bid
        return companyIdEntry?.[0] === companyId && keys.some((key: string) => key.includes(':得標廠商'));
      });

      if (!companyWonBid) {
        return;  // Skip this record if the company didn't win the bid
      }

      const year = record.date.toString().substring(0, 4);
      const unit = record.unit_name;
      const unitId = record.unit_id;

      if (!unitMap.has(unit)) {
        unitMap.set(unit, {
          unit_name: unit,
          unit_id: unitId,
          years: {},
        });
      }

      const unitData = unitMap.get(unit)!;
      unitData.years[year] = (unitData.years[year] || 0) + 1;
    });

    // Sort by sum of last three years
    const currentYear = new Date().getFullYear();
    const lastThreeYears = [currentYear - 2, currentYear - 1, currentYear];

    return Array.from(unitMap.values())
      .sort((a, b) => {
        const sumA = lastThreeYears.reduce((sum, year) => sum + (a.years[year] || 0), 0);
        const sumB = lastThreeYears.reduce((sum, year) => sum + (b.years[year] || 0), 0);
        return sumB - sumA;
      });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let page = 1;
      let keepFetching = true;
      const allRecords: ProcurementData[] = [];

      while (keepFetching) {
        const response = await fetch(
          `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=${page}`
        );
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data: ApiResponse = await response.json();
        
        if (!data.records || data.records.length === 0) {
          break;
        }

        const recentRecords = data.records.filter((r: ProcurementData) => {
          const recordYear = parseInt(r.date.toString().slice(0, 4), 10);
          return recordYear >= new Date().getFullYear() - 3;
        });

        allRecords.push(...recentRecords);

        if (recentRecords.length < data.records.length) {
          keepFetching = false;
        } else {
          page++;
        }
      }

      setUnitCounts(processData(allRecords));
    } catch (err: any) {
      setError(`Failed to fetch data. Please try again. ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchUnitNames = async () => {
    setFetchingNames(true);
    const newUnitNames: Record<string, string> = {};
    
    for (const unit of unitCounts) {
      console.log('Checking unit:', unit.unit_name, 'isUnitId:', isUnitId(unit.unit_name));
      if (isUnitId(unit.unit_name) && unit.unit_id) {
        const actualName = await fetchUnitName(unit.unit_id);
        console.log('Got actual name:', actualName, 'for unit:', unit.unit_name);
        if (actualName) {
          newUnitNames[unit.unit_name] = actualName;
        }
      }
    }
    
    console.log('Final unit names:', newUnitNames);
    setUnitNames(newUnitNames);
    setFetchingNames(false);
  };

  useEffect(() => {
    if (unitCounts.length > 0) {
      fetchUnitNames();
    }
  }, [unitCounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyId(inputValue);
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              標案贏家 Dashboard
            </h1>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter Company ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Search size={20} />
                </button>
              </div>
              <button
                type="button"
                onClick={fetchUnitNames}
                disabled={fetchingNames || unitCounts.length === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  fetchingNames || unitCounts.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {fetchingNames ? 'Fetching Names...' : 'Refresh Unit Names'}
              </button>
            </form>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setInputValue('05076416')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                資策會
              </button>
              <button
                type="button"
                onClick={() => setInputValue('04170821')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                電腦公會
              </button>
              <button
                type="button"
                onClick={() => setInputValue('02750963')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                工研院
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Name
                    </th>
                    {years.map((year) => (
                      <th
                        key={year}
                        className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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