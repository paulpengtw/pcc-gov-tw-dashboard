export async function fetchProcurementData(companyId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=1`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}