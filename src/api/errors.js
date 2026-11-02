// O ValidationPipe do Nest devolve `message` como array; as demais respostas, como string.
const firstMessage = (data) =>
  Array.isArray(data?.message) ? data.message[0] : data?.message;

export class ApiError extends Error {
  constructor(status, data) {
    super(firstMessage(data) ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.apiMessage = firstMessage(data);
  }
}
