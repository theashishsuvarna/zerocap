export type UserRole = 'creator' | 'hirer';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'payment_pending'
  | 'payment_initiated'
  | 'payment_verified'
  | 'paid'
  | 'delivered'
  | 'completed'
  | 'failed';

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'verified'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string;
  portfolio_url: string;
  upi_id: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface Gig {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  tags: string[];
  delivery_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
}

export interface Job {
  id: string;
  hirer_id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills_required: string[];
  status: 'open' | 'closed' | 'awarded';
  created_at: string;
  updated_at: string;
  hirer?: Profile;
}

export interface Order {
  id: string;
  gig_id: string | null;
  job_id: string | null;
  hirer_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: OrderStatus;
  order_ref: string | null;
  created_at: string;
  updated_at: string;
  hirer?: Profile;
  creator?: Profile;
  gig?: Gig;
}

export interface Payment {
  id: string;
  order_id: string;
  hirer_id: string;
  creator_id: string;
  amount: number;
  upi_id: string;
  method: string;
  status: PaymentStatus;
  transaction_ref: string | null;
  verified_at: string | null;
  verified_by: string | null;
  utr_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  order_id: string;
  creator_id: string;
  hirer_id: string;
  title: string;
  description: string;
  original_file_path: string;
  preview_file_path: string | null;
  file_type: string;
  file_size: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id: string | null;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string | null;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  image_url: string | null;
  project_link: string | null;
  skills_used: string[];
  created_at: string;
  updated_at: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  payment_pending: 'Payment Pending',
  payment_initiated: 'Payment Initiated',
  payment_verified: 'Payment Verified',
  paid: 'Paid',
  delivered: 'Delivered',
  completed: 'Completed',
  failed: 'Failed',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  initiated: 'Initiated',
  verified: 'Verified',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  accepted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  payment_pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  payment_initiated: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  payment_verified: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  delivered: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const GIG_CATEGORIES = [
  'Design',
  'Development',
  'Writing',
  'Video',
  'Music',
  'Marketing',
  'Photography',
  '3D & Animation',
  'AI Services',
  'Consulting',
];
