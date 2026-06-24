"use client";

import { Therapist, Appointment } from "./types";

const THERAPISTS_KEY = "sh_therapists";
const APPOINTMENTS_KEY = "sh_appointments";

export function getTherapists(): Therapist[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(THERAPISTS_KEY);
  if (!raw) return [];
  const data: Therapist[] = JSON.parse(raw);
  // migrate legacy feeItems that have no `type` field
  return data.map((t) => ({
    ...t,
    feeItems: t.feeItems.map((fi) => ({
      ...fi,
      type: fi.type ?? (fi.isBase ? "base" : "addon"),
    })),
  }));
}

export function saveTherapist(therapist: Therapist): void {
  const all = getTherapists();
  const idx = all.findIndex((t) => t.id === therapist.id);
  if (idx >= 0) all[idx] = therapist;
  else all.push(therapist);
  localStorage.setItem(THERAPISTS_KEY, JSON.stringify(all));
}

export function saveTherapistMemo(id: string, memo: string): void {
  const all = getTherapists();
  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], memo: memo || undefined };
    localStorage.setItem(THERAPISTS_KEY, JSON.stringify(all));
  }
}

export function deleteTherapist(id: string): void {
  const all = getTherapists().filter((t) => t.id !== id);
  localStorage.setItem(THERAPISTS_KEY, JSON.stringify(all));
}

export function getAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(APPOINTMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAppointment(appointment: Appointment): void {
  const all = getAppointments();
  const idx = all.findIndex((a) => a.id === appointment.id);
  if (idx >= 0) all[idx] = appointment;
  else all.push(appointment);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
}

export function deleteAppointment(id: string): void {
  const all = getAppointments().filter((a) => a.id !== id);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
