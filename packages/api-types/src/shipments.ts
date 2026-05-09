export type ShipmentStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type CreateShipmentPayload = {
  origin: string;
  destination: string;
  description: string;
  driverId?: string;
  createdById: string;
};

export type ShipmentByIdPayload = {
  id: string;
};

export type UpdateShipmentStatusPayload = {
  id: string;
  status: ShipmentStatus;
};
