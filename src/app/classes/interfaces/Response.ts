export interface BaseResponse {
  status: number;
  message: string;
}

export interface PagedResponse<T> extends BaseResponse {
  page_number: number;
  page_size: number;
  total_pages: number;
  total_records: number;
  list: T[];
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}