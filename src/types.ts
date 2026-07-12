/**
 * Types and interfaces for the BB Telegram Mini Toolset.
 */

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  balance: number;
  avatarUrl: string;
  vipLevel: number;
}

export interface GeneratedCard {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  network: "Visa" | "Mastercard" | "Amex" | "Discover" | "Unknown";
  formatted: string;
}

export interface BinInfo {
  bin: string;
  brand: string;
  type: string;
  level: string;
  bank: string;
  country: string;
}

export interface TempEmail {
  id: string;
  sender: string;
  senderName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface FakeAddress {
  id: string;
  gender: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  countryCode: string;
  phone: string;
  ssn: string;
  dob: string;
  username: string;
  password: string;
  company: string;
  jobTitle: string;
  avatar: string;
}

export type TabId = "home" | "cardgen" | "tempmail" | "addressgen" | "profile" | "admin";
