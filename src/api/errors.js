export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
