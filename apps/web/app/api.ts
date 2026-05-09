import type {
  CreateShipmentPayload,
  LoginPayload,
  RegisterPayload,
  UpdateShipmentStatusPayload,
} from "@repo/api-types";
import type { AuthSession, ShipmentRecord } from "./types";

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`;
    const message = await response
      .json()
      .then((body: { message?: string }) => body.message ?? fallback)
      .catch(() => fallback);

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function register(
  gatewayUrl: string,
  payload: RegisterPayload,
): Promise<AuthSession> {
  const response = await fetch(`${gatewayUrl}/api/auth/register`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return readJson<AuthSession>(response);
}

export async function login(
  gatewayUrl: string,
  payload: LoginPayload,
): Promise<AuthSession> {
  const response = await fetch(`${gatewayUrl}/api/auth/login`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  return readJson<AuthSession>(response);
}

export async function listShipments(
  gatewayUrl: string,
  token: string,
): Promise<ShipmentRecord[]> {
  const response = await fetch(`${gatewayUrl}/api/shipments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson<ShipmentRecord[]>(response);
}

export async function createShipment(
  gatewayUrl: string,
  token: string,
  payload: Omit<CreateShipmentPayload, "createdById">,
): Promise<ShipmentRecord> {
  const response = await fetch(`${gatewayUrl}/api/shipments`, {
    method: "POST",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return readJson<ShipmentRecord>(response);
}

export async function updateShipmentStatus(
  gatewayUrl: string,
  token: string,
  payload: UpdateShipmentStatusPayload,
): Promise<ShipmentRecord> {
  const response = await fetch(`${gatewayUrl}/api/shipments/${payload.id}/status`, {
    method: "PATCH",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: payload.status }),
  });

  return readJson<ShipmentRecord>(response);
}
