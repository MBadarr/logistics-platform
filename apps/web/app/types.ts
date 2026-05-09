import type {
  AuthUser,
  ShipmentEventPayload,
  ShipmentStatus,
} from "@repo/api-types";

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type ShipmentTimelineEvent = {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  note?: string | null;
  createdAt: string;
};

export type ShipmentRecord = ShipmentEventPayload & {
  description: string;
  driverId?: string | null;
  timeline: ShipmentTimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ServiceHealth = "ready" | "offline" | "checking";

export type ShipmentDraft = {
  origin: string;
  destination: string;
  description: string;
  driverId: string;
};
