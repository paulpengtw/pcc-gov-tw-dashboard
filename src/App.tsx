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

export async function fetchProcurementData(companyId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=1`
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
    const data = await fetchProcurementData(companyId);
    const filtered = data.records.filter((r) => {
      const recordYear = parseInt(r.date.toString().slice(0, 4), 10);
      return recordYear >= new Date().getFullYear() - 3;
    });
    const grouped = filtered.reduce((acc, curr) => {
      acc[curr.unit_name] = (acc[curr.unit_name] || 0) + 1;
      return acc;
    }, {});
    setTableData(
      Object.entries(grouped).map(([unit_name, count]) => ({ unit_name, count }))
    );
    setUnitCounts(processData(data.records));
  } catch (err) {
    console.error('Fetch data error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(`Failed to fetch data. ${message}`);
  } finally {
    setLoading(false);
  }
};