export interface ProcurementRecord {
  date: string;
  unit_name: string;
  unit_id: string;
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
  [key: string]: any;
}

export interface UnitCount {
  unit_name: string;
  unit_id: string;
  years: {
    [key: string]: number;
  };
}

export interface ApiResponse {
  page: number;
  total: number;
  total_page: number;
  records: ProcurementRecord[];
}