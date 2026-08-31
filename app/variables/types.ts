export type ManualEditState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  status?: "updated";
};

export type SearchParams = Promise<{
  query?: string;
  subsystem?: string;
  sort?: string;
}>;
