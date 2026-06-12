export interface WorkingCopyInfo {
  '@id': string;
  created: string;
  creator_name: string;
  creator_url: string;
  title: string;
}

export interface GetWorkingcopyResponse {
  working_copy: WorkingCopyInfo;
  working_copy_of: null;
}

export interface CreateWorkingcopyResponse {
  '@id': string;
}
