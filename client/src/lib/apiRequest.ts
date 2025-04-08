type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest(method: HttpMethod, path: string, body?: any) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  return response;
}

export async function getClientBalance(clientId: number): Promise<string> {
  const response = await apiRequest("GET", `/api/clients/${clientId}/balance`);
  const data = await response.json();
  return data.balance;
}

export async function updateClientBalance(clientId: number, amount: number, description: string) {
  return apiRequest("POST", `/api/clients/${clientId}/updateBalance`, {
    amount,
    description
  });
}
