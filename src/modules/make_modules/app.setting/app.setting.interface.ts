import { Types } from "mongoose";

export type TSettingType =
  | "general"
  | "modules"
  | "currency_format"
  | "printer"
  | "security"
  | "titles"
  | "whatsApp"
  | "notification"
  | "invoice"
  | "proforma_invoice"
  | "sales_receipt"
  | "estimate"
  | "delivery_challan"
  | "purchase_order"
  | "bill"
  | "credit_note"
  | "debit_note"
  | "expense"
  | "product"
  | "service"
  | "time_log";

export type TDocumentSubType =
  | "field_visibility"
  | "general"
  | "columns"
  | "summary"
  | "print_email"
  | "payment";
export type TProductSubType = "field_visibility" | "general" | "stock";
export type TTimeLogSubType = "columns" | "summary";
export type TSettingSubType = TDocumentSubType | TProductSubType | TTimeLogSubType;

export type TDocFieldVisibility = {
  due_date?: boolean;
  shipping_address?: boolean;
  internal_notes?: boolean;
  street1?: boolean;
  street2?: boolean;
  zip_code?: boolean;
  city?: boolean;
  state?: boolean;
  country?: boolean;
  sub_title?: boolean;
  po?: boolean;
  po_date?: boolean;
  recipient_name?: boolean;
  shipping_cost_and_method?: boolean;
  shipping_tax?: boolean;
  salesperson?: boolean;
  payment_methods?: boolean;
  payment_type?: boolean;
  apply_discount_before_tax?: boolean;
  terms_conditions?: boolean;
  notes?: boolean;
  attachment?: boolean;
};

export type TDocColumns = {
  service_name?: boolean;
  product_name?: boolean;
  description?: boolean;
  quantity?: string;
  discount?: boolean;
  mrp?: boolean;
  tax?: boolean;
  line_description_full_width?: boolean;
  stock_in_suggestion_list?: boolean;
  description_in_suggestion_list?: boolean;
  buy_price_in_suggestion_list?: boolean;
  sell_price_in_suggestion_list?: boolean;
  item_code_in_suggestion_list?: boolean;
  auto_fit?: boolean;
};

export type TDocSummary = {
  total_quantity?: boolean;
  round_off?: boolean;
  negative_value_format?: boolean;
  subtotal_with_tax?: string;
  contact_note_as_default_note?: boolean;
  custom_charges?: boolean;
  inline_discount?: boolean;
  show_line_total_with_tax?: boolean;
};

export type TDocPrintEmail = {
  mark_as_sent_on_print?: boolean;
  mark_as_sent_on_email_or_whatsApp?: boolean;
  combine_pdf_in_email?: boolean;
  number_of_copies_on_print?: string;
};

export type TDocPayment = {
  cash_received_denomination?: boolean;
};

export type TDocumentConfig = {
  field_visibility?: TDocFieldVisibility;
  general?: {
    line_option?: string;
    create_public_url_in_email?: boolean;
    track_purchase_orders_in_stock?: boolean;
  };
  columns?: TDocColumns;
  summary?: TDocSummary;
  print_email?: TDocPrintEmail;
  payment?: TDocPayment;
};

export type TSetting = {
  user_id: Types.ObjectId;

  general: {
    chat?: boolean;
    create_public_url_in_email?: boolean;
    appearance?: string;
    default_mail?: string;
  };

  modules: Record<string, boolean>;

  currency_format: {
    currency?: string;
    currency_symbol?: boolean;
    currency_code?: boolean;
    multi_currency_display?: boolean;
    exchange_rates?: boolean;
    decimal_places?: number;
    date_number_format?: string;
    language?: string;
    timezone?: string;
  };

  printer: {
    print_mode?: string;
  };

  security: {
    app_lock_enabled?: boolean;
  };

  titles: Record<string, string>;

  whatsApp: {
    enabled?: boolean;
    send_via?: string;
  };

  /** Reminder / recurring notification preferences (Notification Settings UI). */
  notification?: {
    timezone?: string;
    notification_time?: string;
    recurring?: {
      auto_send_invoice?: boolean;
      daily?: boolean;
      weekly?: boolean;
      monthly?: boolean;
    };
    payment_reminder?: {
      auto_send_payment_receipt?: boolean;
      default_for_new_customer?: boolean;
      days_before_due_3?: boolean;
      on_due_date?: boolean;
      days_after_due_3?: boolean;
      days_after_due_7?: boolean;
    };
  };

  invoice: TDocumentConfig;
  proforma_invoice: TDocumentConfig;
  sales_receipt: TDocumentConfig;
  estimate: TDocumentConfig;
  delivery_challan: TDocumentConfig;
  purchase_order: TDocumentConfig;
  bill: TDocumentConfig;
  credit_note: TDocumentConfig;
  debit_note: TDocumentConfig;

  expense: {
    round_off?: boolean;
    payment_type?: boolean;
  };

  product: {
    field_visibility?: {
      hsn?: boolean;
      inventory?: boolean;
      mrp?: boolean;
    };
    general?: {
      product_img_on_line_item?: boolean;
      allow_zero_stock?: boolean;
    };
    stock?: {
      product_stock?: boolean;
      out_of_stock_items_online_store?: string;
    };
    checkout?: {
      product_price_on_checkout?: boolean;
      product_image_size?: string;
    };
  };

  service: {
    sac?: boolean;
  };

  time_log: {
    columns?: {
      include_project_in_create_invoice?: boolean;
      include_date_in_create_invoice?: boolean;
      include_notes_in_create_invoice?: boolean;
    };
    summary?: {
      time_log_rounding?: string;
    };
  };
};
