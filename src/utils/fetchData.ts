import axios from 'axios';

interface PccApiResponse {
  records: Array<{
    date: string;
    // ...other fields...
  }>;
}

export async function fetchAllRecentData(companyId: string): Promise<PccApiResponse[]> {
  const results: PccApiResponse[] = [];
  let page = 1;
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  while (true) {
    try {
      const response = await axios.get<PccApiResponse>(
        `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=${page}`
      );

      if (!response.data.records || response.data.records.length === 0) {
        break;
      }

      // Check if the last record is older than 3 years
      const lastRecordDate = new Date(response.data.records[response.data.records.length - 1].date);
      if (lastRecordDate < threeYearsAgo) {
        // Filter out records older than 3 years and add the remaining ones
        const recentRecords = response.data.records.filter(
          record => new Date(record.date) >= threeYearsAgo
        );
        if (recentRecords.length > 0) {
          results.push({ ...response.data, records: recentRecords });
        }
        break;
      }

      results.push(response.data);
      page++;
    } catch (error) {
      console.error('Error fetching data:', error);
      break;
    }
  }

  return results;
}
