interface PccRecord {
  date: string;
  // ... other fields
}

export const fetchPccDataUntilOld = async (companyId: string): Promise<PccRecord[]> => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  
  let currentPage = 1;
  let allData: PccRecord[] = [];
  let hasOldData = false;

  while (!hasOldData) {
    const response = await fetch(
      `https://pcc.g0v.ronny.tw/api/searchbycompanyid?query=${companyId}&page=${currentPage}`
    );
    
    if (!response.ok) {
      break;
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      break;
    }

    // Check if any record is older than three years
    hasOldData = data.some(record => {
      const recordDate = new Date(record.date);
      return recordDate < threeYearsAgo;
    });

    allData = [...allData, ...data];
    currentPage++;
  }

  return allData;
};
