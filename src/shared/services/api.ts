const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://0.0.0.0:8080";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseJson(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options: FetchOptions): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const init: RequestInit = {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const payload = await parseJson(response);

  if (!response.ok) {
    // Extract common error shapes from the backend. Backend may return:
    // { message: '...', ... } or { error: { message: '...', status: 404 } }
    let message: any = null;
    if (payload) {
      if (typeof payload === "string") {
        message = payload;
      } else if (payload.message) {
        message = payload.message;
      } else if (payload.error && typeof payload.error === "string") {
        message = payload.error;
      } else if (payload.error && payload.error.message) {
        message = payload.error.message;
      } else {
        message = payload;
      }
    }

    const finalMessage =
      message && typeof message === "string"
        ? message
        : response.statusText || "Request failed";

    throw new Error(finalMessage);
  }

  return payload as T;
}

export async function get<T>(path: string) {
  return request<T>(path, { method: "GET" });
}

export async function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body });
}

export async function patch<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "PATCH", body });
}

export async function del<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "DELETE", body });
}
