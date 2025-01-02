export interface ProcurementRecord {
  date: string;
  unit_name: string;
  unit_id: string;
  [key: string]: any;
}

export interface UnitCount {
  unit_name: string;
  count: number;
}

export interface ApiResponse {
  page: number;
  total: number;
  total_page: number;
  records: ProcurementRecord[];
}