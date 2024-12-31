import React, { useEffect, useState } from 'react';

export default function TableDashboard() {
  const [data, setData] = useState<{ unit_name: string; count: number }[]>([]);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    const fetchData = async (query = '05076416') => {
      try {
        const res = await fetch(
          `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${query}&page=1`
        );
        if (!res.ok) throw new Error('Error fetching data');
        const json = await res.json();
        setRawData(json);
        const currentYear = new Date().getFullYear();
        // Filter by last 3 years
        const filtered = json.records.filter((r: any) => {
          const recordYear = Math.floor(r.date / 10000);
          return recordYear >= currentYear - 2; 
        });
        // Count per unit_name
        const counts: Record<string, number> = {};
        filtered.forEach((item: any) => {
          counts[item.unit_name] = (counts[item.unit_name] || 0) + 1;
        });
        // Convert to array
        const results = Object.keys(counts).map(unit => ({
          unit_name: unit,
          count: counts[unit]
        }));
        setData(results);
      } catch (err: any) {
        setError(`Failed to fetch data. Please try again. ${err.message || err}`);
      }
    };
    fetchData(); // default query
  }, []);

  return (
    <div>
      {error && <p>{error}</p>}
      {rawData && (
        <pre>{JSON.stringify(rawData, null, 2)}</pre>
      )}
      <table>
        <thead>
          <tr>
            <th>Unit Name</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.unit_name}>
              <td>{row.unit_name}</td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}