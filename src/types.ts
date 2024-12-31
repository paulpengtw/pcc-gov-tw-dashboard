export interface ProcurementRecord {
  unit_name: string;
  date: string;
}

export interface ApiResponse {
  records: ProcurementRecord[];
  total_records: number;
  total_pages: number;
}

export interface UnitCount {
  unit_name: string;
  count: number;
  years: { [key: string]: number };
}