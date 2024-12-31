import Dashboard from './components/Dashboard';
import { useState, useEffect } from 'react';

function App() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return <Dashboard tableData={tableData} />;
}

export default App;

export async function fetchProcurementData(companyId: string, page: number = 1): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=${page}`
    );
    if (!response.ok) {
      console.error('Network response was not ok', response.status, response.statusText);
      throw new Error('Network response was not ok');
    }
    const jsonResponse = await response.json();
    console.log('JSON response:', jsonResponse);
    return jsonResponse;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log('Fetching data for companyId:', companyId);
    let page = 1;
    let keepFetching = true;
    const allRecords: ProcurementRecord[] = [];

    while (keepFetching) {
      const data = await fetchProcurementData(companyId, page);
      const recentRecords = data.records.filter((r) => {
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

    setTableData(
      Object.entries(
        allRecords.reduce((acc, curr) => {
          acc[curr.unit_name] = (acc[curr.unit_name] || 0) + 1;
          return acc;
        }, {})
      ).map(([unit_name, count]) => ({ unit_name, count }))
    );
    setUnitCounts(processData(allRecords));
  } catch (err) {
    console.error('Fetch data error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(`Failed to fetch data. ${message}`);
  } finally {
    setLoading(false);
  }
};