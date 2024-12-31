import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { fetchProcurementData } from '../api';
import { ProcurementRecord, UnitCount } from '../types';

export default function Dashboard() {
  const [companyId, setCompanyId] = useState('05076416');
  const [inputValue, setInputValue] = useState('05076416');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitCounts, setUnitCounts] = useState<UnitCount[]>([]);
  const [rawData, setRawData] = useState<any>(null);

  const processData = (records: ProcurementRecord[]) => {
    const unitMap = new Map<string, UnitCount>();

    records.forEach((record) => {
      const year = record.date.toString().substring(0, 4);
      const unit = record.unit_name;

      if (!unitMap.has(unit)) {
        unitMap.set(unit, {
          unit_name: unit,
          count: 0,
          years: {},
        });
      }

      const unitData = unitMap.get(unit)!;
      unitData.count++;
      unitData.years[year] = (unitData.years[year] || 0) + 1;
    });

    return Array.from(unitMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProcurementData(companyId);
      setRawData(data);
      setUnitCounts(processData(data.records));
    } catch (err: any) {
      setError(`Failed to fetch data. Please try again. ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

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
              Procurement Dashboard
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
            </form>
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
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unitCounts.map((unit, index) => (
                    <tr
                      key={unit.unit_name}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unit.unit_name}
                      </td>
                      {years.map((year) => (
                        <td
                          key={year}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {unit.years[year] || 0}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {unit.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rawData && (
            <pre className="mt-4 bg-gray-100 p-4 rounded">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}