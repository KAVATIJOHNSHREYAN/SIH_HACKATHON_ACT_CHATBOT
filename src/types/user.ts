export type UserRole = "User" | "Student" | "Developer" | "Moderator" | "Admin" | "Super Admin";
export type UserPlan = "Free" | "Pro" | "Enterprise";

export interface UserAchievement {
  title: string;
  desc: string;
  earnedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  plan: UserPlan;
  bio: string;
  avatar?: string;          // base64 data URL or empty
  createdAt: string;
  lastLogin: string;
  achievements: UserAchievement[];
}

export const DEFAULT_USER: UserProfile = {
  id: "",
  name: "",
  email: "",
  organization: "",
  role: "User",
  plan: "Free",
  bio: "",
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  achievements: [],
};
