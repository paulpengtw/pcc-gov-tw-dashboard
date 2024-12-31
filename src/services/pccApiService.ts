interface PccApiResponse {
  total: number;
  records: Array<{
    date: string;
    [key: string]: any;
  }>;
}

export class PccApiService {
  private static readonly BASE_URL = 'https://pcc.g0v.ronny.tw/api';
  private static readonly THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

  public static async fetchAllCompanyData(companyId: string): Promise<PccApiResponse['records']> {
    let page = 1;
    let allRecords: PccApiResponse['records'] = [];
    const threeYearsAgo = Date.now() - this.THREE_YEARS_MS;

    while (true) {
      const response = await fetch(
        `${this.BASE_URL}/searchbycompanyid?query=${companyId}&page=${page}`
      );
      const data: PccApiResponse = await response.json();

      if (!data.records || data.records.length === 0) {
        break;
      }

      // Check if we've reached data older than 3 years
      const lastRecordDate = new Date(data.records[data.records.length - 1].date).getTime();
      if (lastRecordDate < threeYearsAgo) {
        // Filter out records older than 3 years and add the rest
        const recentRecords = data.records.filter(
          record => new Date(record.date).getTime() >= threeYearsAgo
        );
        allRecords = [...allRecords, ...recentRecords];
        break;
      }

      allRecords = [...allRecords, ...data.records];
      page++;
    }

    return allRecords;
  }

  public static getTotalCount(records: PccApiResponse['records']): number {
    return records.length;
  }
}
