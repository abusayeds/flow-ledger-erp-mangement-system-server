import mongoose, { Schema, Document } from "mongoose";
import { TSetting } from "./app.setting.interface";

export type TSettingDocument = TSetting & Document;

// ── Shared document-type sub-schemas (superset of every document's fields) ──
const docFieldVisibilitySchema = new Schema(
  {
    due_date: Boolean,
    shipping_address: Boolean,
    internal_notes: Boolean,
    street1: Boolean,
    street2: Boolean,
    zip_code: Boolean,
    city: Boolean,
    state: Boolean,
    country: Boolean,
    sub_title: Boolean,
    po: Boolean,
    po_date: Boolean,
    recipient_name: Boolean,
    shipping_cost_and_method: Boolean,
    shipping_tax: Boolean,
    salesperson: Boolean,
    payment_methods: Boolean,
    payment_type: Boolean,
    apply_discount_before_tax: Boolean,
    terms_conditions: Boolean,
    notes: Boolean,
    attachment: Boolean,
  },
  { _id: false }
);

const docGeneralSchema = new Schema(
  {
    line_option: String,
    create_public_url_in_email: Boolean,
    track_purchase_orders_in_stock: Boolean,
  },
  { _id: false }
);

const docColumnsSchema = new Schema(
  {
    service_name: Boolean,
    product_name: Boolean,
    description: Boolean,
    quantity: String,
    discount: Boolean,
    mrp: Boolean,
    tax: Boolean,
    line_description_full_width: Boolean,
    stock_in_suggestion_list: Boolean,
    description_in_suggestion_list: Boolean,
    buy_price_in_suggestion_list: Boolean,
    sell_price_in_suggestion_list: Boolean,
    item_code_in_suggestion_list: Boolean,
    auto_fit: Boolean,
  },
  { _id: false }
);

const docSummarySchema = new Schema(
  {
    total_quantity: Boolean,
    round_off: Boolean,
    negative_value_format: Boolean,
    subtotal_with_tax: String,
    contact_note_as_default_note: Boolean,
    custom_charges: Boolean,
    inline_discount: Boolean,
    show_line_total_with_tax: Boolean,
  },
  { _id: false }
);

const docPrintEmailSchema = new Schema(
  {
    mark_as_sent_on_print: Boolean,
    mark_as_sent_on_email_or_whatsApp: Boolean,
    combine_pdf_in_email: Boolean,
    number_of_copies_on_print: String,
  },
  { _id: false }
);

const docPaymentSchema = new Schema(
  {
    cash_received_denomination: Boolean,
  },
  { _id: false }
);

const documentSchema = () =>
  new Schema(
    {
      field_visibility: docFieldVisibilitySchema,
      general: docGeneralSchema,
      columns: docColumnsSchema,
      summary: docSummarySchema,
      print_email: docPrintEmailSchema,
      payment: docPaymentSchema,
    },
    { _id: false }
  );

const settingSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    general: {
      chat: Boolean,
      create_public_url_in_email: Boolean,
      appearance: String,
      default_mail: String,
    },

    modules: {
      invoice: Boolean,
      proforma_invoice: Boolean,
      estimate: Boolean,
      delivery_challan: Boolean,
      bill: Boolean,
      credit_note: Boolean,
      debit_note: Boolean,
      expense: Boolean,
      sales_receipt: Boolean,
      packing_slip: Boolean,
      time_log: Boolean,
      purchase_order: Boolean,
      project: Boolean,
      team: Boolean,
      payment_received: Boolean,
      payment_made: Boolean,
      integrations: Boolean,
      banking: Boolean,
      rewards: Boolean,
      product: Boolean,
      service: Boolean,
      report: Boolean,
      pos: Boolean,
      my_documents: Boolean,
    },

    currency_format: {
      currency: String,
      currency_symbol: Boolean,
      currency_code: Boolean,
      multi_currency_display: Boolean,
      exchange_rates: Boolean,
      decimal_places: Number,
      date_number_format: String,
      language: String,
      timezone: String,
    },

    printer: {
      print_mode: String,
    },

    // App lock (Face ID / device passcode) preference — synced across devices.
    security: {
      app_lock_enabled: Boolean,
    },

    // Custom UI title overrides (Edit Titles): { <stable slug>: <custom text> }.
    titles: { type: Schema.Types.Mixed, default: {} },

    whatsApp: {
      enabled: Boolean,
      send_via: String,
    },

    // Notification Settings (reminders / recurring) — additive, optional.
    notification: {
      timezone: String,
      notification_time: String,
      recurring: {
        auto_send_invoice: Boolean,
        daily: Boolean,
        weekly: Boolean,
        monthly: Boolean,
      },
      payment_reminder: {
        auto_send_payment_receipt: Boolean,
        default_for_new_customer: Boolean,
        days_before_due_3: Boolean,
        on_due_date: Boolean,
        days_after_due_3: Boolean,
        days_after_due_7: Boolean,
      },
    },

    invoice: documentSchema(),
    proforma_invoice: documentSchema(),
    sales_receipt: documentSchema(),
    estimate: documentSchema(),
    delivery_challan: documentSchema(),
    purchase_order: documentSchema(),
    bill: documentSchema(),
    credit_note: documentSchema(),
    debit_note: documentSchema(),

    expense: {
      round_off: Boolean,
      payment_type: Boolean,
    },

    product: {
      field_visibility: {
        hsn: Boolean,
        inventory: Boolean,
        mrp: Boolean,
      },
      general: {
        product_img_on_line_item: Boolean,
        allow_zero_stock: Boolean,
      },
      stock: {
        product_stock: Boolean,
        out_of_stock_items_online_store: String,
      },
      checkout: {
        product_price_on_checkout: Boolean,
        product_image_size: String,
      },
    },

    service: {
      sac: Boolean,
    },

    time_log: {
      columns: {
        include_project_in_create_invoice: Boolean,
        include_date_in_create_invoice: Boolean,
        include_notes_in_create_invoice: Boolean,
      },
      summary: {
        time_log_rounding: String,
      },
    },
  },
  { timestamps: true }
);

export const SettingModel = mongoose.model<TSettingDocument>("Setting", settingSchema);
