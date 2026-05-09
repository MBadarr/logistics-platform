import type { ShipmentStatus } from "./shipments.js";

export type ShipmentEventPayload = {
  id: string;
  trackingNo: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  createdById: string;
};
