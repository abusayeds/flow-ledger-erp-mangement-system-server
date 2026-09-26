// export type TPDFSetting = {
//   style: {
//     text_color: string;
//     fill_color: string;
//     border_color: string;
//     fill_text_color: string;
//     font:| "arial"| "arial_bold"| "arial_italic"| "arial_bold_italic"
//       | "times"
//       | "times_bold"
//       | "times_italic"
//       | "times_bold_italic"
//       | "courier"
//       | "courier_bold"
//       | "courier_italic"
//       | "courier_bold_italic";
//     font_size: "small" | "normal" | "large" | "x-large" | "xx-large";
//     full_page: "yes" | "no";
//     horizontal_lines: "show" | "hide";
//     vertical_lines: "show" | "hide";
//     scaling: "fit_to_page" | "actual_size";
//     horizontal_alignment: "left" | "center" | "right";
//     vertical_alignment: "top" | "middle" | "bottom";
//     margin: {
//       top: number;
//       right: number;
//       bottom: number;
//       left: number;
//     };
//     outer_border: "show" | "hide";
//   };
//   columns: {
//     serial: boolean;
//     line_item_image: boolean;
//     variant_size: "with_product" | "separate_column" | "hide";
//     variant_type: "with_product" | "without_product" | "hide";
//     sku: boolean;
//     sac: boolean;
//     hsn: boolean;
//     quntity: "hide" | "show_for_both" | "show_for_product" | "show_for_service";
//     price: boolean;
//     discount: boolean;
//     tax: "hide" | "individual" | "combine";
//     line_item_tax_format:
//       | "show_as_percentage"
//       | "show_as_amount"
//       | "show_both_values";
//     item_display_order: "services_first" | "products_first" | "combined";
//     notes: "dark" | "light" | "hide";
//     line_total: boolean;
//     show_price_with_tax: "yes" | "no" | "default";
//     line_description_full_with: boolean;
//   };
//   header: {
//     title_alignment: "center" | "right";
//     sub_title_alignment: "center" | "right" | "left";
//     sub_title: boolean;
//     logo_size: "small" | "medium" | "large";
//     date_format: "short" | "medium" | "long";
//     logo: boolean;
//     header: boolean;
//     status_watermark: boolean;
//     number: boolean;
//     po_no: boolean;
//     due_date: boolean;
//     total_outstanding: boolean;
//     paid_amount: boolean;
//     qr_code: boolean;
//     qr_code_alignment: "left" | "center" | "right";
//     document_copy_label: boolean;
//     total_amount: boolean;
//     ganarated_by: boolean;
//     supply_type: boolean;
//     ganarated_date: boolean;
//     cancelled_date: boolean;
//     valid_till: boolean;
//   };
//   company: {
//     Reg_no: boolean;
//     reg_no_tax_id_align_below: "name" | "address";
//     tax_id: boolean;
//     name: boolean;
//     country: boolean;
//     address: boolean;
//     phone: boolean;
//     mobile: boolean;
//     fax: boolean;
//     email: boolean;
//     website: boolean;
//   };
//   contact: {
//     tax_id: boolean;
//     reg_no: boolean;
//     reg_no_tax_id_align_below: "name" | "address";
//     home_phone: boolean;
//     business_phone: boolean;
//     email: boolean;
//     email_below_contact: "name" | "address";
//     mobaile: boolean;
//     fax: boolean;
//     first_last_name: boolean;
//     mobile_below_contact: "name" | "address" , 
//     address_alignment : "left" |"right" ,
//     billing_adreess_alignment : "left" |"right" ,
//     shipping_adreess_alignment : "left" |"right" ,
//   };
//   summary: {
//     total_quantity: {
//         single_total : boolean,
//         group_by_unit : boolean ,
//     }
//     include_items_from :   {
//         products : boolean ,  
//         tasks : boolean
//     }
//     amount_unused : boolean , 
//     sub_total : boolean , 
//     discount : boolean ,
//     inline_discount : boolean ,
//     shipping_cost :  boolean , 
//     shipping_method : boolean ,
//     total :  boolean ,  
//     amount_due : boolean , 
//     amount_paid : boolean ,
//     amount_used : boolean ,
//     tax : "hide" | "individual" | "combine", 
//     tax_value : boolean , 
//     taxable_amount : boolean , 
//     tatal_in_words : boolean , 
//     hsc_sac_summary : boolean , 
//     return_order : boolean 
//   };
//   notes_terms: {
//     notes : boolean , 
//     notes_title : boolean , 
//     font_size : "small" | "medium" | "large" | "extra_large" , 
//     bank_details :  boolean ,
//     bank_details_title:  boolean  , 
//     full_with :  boolean , 
//     terms_and_condition : boolean
//   };
//   signature: {
//     company_sign : "hide" | "company" | "user" , 
//     contact_sign : boolean ,
//     company_signature_alignment : "center" | "right" | "left" , 
//     contact_signature_alignment : "center" | "right" | "left"
//     signature_size : "small" | "medium" | "large"
//   };
//   footer: {
//     created_moon_invoice_hyperlink : boolean ,  
//     show_tamplate_for_pages : "first" | "all" , 
//     page_number_alignment : "center" | "right" | "left"
//   };
// };

import { Types } from "mongoose";
import {
  TFont,
  TFontSize,
  TFullPage,
  TLines,
  TScaling,
  TAlignmentH,
  TAlignmentV,
  TOuterBorder,
  TVariantSize,
  TVariantType,
  TQuantity,
  TTaxDisplay,
  TLineItemTaxFormat,
  TItemDisplayOrder,
  TNotesStyle,
  TShowPriceWithTax,
  TTitleAlignment,
  TSubTitleAlignment,
  TLogoSize,
  TDateFormat,
  TQrCodeAlignment,
  TRegTaxAlign,
  TEmailBelow,
  TMobileBelow,
  TAddressAlignment,
  TCompanySign,
  TSignatureAlignment,
  TSignatureSize,
  TShowTemplateForPages,
  TPageNumberAlignment,
  TNotesFontSize,
} from "./pdfsettingconstan"; 
export enum pdfTypes {
  Invoice = "Invoice",
  Sales_Receipt = "Sales_Receipt",
  Proforma_Invoice = "Proforma_Invoice",
  Estimate = "Estimate",
  Delivery_Challan = "Delivery_Challan",
  Bill = "Bill",
  Purchase_Order = "Purchase_Order",
  Credit_Note = "Credit_Note",
  Payment_Received = "Payment_Received",
  Payment_Made = "Payment_Made",
  Debit_Note = "Debit_Note",
  Expense = "Expense",
  Statement = "Statement",
  Packing_Slip = "Packing_Slip",
  Delivery_Note = "Delivery_Note"
}
export type TPDFSetting = {
    user_id  :  Types.ObjectId
    pdfType : pdfTypes
  style: {
    text_color:           string;
    fill_color:           string;
    border_color:         string;
    fill_text_color:      string;
    font:                 TFont;           // "arial" | "arial_bold" | ...
    font_size:            TFontSize;       // "small" | "normal" | ...
    full_page:            TFullPage;       // "yes" | "no"
    horizontal_lines:     TLines;          // "show" | "hide"
    vertical_lines:       TLines;          // "show" | "hide"
    scaling:              TScaling;        // "fit_to_page" | "actual_size"
    horizontal_alignment: TAlignmentH;    // "left" | "center" | "right"
    vertical_alignment:   TAlignmentV;    // "top" | "middle" | "bottom"
    margin: {
      top:    number;
      right:  number;
      bottom: number;
      left:   number;
    };
    outer_border: TOuterBorder;           // "show" | "hide"
  };

  columns: {
    serial:                    boolean;
    line_item_image:           boolean;
    variant_size:              TVariantSize;         // "with_product" | "separate_column" | "hide"
    variant_type:              TVariantType;         // "with_product" | "without_product" | "hide"
    sku:                       boolean;
    sac:                       boolean;
    hsn:                       boolean;
    quntity:                   TQuantity;            // "hide" | "show_for_both" | ...
    price:                     boolean;
    discount:                  boolean;
    tax:                       TTaxDisplay;          // "hide" | "individual" | "combine"
    line_item_tax_format:      TLineItemTaxFormat;   // "show_as_percentage" | "show_as_amount" | "show_both_values"
    item_display_order:        TItemDisplayOrder;    // "services_first" | "products_first" | "combined"
    notes:                     TNotesStyle;          // "dark" | "light" | "hide"
    line_total:                boolean;
    show_price_with_tax:       TShowPriceWithTax;    // "yes" | "no" | "default"
    line_description_full_with:boolean;
  };

  header: {
    title_alignment:     TTitleAlignment;      // "center" | "right"
    sub_title_alignment: TSubTitleAlignment;   // "center" | "right" | "left"
    sub_title:           boolean;
    logo_size:           TLogoSize;            // "small" | "medium" | "large"
    date_format:         TDateFormat;          // "short" | "medium" | "long"
    logo:                boolean;
    header:              boolean;
    status_watermark:    boolean;
    number:              boolean;
    po_no:               boolean;
    due_date:            boolean;
    total_outstanding:   boolean;
    paid_amount:         boolean;
    qr_code:             boolean;
    qr_code_alignment:   TQrCodeAlignment;     // "left" | "center" | "right"
    document_copy_label: boolean;
    total_amount:        boolean;
    ganarated_by:        boolean;
    supply_type:         boolean;
    ganarated_date:      boolean;
    cancelled_date:      boolean;
    valid_till:          boolean;
  };

  company: {
    Reg_no:                    boolean;
    reg_no_tax_id_align_below: TRegTaxAlign;   // "name" | "address"
    tax_id:                    boolean;
    name:                      boolean;
    country:                   boolean;
    address:                   boolean;
    phone:                     boolean;
    mobile:                    boolean;
    fax:                       boolean;
    email:                     boolean;
    website:                   boolean;
  };

  contact: {
    tax_id:                    boolean;
    reg_no:                    boolean;
    reg_no_tax_id_align_below: TRegTaxAlign;      // "name" | "address"
    home_phone:                boolean;
    business_phone:            boolean;
    email:                     boolean;
    email_below_contact:       TEmailBelow;        // "name" | "address"
    mobaile:                   boolean;
    fax:                       boolean;
    first_last_name:           boolean;
    mobile_below_contact:      TMobileBelow;       // "name" | "address"
    address_alignment:         TAddressAlignment;  // "left" | "right"
    billing_adreess_alignment: TAddressAlignment;
    shipping_adreess_alignment:TAddressAlignment;
  };

  summary: {
    total_quantity: {
      single_total:  boolean;
      group_by_unit: boolean;
    };
    include_items_from: {
      products: boolean;
      tasks:    boolean;
    };
    amount_unused:   boolean;
    sub_total:       boolean;
    discount:        boolean;
    inline_discount: boolean;
    shipping_cost:   boolean;
    shipping_method: boolean;
    total:           boolean;
    amount_due:      boolean;
    amount_paid:     boolean;
    amount_used:     boolean;
    tax:             TTaxDisplay;   // "hide" | "individual" | "combine"
    tax_value:       boolean;
    taxable_amount:  boolean;
    tatal_in_words:  boolean;
    hsc_sac_summary: boolean;
    return_order:    boolean;
  };

  notes_terms: {
    notes:               boolean;
    notes_title:         boolean;
    font_size:           TNotesFontSize;  // "small" | "medium" | "large" | "extra_large"
    bank_details:        boolean;
    bank_details_title:  boolean;
    full_with:           boolean;
    terms_and_condition: boolean;
  };

  signature: {
    company_sign:                TCompanySign;         // "hide" | "company" | "user"
    contact_sign:                boolean;
    company_signature_alignment: TSignatureAlignment;  // "center" | "right" | "left"
    contact_signature_alignment: TSignatureAlignment;
    signature_size:              TSignatureSize;       // "small" | "medium" | "large"
  };

  footer: {
    created_moon_invoice_hyperlink: boolean;
    show_tamplate_for_pages:        TShowTemplateForPages;  // "first" | "all"
    page_number_alignment:          TPageNumberAlignment;   // "center" | "right" | "left"
  };
};