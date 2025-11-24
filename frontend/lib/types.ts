export interface OAuthProvider {
  provider: string
  provider_id: string
}

export interface UserRestrictions {
  id?: number
  user_id: number
  disable_promptpay: boolean
  disable_truemoney: boolean
  disable_bot: boolean
  disable_all: boolean
  reason?: string | null
  restricted_by?: number | null
  created_at?: string
  updated_at?: string
}

export interface DiscordInfo {
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  discriminator: string | null
  providerData?: any
  linkedAt: string | null
}

export interface User {
  id: number | string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: "user" | "admin"
  balance?: string | number
  is_banned?: boolean
  ban_reason?: string | null
  banned_at?: string | null
  oauth_provider?: string | null
  oauth_provider_id?: string | null
  oauth_providers?: OAuthProvider[]
  restrictions?: UserRestrictions | null
  two_factor_secret?: string | null
  last_activity?: string | null
  current_page?: string | null
  created_at: string
  updated_at?: string
  last_login_at?: string
  discord?: DiscordInfo | null
}

export interface HostingPlan {
  id: number
  name: string
  name_th: string
  description: string
  description_th: string
  price: string
  disk_space: number
  bandwidth: number
  databases: number
  email_accounts: number
  subdomains: number
  addon_domains: number
  ftp_accounts: number
  category_id?: number | null
  category_name?: string
  package_id?: string | null
  agent_price?: string | null
  has_ssl?: boolean
  has_softaculous?: boolean
  has_directadmin?: boolean
  has_backup?: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Gift {
  id: number
  user_id: number
  created_by?: number | null
  gift_type: "hosting" | "balance"
  plan_id?: number | null
  balance_amount?: string | null
  duration_months?: number
  message?: string | null
  is_claimed: boolean
  claimed_at?: string | null
  created_at: string
  plan_name?: string | null
  plan_name_th?: string | null
  plan_price?: string | null
  created_by_email?: string | null
  created_by_first_name?: string | null
  created_by_last_name?: string | null
}

export interface MagicMail {
  id: number
  title: string
  message: string
  include_discord_button: boolean
  cta_label?: string | null
  cta_url?: string | null
  created_at: string
}

export interface Hosting {
  id: number
  user_id: number
  plan_id: number
  domain: string
  username: string
  da_password?: string
  password?: string
  control_panel?: string
  control_panel_url?: string
  status: "pending" | "active" | "suspended" | "expired" | "deleted"
  start_date: string
  expire_date: string
  auto_renew: boolean
  created_at: string
  updated_at: string
  suspended_at?: string
  deleted_at?: string
  scheduled_delete_at?: string
  admin_note?: string | null
  admin_note_at?: string | null
  plan_name?: string
  plan_name_th?: string
  plan_price?: string
  user_email?: string
  first_name?: string
  last_name?: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  title_th: string
  message: string
  message_th: string
  type: "info" | "warning" | "success" | "error"
  is_read: boolean
  created_at: string
}

export interface Transaction {
  id: number
  user_id: number
  type: "topup" | "purchase" | "renew" | "refund"
  amount: string
  description: string
  reference_id?: string | null
  status: "pending" | "completed" | "failed"
  created_at: string
}

export interface TopupRequest {
  id: number
  user_id: number
  amount: string
  payment_method: "promptpay" | "truemoney" | "manual"
  payment_proof?: string | null
  slip_image_url?: string
  payment_id?: string
  qr_code_url?: string
  payment_link?: string
  expires_at?: string
  completed_at?: string | null
  status: "pending" | "approved" | "rejected" | "expired"
  admin_note?: string | null
  created_at: string
  updated_at?: string
  email?: string
  first_name?: string
  last_name?: string
}

export interface PromptPayPayment {
  topup_id: number
  payment_id: string
  amount: number
  qr_code_url: string
  payment_link: string
  expires_at: string
  expires_in_minutes: number
}

export interface PromptPayStatus {
  success: boolean
  status: "pending" | "completed" | "expired"
  message: string
  amount?: number
}

export interface TrueMoneyRedemption {
  success: boolean
  message: string
  amount: number
  balance?: number
  error_code?: string
}

export interface Invoice {
  id: number
  user_id: number
  hosting_id: number
  invoice_number: string
  amount: string
  status: "pending" | "paid" | "overdue" | "cancelled"
  due_date: string | null
  paid_at: string | null
  created_at: string
  domain?: string
  email?: string
  first_name?: string
  last_name?: string
}

export interface File {
  id: number
  user_id: number
  filename: string
  original_filename: string
  file_path?: string
  file_type?: string
  file_size: number
  mime_type?: string
  description?: string | null
  is_public?: boolean
  public_token?: string | null
  file_data?: string // Only included when fetching single file
  created_at: string
  updated_at?: string
}

export interface HostingCategory {
  id: number
  name: string
  description?: string | null
  module: "directadmin" | "cpanel" | "plesk" | "custom"
  directadmin_ip?: string | null
  directadmin_url?: string | null
  directadmin_user?: string | null
  directadmin_pass?: string | null
  ns1?: string | null
  ns2?: string | null
  is_active: boolean
  connection_status?: "online" | "offline" | "unknown"
  created_at: string
  updated_at?: string
}

export interface HostingCategoryStats {
  total_count: number
  active_count: number
  online_servers: number
  total_packages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BotInstance {
  id: number
  user_id: number
  name: string
  bot_type: "nodejs" | "python"
  status: "running" | "stopped" | "error"
  folder_path: string
  entry_file: string
  process_id?: number | null
  dependencies?: string | null
  port?: number | null
  start_date?: string | null
  expire_date?: string | null
  auto_restart: boolean
  restart_count: number
  last_restart_at?: string | null
  created_at: string
  updated_at: string
}

export interface ApiToken {
  id: number
  user_id: number
  token: string
  name: string
  webhook_url?: string | null
  webhook_secret?: string | null
  ip_whitelist?: string | null
  is_active: boolean
  created_at: string
}

export interface HarFile {
  id: number
  user_id: number
  is_valid: boolean
  last_checked?: string | null
  created_at: string
}
