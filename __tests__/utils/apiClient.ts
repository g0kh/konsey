type ApiCallOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

type RouteHandler = (
  request: Request,
  context?: { params: Promise<Record<string, string>> },
) => Promise<Response>;

const DEBUG = process.env.API_TEST_DEBUG === "true";

function log(message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[apiClient] ${message}`, data ?? "");
  }
}

export function buildRequest(
  path: string,
  options: ApiCallOptions = {},
): Request {
  const url = path.startsWith("http") ? path : `http://localhost${path}`;
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  return new Request(url, init);
}

export async function callRoute(
  handler: RouteHandler,
  path: string,
  options: ApiCallOptions = {},
  params?: Record<string, string>,
): Promise<Response> {
  const request = buildRequest(path, options);
  log(`${options.method ?? "GET"} ${path}`, options.body);

  const response = params
    ? await handler(request, { params: Promise.resolve(params) })
    : await handler(request);

  const clone = response.clone();
  let body: unknown;
  try {
    body = await clone.json();
  } catch {
    body = await clone.text();
  }

  log(`Response ${response.status}`, body);
  return response;
}

export async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
