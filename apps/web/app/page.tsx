"use client";

import type {
  LoginPayload,
  RegisterPayload,
  ShipmentStatus,
} from "@repo/api-types";
import { FormEvent, useMemo, useState } from "react";
import {
  createShipment,
  listShipments,
  login,
  register,
  updateShipmentStatus,
} from "./api";
import styles from "./page.module.css";
import type {
  AuthSession,
  ServiceHealth,
  ShipmentDraft,
  ShipmentRecord,
} from "./types";

const statusOptions: ShipmentStatus[] = [
  "PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const initialDraft: ShipmentDraft = {
  origin: "LHE-WH-001",
  destination: "KHI-CUST-981",
  description: "2 medium cartons, fragile",
  driverId: "DRV-1004",
};

const demoShipments: ShipmentRecord[] = [
  {
    id: "demo-1",
    trackingNo: "SHP-20260509-001",
    origin: "LHE-WH-001",
    destination: "KHI-CUST-981",
    description: "2 medium cartons, fragile",
    status: "IN_TRANSIT",
    createdById: "demo-user",
    driverId: "DRV-1004",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        id: "evt-1",
        shipmentId: "demo-1",
        status: "PENDING",
        note: "Shipment created",
        createdAt: new Date().toISOString(),
      },
      {
        id: "evt-2",
        shipmentId: "demo-1",
        status: "IN_TRANSIT",
        note: "Status changed to IN_TRANSIT",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "demo-2",
    trackingNo: "SHP-20260509-002",
    origin: "ISB-HUB-004",
    destination: "LHE-CUST-220",
    description: "Documents pouch",
    status: "OUT_FOR_DELIVERY",
    createdById: "demo-user",
    driverId: "DRV-1011",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [],
  },
];

function prettyStatus(status: ShipmentStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default function Home() {
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:3002");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [shipments, setShipments] = useState<ShipmentRecord[]>(demoShipments);
  const [draft, setDraft] = useState<ShipmentDraft>(initialDraft);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState<RegisterPayload>({
    email: "ops@example.com",
    name: "Operations Manager",
    password: "password123",
  });
  const [health, setHealth] = useState<ServiceHealth>("offline");
  const [message, setMessage] = useState("Demo data is loaded until the API is running.");

  const stats = useMemo(() => {
    const active = shipments.filter(
      (shipment) =>
        shipment.status !== "DELIVERED" && shipment.status !== "CANCELLED",
    ).length;

    return {
      total: shipments.length,
      active,
      delivered: shipments.filter((shipment) => shipment.status === "DELIVERED")
        .length,
      exceptions: shipments.filter((shipment) => shipment.status === "CANCELLED")
        .length,
    };
  }, [shipments]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHealth("checking");
    setMessage("Connecting to the API gateway...");

    try {
      const payload: LoginPayload = {
        email: authForm.email,
        password: authForm.password,
      };
      const nextSession =
        authMode === "register"
          ? await register(gatewayUrl, authForm)
          : await login(gatewayUrl, payload);
      const nextShipments = await listShipments(gatewayUrl, nextSession.accessToken);

      setSession(nextSession);
      setShipments(nextShipments);
      setHealth("ready");
      setMessage(`Signed in as ${nextSession.user.email}.`);
    } catch (error) {
      setHealth("offline");
      setMessage(error instanceof Error ? error.message : "Unable to reach gateway.");
    }
  }

  async function handleCreateShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setMessage("Sign in to create a shipment through the API gateway.");
      return;
    }

    try {
      const shipment = await createShipment(gatewayUrl, session.accessToken, {
        ...draft,
        driverId: draft.driverId || undefined,
      });
      setShipments((current) => [shipment, ...current]);
      setDraft(initialDraft);
      setMessage(`Created ${shipment.trackingNo}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Shipment creation failed.");
    }
  }

  async function handleStatusChange(id: string, status: ShipmentStatus) {
    if (!session) {
      setShipments((current) =>
        current.map((shipment) =>
          shipment.id === id
            ? { ...shipment, status, updatedAt: new Date().toISOString() }
            : shipment,
        ),
      );
      setMessage("Updated demo shipment locally. Sign in to persist changes.");
      return;
    }

    try {
      const updated = await updateShipmentStatus(gatewayUrl, session.accessToken, {
        id,
        status,
      });
      setShipments((current) =>
        current.map((shipment) => (shipment.id === id ? updated : shipment)),
      );
      setMessage(`${updated.trackingNo} moved to ${prettyStatus(updated.status)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Logistics command center</p>
          <h1>Shipment operations</h1>
        </div>
        <div className={styles.gateway}>
          <span className={`${styles.healthDot} ${styles[health]}`} />
          <label>
            API gateway
            <input
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              aria-label="API gateway URL"
            />
          </label>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Shipment statistics">
        <article>
          <span>Total shipments</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Active loads</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
        </article>
        <article>
          <span>Exceptions</span>
          <strong>{stats.exceptions}</strong>
        </article>
      </section>

      <section className={styles.workspace}>
        <form className={styles.panel} onSubmit={handleAuth}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Access</p>
              <h2>{session ? session.user.name : "Gateway sign in"}</h2>
            </div>
            <div className={styles.segmented} role="group" aria-label="Auth mode">
              <button
                type="button"
                className={authMode === "login" ? styles.selected : ""}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "register" ? styles.selected : ""}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>
          </div>
          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          {authMode === "register" ? (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <button className={styles.primaryButton} type="submit">
            {authMode === "register" ? "Create account" : "Connect"}
          </button>
          <p className={styles.notice}>{message}</p>
        </form>

        <form className={styles.panel} onSubmit={handleCreateShipment}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Dispatch</p>
              <h2>Create shipment</h2>
            </div>
          </div>
          <div className={styles.twoColumn}>
            <label>
              Origin
              <input
                value={draft.origin}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    origin: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Destination
              <input
                value={draft.destination}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Driver
            <input
              value={draft.driverId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  driverId: event.target.value,
                }))
              }
            />
          </label>
          <button className={styles.primaryButton} type="submit">
            Create shipment
          </button>
        </form>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Shipment service</p>
            <h2>Live shipment board</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>
                    <strong>{shipment.trackingNo}</strong>
                    <span>{shipment.description}</span>
                  </td>
                  <td>
                    {shipment.origin}
                    <span>{shipment.destination}</span>
                  </td>
                  <td>{shipment.driverId ?? "Unassigned"}</td>
                  <td>
                    <select
                      value={shipment.status}
                      onChange={(event) =>
                        void handleStatusChange(
                          shipment.id,
                          event.target.value as ShipmentStatus,
                        )
                      }
                      aria-label={`Status for ${shipment.trackingNo}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {prettyStatus(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={styles.badge}>
                      {shipment.timeline.length || 1} events
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
