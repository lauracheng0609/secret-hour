export type FeeItemType = "base" | "addon" | "timeunit";

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
  isBase: boolean;
  type: FeeItemType;
  unitMinutes?: number;
}

export interface Therapist {
  id: string;
  name: string;
  nickname?: string;
  contact?: string;
  note?: string;
  avatar?: string; // base64 data URL
  isFavorite?: boolean;
  calendarColor?: string;
  memo?: string;
  anniversaryDate?: string;
  feeItems: FeeItem[];
  depositAmount: number;
  createdAt: string;
}

export interface AppointmentFeeItem {
  feeItemId: string;
  label: string;
  amount: number;
  units?: number;
  unitMinutes?: number;
}

export interface WishItem {
  id: string;
  place: string;
  address?: string;
  url?: string;
  memo?: string;
  isRealized?: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  therapistId: string;
  therapistName: string;
  date: string;
  time: string;
  location: string;
  selectedFeeItems: AppointmentFeeItem[];
  depositPaid: number;
  totalAmount: number;
  balanceDue: number;
  note?: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: string;
}
