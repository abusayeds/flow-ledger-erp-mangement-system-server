/**
 * Permission catalog — single source of truth (edit this file manually).
 *
 * Tab (addOn) → modules → permissions
 * - value: snake_case stored on User.permissions and sent in API bodies (e.g. manage_users)
 */

export type PermissionTreeItem = {
  value: string;
  label: string;
  module: string;
};

export type PermissionTreeModule = {
  module: string;
  moduleLabel: string;
  permissions: PermissionTreeItem[];
};

export type PermissionTreeAddOn = {
  addOn: string;
  label: string;
  packageName: string;
  modules: PermissionTreeModule[];
};

export const rolePermission = [
  {
    "addOn": "general",
    "label": "General",
    "packageName": "general",
    "modules": [
      {
        "module": "dashboard",
        "moduleLabel": "Dashboard",
        "permissions": [
          {
            "value": "manage_dashboard",
            "label": "Manage Dashboard",
            "module": "dashboard"
          }
        ]
      },
      {
        "module": "users",
        "moduleLabel": "Users",
        "permissions": [
          {
            "value": "manage_users",
            "label": "Manage Users",
            "module": "users"
          },
          {
            "value": "manage_any_users",
            "label": "Manage All Users",
            "module": "users"
          },
          {
            "value": "manage_own_users",
            "label": "Manage Own Users",
            "module": "users"
          },
          {
            "value": "create_users",
            "label": "Create Users",
            "module": "users"
          },
          {
            "value": "edit_users",
            "label": "Edit Users",
            "module": "users"
          },
          {
            "value": "delete_users",
            "label": "Delete Users",
            "module": "users"
          },
          {
            "value": "change_password_users",
            "label": "Change Password Users",
            "module": "users"
          },
          {
            "value": "impersonate_users",
            "label": "Login As User",
            "module": "users"
          },
          {
            "value": "toggle_status_users",
            "label": "Change Status Users",
            "module": "users"
          },
          {
            "value": "view_login_history",
            "label": "View Login History",
            "module": "users"
          }
        ]
      },
      {
        "module": "roles",
        "moduleLabel": "Roles",
        "permissions": [
          {
            "value": "manage_roles",
            "label": "Manage Roles",
            "module": "roles"
          },
          {
            "value": "create_roles",
            "label": "Create Roles",
            "module": "roles"
          },
          {
            "value": "edit_roles",
            "label": "Edit Roles",
            "module": "roles"
          },
          {
            "value": "delete_roles",
            "label": "Delete Roles",
            "module": "roles"
          }
        ]
      },
      {
        "module": "warehouses",
        "moduleLabel": "Warehouses",
        "permissions": [
          {
            "value": "manage_warehouses",
            "label": "Manage Warehouses",
            "module": "warehouses"
          },
          {
            "value": "manage_any_warehouses",
            "label": "Manage All Warehouses",
            "module": "warehouses"
          },
          {
            "value": "manage_own_warehouses",
            "label": "Manage Own Warehouses",
            "module": "warehouses"
          },
          {
            "value": "create_warehouses",
            "label": "Create Warehouses",
            "module": "warehouses"
          },
          {
            "value": "edit_warehouses",
            "label": "Edit Warehouses",
            "module": "warehouses"
          },
          {
            "value": "delete_warehouses",
            "label": "Delete Warehouses",
            "module": "warehouses"
          }
        ]
      },
      {
        "module": "transfers",
        "moduleLabel": "Transfers",
        "permissions": [
          {
            "value": "manage_transfers",
            "label": "Manage Transfers",
            "module": "transfers"
          },
          {
            "value": "manage_any_transfers",
            "label": "Manage All Transfers",
            "module": "transfers"
          },
          {
            "value": "manage_own_transfers",
            "label": "Manage Own Transfers",
            "module": "transfers"
          },
          {
            "value": "create_transfers",
            "label": "Create Transfers",
            "module": "transfers"
          },
          {
            "value": "edit_transfers",
            "label": "Edit Transfers",
            "module": "transfers"
          },
          {
            "value": "delete_transfers",
            "label": "Delete Transfers",
            "module": "transfers"
          }
        ]
      },
      {
        "module": "settings",
        "moduleLabel": "Settings",
        "permissions": [
          {
            "value": "manage_settings",
            "label": "Manage Settings",
            "module": "settings"
          },
          {
            "value": "edit_settings",
            "label": "Edit Settings",
            "module": "settings"
          },
          {
            "value": "manage_brand_settings",
            "label": "Manage Brand Settings",
            "module": "settings"
          },
          {
            "value": "edit_brand_settings",
            "label": "Edit Brand Settings",
            "module": "settings"
          },
          {
            "value": "manage_company_settings",
            "label": "Manage Company Settings",
            "module": "settings"
          },
          {
            "value": "edit_company_settings",
            "label": "Edit Company Settings",
            "module": "settings"
          },
          {
            "value": "manage_system_settings",
            "label": "Manage System Settings",
            "module": "settings"
          },
          {
            "value": "edit_system_settings",
            "label": "Edit System Settings",
            "module": "settings"
          },
          {
            "value": "manage_currency_settings",
            "label": "Manage Currency Settings",
            "module": "settings"
          },
          {
            "value": "edit_currency_settings",
            "label": "Edit Currency Settings",
            "module": "settings"
          },
          {
            "value": "manage_cache_settings",
            "label": "Manage Cache Settings",
            "module": "settings"
          },
          {
            "value": "clear_cache",
            "label": "Clear Cache",
            "module": "settings"
          },
          {
            "value": "manage_cookie_settings",
            "label": "Manage Cookie Settings",
            "module": "settings"
          },
          {
            "value": "edit_cookie_settings",
            "label": "Edit Cookie Settings",
            "module": "settings"
          },
          {
            "value": "manage_seo_settings",
            "label": "Manage SEO Settings",
            "module": "settings"
          },
          {
            "value": "edit_seo_settings",
            "label": "Edit SEO Settings",
            "module": "settings"
          },
          {
            "value": "manage_storage_settings",
            "label": "Manage Storage Settings",
            "module": "settings"
          },
          {
            "value": "edit_storage_settings",
            "label": "Edit Storage Settings",
            "module": "settings"
          },
          {
            "value": "manage_email_settings",
            "label": "Manage Email Settings",
            "module": "settings"
          },
          {
            "value": "edit_email_settings",
            "label": "Edit Email Settings",
            "module": "settings"
          },
          {
            "value": "test_email",
            "label": "Test Email",
            "module": "settings"
          },
          {
            "value": "manage_bank_transfer_settings",
            "label": "Manage Bank Transfer Settings",
            "module": "settings"
          },
          {
            "value": "edit_bank_transfer_settings",
            "label": "Edit Bank Transfer Settings",
            "module": "settings"
          },
          {
            "value": "manage_email_notification_settings",
            "label": "Manage Email Notification Settings",
            "module": "settings"
          },
          {
            "value": "manage_pusher_settings",
            "label": "Manage Pusher Settings",
            "module": "settings"
          },
          {
            "value": "edit_pusher_settings",
            "label": "Edit Pusher Settings",
            "module": "settings"
          }
        ]
      },
      {
        "module": "bank-transfer",
        "moduleLabel": "Bank Transfer",
        "permissions": [
          {
            "value": "manage_bank_transfer_requests",
            "label": "Manage Bank Transfer Requests",
            "module": "bank-transfer"
          },
          {
            "value": "approve_bank_transfer_requests",
            "label": "Approve Bank Transfer Requests",
            "module": "bank-transfer"
          },
          {
            "value": "reject_bank_transfer_requests",
            "label": "Reject Bank Transfer Requests",
            "module": "bank-transfer"
          },
          {
            "value": "delete_bank_transfer_requests",
            "label": "Delete Bank Transfer Requests",
            "module": "bank-transfer"
          }
        ]
      },
      {
        "module": "media",
        "moduleLabel": "Media",
        "permissions": [
          {
            "value": "manage_media",
            "label": "Manage Media",
            "module": "media"
          },
          {
            "value": "manage_any_media",
            "label": "Manage All Media",
            "module": "media"
          },
          {
            "value": "manage_own_media",
            "label": "Manage Own Media",
            "module": "media"
          },
          {
            "value": "create_media",
            "label": "Create Media",
            "module": "media"
          },
          {
            "value": "download_media",
            "label": "Download Media",
            "module": "media"
          },
          {
            "value": "delete_media",
            "label": "Delete Media",
            "module": "media"
          },
          {
            "value": "manage_media_directories",
            "label": "Manage Media Directories",
            "module": "media"
          },
          {
            "value": "manage_any_media_directories",
            "label": "Manage All Media Directories",
            "module": "media"
          },
          {
            "value": "manage_own_media_directories",
            "label": "Manage Own Media Directories",
            "module": "media"
          },
          {
            "value": "create_media_directories",
            "label": "Create Media Directories",
            "module": "media"
          },
          {
            "value": "edit_media_directories",
            "label": "Edit Media Directories",
            "module": "media"
          },
          {
            "value": "delete_media_directories",
            "label": "Delete Media Directories",
            "module": "media"
          }
        ]
      },
      {
        "module": "helpdesk-categories",
        "moduleLabel": "Helpdesk Categories",
        "permissions": [
          {
            "value": "manage_helpdesk_categories",
            "label": "Manage Helpdesk Categories",
            "module": "helpdesk-categories"
          },
          {
            "value": "create_helpdesk_categories",
            "label": "Create Helpdesk Categories",
            "module": "helpdesk-categories"
          },
          {
            "value": "edit_helpdesk_categories",
            "label": "Edit Helpdesk Categories",
            "module": "helpdesk-categories"
          },
          {
            "value": "delete_helpdesk_categories",
            "label": "Delete Helpdesk Categories",
            "module": "helpdesk-categories"
          }
        ]
      },
      {
        "module": "helpdesk-tickets",
        "moduleLabel": "Helpdesk Tickets",
        "permissions": [
          {
            "value": "manage_helpdesk_tickets",
            "label": "Manage Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "manage_any_helpdesk_tickets",
            "label": "Manage All Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "manage_own_helpdesk_tickets",
            "label": "Manage Own Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "view_helpdesk_tickets",
            "label": "View Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "create_helpdesk_tickets",
            "label": "Create Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "edit_helpdesk_tickets",
            "label": "Edit Helpdesk Tickets",
            "module": "helpdesk-tickets"
          },
          {
            "value": "delete_helpdesk_tickets",
            "label": "Delete Helpdesk Tickets",
            "module": "helpdesk-tickets"
          }
        ]
      },
      {
        "module": "helpdesk-replies",
        "moduleLabel": "Helpdesk Replies",
        "permissions": [
          {
            "value": "manage_helpdesk_replies",
            "label": "Manage Helpdesk Replies",
            "module": "helpdesk-replies"
          },
          {
            "value": "create_helpdesk_replies",
            "label": "Create Helpdesk Replies",
            "module": "helpdesk-replies"
          },
          {
            "value": "delete_helpdesk_replies",
            "label": "Delete Helpdesk Replies",
            "module": "helpdesk-replies"
          }
        ]
      },
      {
        "module": "languages",
        "moduleLabel": "Languages",
        "permissions": [
          {
            "value": "manage_languages",
            "label": "Manage Languages",
            "module": "languages"
          },
          {
            "value": "edit_languages",
            "label": "Edit Languages",
            "module": "languages"
          }
        ]
      },
      {
        "module": "add-on",
        "moduleLabel": "Add On",
        "permissions": [
          {
            "value": "manage_add_on",
            "label": "Manage Add-on",
            "module": "add-on"
          },
          {
            "value": "manage_actions",
            "label": "Manage Actions",
            "module": "add-on"
          }
        ]
      },
      {
        "module": "plans",
        "moduleLabel": "Plans",
        "permissions": [
          {
            "value": "manage_plans",
            "label": "Manage Plans",
            "module": "plans"
          },
          {
            "value": "manage_any_plans",
            "label": "Manage All Plans",
            "module": "plans"
          },
          {
            "value": "manage_own_plans",
            "label": "Manage Own Plans",
            "module": "plans"
          },
          {
            "value": "view_plans",
            "label": "View Plans",
            "module": "plans"
          },
          {
            "value": "create_plans",
            "label": "Create Plans",
            "module": "plans"
          },
          {
            "value": "edit_plans",
            "label": "Edit Plans",
            "module": "plans"
          },
          {
            "value": "delete_plans",
            "label": "Delete Plans",
            "module": "plans"
          }
        ]
      },
      {
        "module": "coupons",
        "moduleLabel": "Coupons",
        "permissions": [
          {
            "value": "manage_coupons",
            "label": "Manage Coupons",
            "module": "coupons"
          },
          {
            "value": "manage_any_coupons",
            "label": "Manage All Coupons",
            "module": "coupons"
          },
          {
            "value": "manage_own_coupons",
            "label": "Manage Own Coupons",
            "module": "coupons"
          },
          {
            "value": "view_coupons",
            "label": "View Coupons",
            "module": "coupons"
          },
          {
            "value": "create_coupons",
            "label": "Create Coupons",
            "module": "coupons"
          },
          {
            "value": "edit_coupons",
            "label": "Edit Coupons",
            "module": "coupons"
          },
          {
            "value": "delete_coupons",
            "label": "Delete Coupons",
            "module": "coupons"
          }
        ]
      },
      {
        "module": "profile",
        "moduleLabel": "Profile",
        "permissions": [
          {
            "value": "manage_profile",
            "label": "Manage Profile",
            "module": "profile"
          },
          {
            "value": "edit_profile",
            "label": "Edit Profile",
            "module": "profile"
          },
          {
            "value": "change_password_profile",
            "label": "Change Password Profile",
            "module": "profile"
          }
        ]
      },
      {
        "module": "email-templates",
        "moduleLabel": "Email Templates",
        "permissions": [
          {
            "value": "manage_email_templates",
            "label": "Manage Email Templates",
            "module": "email-templates"
          },
          {
            "value": "edit_email_templates",
            "label": "Edit Email Templates",
            "module": "email-templates"
          }
        ]
      },
      {
        "module": "notification-templates",
        "moduleLabel": "Notification Templates",
        "permissions": [
          {
            "value": "manage_notification_templates",
            "label": "Manage Notification Templates",
            "module": "notification-templates"
          },
          {
            "value": "edit_notification_templates",
            "label": "Edit Notification Templates",
            "module": "notification-templates"
          }
        ]
      },
      {
        "module": "orders",
        "moduleLabel": "Orders",
        "permissions": [
          {
            "value": "manage_orders",
            "label": "Manage Orders",
            "module": "orders"
          }
        ]
      },
      {
        "module": "messenger",
        "moduleLabel": "Messenger",
        "permissions": [
          {
            "value": "manage_messenger",
            "label": "Manage Messenger",
            "module": "messenger"
          },
          {
            "value": "send_messages",
            "label": "Send Messages",
            "module": "messenger"
          },
          {
            "value": "view_messages",
            "label": "View Messages",
            "module": "messenger"
          },
          {
            "value": "edit_messages",
            "label": "Edit Messages",
            "module": "messenger"
          },
          {
            "value": "delete_messages",
            "label": "Delete Messages",
            "module": "messenger"
          },
          {
            "value": "toggle_favorite_messages",
            "label": "Favorite Messages",
            "module": "messenger"
          },
          {
            "value": "toggle_pinned_messages",
            "label": "Pinned Messages",
            "module": "messenger"
          }
        ]
      },
      {
        "module": "purchase-return-invoices",
        "moduleLabel": "Purchase Return Invoices",
        "permissions": [
          {
            "value": "manage_purchase_return_invoices",
            "label": "Manage Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "manage_any_purchase_return_invoices",
            "label": "Manage All Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "manage_own_purchase_return_invoices",
            "label": "Manage Own Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "view_purchase_return_invoices",
            "label": "View Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "create_purchase_return_invoices",
            "label": "Create Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "delete_purchase_return_invoices",
            "label": "Delete Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "approve_purchase_returns_invoices",
            "label": "Approve Purchase Return Invoices",
            "module": "purchase-return-invoices"
          },
          {
            "value": "complete_purchase_returns_invoices",
            "label": "Complete Purchase Return Invoices",
            "module": "purchase-return-invoices"
          }
        ]
      },
      {
        "module": "sales-invoices",
        "moduleLabel": "Sales Invoices",
        "permissions": [
          {
            "value": "manage_sales_invoices",
            "label": "Manage Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "manage_any_sales_invoices",
            "label": "Manage All Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "manage_own_sales_invoices",
            "label": "Manage Own Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "view_sales_invoices",
            "label": "View Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "create_sales_invoices",
            "label": "Create Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "edit_sales_invoices",
            "label": "Edit Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "delete_sales_invoices",
            "label": "Delete Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "post_sales_invoices",
            "label": "Post Sales Invoices",
            "module": "sales-invoices"
          },
          {
            "value": "print_sales_invoices",
            "label": "Print Sales Invoices",
            "module": "sales-invoices"
          }
        ]
      },
      {
        "module": "sales-return-invoices",
        "moduleLabel": "Sales Return Invoices",
        "permissions": [
          {
            "value": "manage_sales_return_invoices",
            "label": "Manage Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "manage_any_sales_return_invoices",
            "label": "Manage All Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "manage_own_sales_return_invoices",
            "label": "Manage Own Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "view_sales_return_invoices",
            "label": "View Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "create_sales_return_invoices",
            "label": "Create Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "delete_sales_return_invoices",
            "label": "Delete Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "approve_sales_returns_invoices",
            "label": "Approve Sales Return Invoices",
            "module": "sales-return-invoices"
          },
          {
            "value": "complete_sales_returns_invoices",
            "label": "Complete Sales Return Invoices",
            "module": "sales-return-invoices"
          }
        ]
      },
      {
        "module": "sales-proposals",
        "moduleLabel": "Sales Proposals",
        "permissions": [
          {
            "value": "manage_sales_proposals",
            "label": "Manage Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "manage_any_sales_proposals",
            "label": "Manage All Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "manage_own_sales_proposals",
            "label": "Manage Own Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "view_sales_proposals",
            "label": "View Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "create_sales_proposals",
            "label": "Create Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "edit_sales_proposals",
            "label": "Edit Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "delete_sales_proposals",
            "label": "Delete Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "print_sales_proposals",
            "label": "Print Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "sent_sales_proposals",
            "label": "Sent Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "accept_sales_proposals",
            "label": "Accept Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "convert_sales_proposals",
            "label": "Convert Sales Proposals",
            "module": "sales-proposals"
          },
          {
            "value": "reject_sales_proposals",
            "label": "Reject Sales Proposals",
            "module": "sales-proposals"
          }
        ]
      }
    ]
  },
  {
    "addOn": "ProductService",
    "label": "Product & Service",
    "packageName": "ProductService",
    "modules": [
      {
        "module": "product-service-item",
        "moduleLabel": "Product Service Item",
        "permissions": [
          {
            "value": "manage_product_service_item",
            "label": "Manage Product Service",
            "module": "product-service-item"
          },
          {
            "value": "manage_any_product_service_item",
            "label": "Manage All Product Service",
            "module": "product-service-item"
          },
          {
            "value": "manage_own_product_service_item",
            "label": "Manage Own Product Service",
            "module": "product-service-item"
          },
          {
            "value": "view_product_service_item",
            "label": "View Product Service",
            "module": "product-service-item"
          },
          {
            "value": "create_product_service_item",
            "label": "Create Product Service",
            "module": "product-service-item"
          },
          {
            "value": "edit_product_service_item",
            "label": "Edit Product Service",
            "module": "product-service-item"
          },
          {
            "value": "delete_product_service_item",
            "label": "Delete Product Service",
            "module": "product-service-item"
          },
          {
            "value": "manage_stock",
            "label": "Manage Stock",
            "module": "product-service-item"
          },
          {
            "value": "create_stock",
            "label": "Create Stock",
            "module": "product-service-item"
          }
        ]
      },
      {
        "module": "product-service-category",
        "moduleLabel": "Product Service Category",
        "permissions": [
          {
            "value": "manage_product_service_categories",
            "label": "Manage Categories",
            "module": "product-service-category"
          },
          {
            "value": "manage_any_product_service_categories",
            "label": "Manage All Categories",
            "module": "product-service-category"
          },
          {
            "value": "manage_own_product_service_categories",
            "label": "Manage Own Categories",
            "module": "product-service-category"
          },
          {
            "value": "create_product_service_categories",
            "label": "Create Categories",
            "module": "product-service-category"
          },
          {
            "value": "edit_product_service_categories",
            "label": "Edit Categories",
            "module": "product-service-category"
          },
          {
            "value": "delete_product_service_categories",
            "label": "Delete Categories",
            "module": "product-service-category"
          }
        ]
      },
      {
        "module": "product-service-tax",
        "moduleLabel": "Product Service Tax",
        "permissions": [
          {
            "value": "manage_product_service_taxes",
            "label": "Manage Taxes",
            "module": "product-service-tax"
          },
          {
            "value": "manage_any_product_service_taxes",
            "label": "Manage All Taxes",
            "module": "product-service-tax"
          },
          {
            "value": "manage_own_product_service_taxes",
            "label": "Manage Own Taxes",
            "module": "product-service-tax"
          },
          {
            "value": "create_product_service_taxes",
            "label": "Create Taxes",
            "module": "product-service-tax"
          },
          {
            "value": "edit_product_service_taxes",
            "label": "Edit Taxes",
            "module": "product-service-tax"
          },
          {
            "value": "delete_product_service_taxes",
            "label": "Delete Taxes",
            "module": "product-service-tax"
          }
        ]
      },
      {
        "module": "product-service-unit",
        "moduleLabel": "Product Service Unit",
        "permissions": [
          {
            "value": "manage_product_service_units",
            "label": "Manage Units",
            "module": "product-service-unit"
          },
          {
            "value": "manage_any_product_service_units",
            "label": "Manage All Units",
            "module": "product-service-unit"
          },
          {
            "value": "manage_own_product_service_units",
            "label": "Manage Own Units",
            "module": "product-service-unit"
          },
          {
            "value": "create_product_service_units",
            "label": "Create Units",
            "module": "product-service-unit"
          },
          {
            "value": "edit_product_service_units",
            "label": "Edit Units",
            "module": "product-service-unit"
          },
          {
            "value": "delete_product_service_units",
            "label": "Delete Units",
            "module": "product-service-unit"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Taskly",
    "label": "Project",
    "packageName": "Taskly",
    "modules": [
      {
        "module": "project",
        "moduleLabel": "Project",
        "permissions": [
          {
            "value": "manage_project_dashboard",
            "label": "Manage Project Dashboard",
            "module": "project"
          },
          {
            "value": "manage_project",
            "label": "Manage Project",
            "module": "project"
          },
          {
            "value": "manage_any_project",
            "label": "Manage All Project",
            "module": "project"
          },
          {
            "value": "manage_own_project",
            "label": "Manage Own Project",
            "module": "project"
          },
          {
            "value": "view_project",
            "label": "View Project",
            "module": "project"
          },
          {
            "value": "create_project",
            "label": "Create Project",
            "module": "project"
          },
          {
            "value": "edit_project",
            "label": "Edit Project",
            "module": "project"
          },
          {
            "value": "delete_project",
            "label": "Delete Project",
            "module": "project"
          },
          {
            "value": "duplicate_project",
            "label": "Duplicate Project",
            "module": "project"
          },
          {
            "value": "invite_project_member",
            "label": "Invite Project Member",
            "module": "project"
          },
          {
            "value": "delete_project_member",
            "label": "Delete Project Member",
            "module": "project"
          },
          {
            "value": "invite_project_client",
            "label": "Invite Project Client",
            "module": "project"
          },
          {
            "value": "delete_project_client",
            "label": "Delete Project Client",
            "module": "project"
          }
        ]
      },
      {
        "module": "project-report",
        "moduleLabel": "Project Report",
        "permissions": [
          {
            "value": "manage_project_report",
            "label": "Manage Project Report",
            "module": "project-report"
          },
          {
            "value": "view_project_report",
            "label": "View Project Report",
            "module": "project-report"
          }
        ]
      },
      {
        "module": "project-milestone",
        "moduleLabel": "Project Milestone",
        "permissions": [
          {
            "value": "manage_project_milestone",
            "label": "Manage Project Milestone",
            "module": "project-milestone"
          },
          {
            "value": "create_project_milestone",
            "label": "Create Project Milestone",
            "module": "project-milestone"
          },
          {
            "value": "edit_project_milestone",
            "label": "Edit Project Milestone",
            "module": "project-milestone"
          },
          {
            "value": "delete_project_milestone",
            "label": "Delete Project Milestone",
            "module": "project-milestone"
          }
        ]
      },
      {
        "module": "project-task",
        "moduleLabel": "Project Task",
        "permissions": [
          {
            "value": "manage_project_task",
            "label": "Manage Project Task",
            "module": "project-task"
          },
          {
            "value": "manage_any_project_task",
            "label": "Manage All Project Task",
            "module": "project-task"
          },
          {
            "value": "manage_own_project_task",
            "label": "Manage Own Project Task",
            "module": "project-task"
          },
          {
            "value": "create_project_task",
            "label": "Create Project Task",
            "module": "project-task"
          },
          {
            "value": "view_project_task",
            "label": "View Project Task",
            "module": "project-task"
          },
          {
            "value": "edit_project_task",
            "label": "Edit Project Task",
            "module": "project-task"
          },
          {
            "value": "delete_project_task",
            "label": "Delete Project Task",
            "module": "project-task"
          },
          {
            "value": "manage_project_task_comments",
            "label": "Manage Project Task Comments",
            "module": "project-task"
          },
          {
            "value": "create_project_task_comments",
            "label": "Create Project Task Comments",
            "module": "project-task"
          },
          {
            "value": "delete_project_task_comments",
            "label": "Delete Project Task Comments",
            "module": "project-task"
          },
          {
            "value": "manage_project_subtask",
            "label": "Manage Project Subtask",
            "module": "project-task"
          },
          {
            "value": "create_project_subtask",
            "label": "Create Project Subtask",
            "module": "project-task"
          }
        ]
      },
      {
        "module": "project-bug",
        "moduleLabel": "Project Bug",
        "permissions": [
          {
            "value": "manage_project_bug",
            "label": "Manage Project Bug",
            "module": "project-bug"
          },
          {
            "value": "manage_any_project_bug",
            "label": "Manage All Project Bug",
            "module": "project-bug"
          },
          {
            "value": "manage_own_project_bug",
            "label": "Manage Own Project Bug",
            "module": "project-bug"
          },
          {
            "value": "create_project_bug",
            "label": "Create Project Bug",
            "module": "project-bug"
          },
          {
            "value": "edit_project_bug",
            "label": "Edit Project Bug",
            "module": "project-bug"
          },
          {
            "value": "view_project_bug",
            "label": "View Project Bug",
            "module": "project-bug"
          },
          {
            "value": "delete_project_bug",
            "label": "Delete Project Bug",
            "module": "project-bug"
          },
          {
            "value": "manage_project_bug_comments",
            "label": "Manage Project Bug Comments",
            "module": "project-bug"
          },
          {
            "value": "create_project_bug_comments",
            "label": "Create Project Bug Comments",
            "module": "project-bug"
          },
          {
            "value": "delete_project_bug_comments",
            "label": "Delete Project Bug Comments",
            "module": "project-bug"
          }
        ]
      },
      {
        "module": "task-stages",
        "moduleLabel": "Task Stages",
        "permissions": [
          {
            "value": "manage_task_stages",
            "label": "Manage Task Stages",
            "module": "task-stages"
          },
          {
            "value": "manage_any_task_stages",
            "label": "Manage All Task Stages",
            "module": "task-stages"
          },
          {
            "value": "manage_own_task_stages",
            "label": "Manage Own Task Stages",
            "module": "task-stages"
          },
          {
            "value": "create_task_stages",
            "label": "Create Task Stages",
            "module": "task-stages"
          },
          {
            "value": "edit_task_stages",
            "label": "Edit Task Stages",
            "module": "task-stages"
          },
          {
            "value": "delete_task_stages",
            "label": "Delete Task Stages",
            "module": "task-stages"
          }
        ]
      },
      {
        "module": "bug-stages",
        "moduleLabel": "Bug Stages",
        "permissions": [
          {
            "value": "manage_bug_stages",
            "label": "Manage Bug Stages",
            "module": "bug-stages"
          },
          {
            "value": "manage_any_bug_stages",
            "label": "Manage All Bug Stages",
            "module": "bug-stages"
          },
          {
            "value": "manage_own_bug_stages",
            "label": "Manage Own Bug Stages",
            "module": "bug-stages"
          },
          {
            "value": "create_bug_stages",
            "label": "Create Bug Stages",
            "module": "bug-stages"
          },
          {
            "value": "edit_bug_stages",
            "label": "Edit Bug Stages",
            "module": "bug-stages"
          },
          {
            "value": "delete_bug_stages",
            "label": "Delete Bug Stages",
            "module": "bug-stages"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Account",
    "label": "Accounting",
    "packageName": "Account",
    "modules": [
      {
        "module": "account",
        "moduleLabel": "Account",
        "permissions": [
          {
            "value": "manage_account",
            "label": "Manage Account",
            "module": "account"
          },
          {
            "value": "manage_account_dashboard",
            "label": "Manage Account Dashboard",
            "module": "account"
          }
        ]
      },
      {
        "module": "vendors",
        "moduleLabel": "Vendors",
        "permissions": [
          {
            "value": "manage_vendors",
            "label": "Manage Vendors",
            "module": "vendors"
          },
          {
            "value": "manage_any_vendors",
            "label": "Manage All Vendors",
            "module": "vendors"
          },
          {
            "value": "manage_own_vendors",
            "label": "Manage Own Vendors",
            "module": "vendors"
          },
          {
            "value": "view_vendors",
            "label": "View Vendors",
            "module": "vendors"
          },
          {
            "value": "create_vendors",
            "label": "Create Vendors",
            "module": "vendors"
          },
          {
            "value": "edit_vendors",
            "label": "Edit Vendors",
            "module": "vendors"
          },
          {
            "value": "delete_vendors",
            "label": "Delete Vendors",
            "module": "vendors"
          }
        ]
      },
      {
        "module": "customers",
        "moduleLabel": "Customers",
        "permissions": [
          {
            "value": "manage_customers",
            "label": "Manage Customers",
            "module": "customers"
          },
          {
            "value": "manage_any_customers",
            "label": "Manage All Customers",
            "module": "customers"
          },
          {
            "value": "manage_own_customers",
            "label": "Manage Own Customers",
            "module": "customers"
          },
          {
            "value": "view_customers",
            "label": "View Customers",
            "module": "customers"
          },
          {
            "value": "create_customers",
            "label": "Create Customers",
            "module": "customers"
          },
          {
            "value": "edit_customers",
            "label": "Edit Customers",
            "module": "customers"
          },
          {
            "value": "delete_customers",
            "label": "Delete Customers",
            "module": "customers"
          }
        ]
      },
      {
        "module": "bank-accounts",
        "moduleLabel": "Bank Accounts",
        "permissions": [
          {
            "value": "manage_bank_accounts",
            "label": "Manage BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "manage_any_bank_accounts",
            "label": "Manage All BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "manage_own_bank_accounts",
            "label": "Manage Own BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "view_bank_accounts",
            "label": "View BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "create_bank_accounts",
            "label": "Create BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "edit_bank_accounts",
            "label": "Edit BankAccounts",
            "module": "bank-accounts"
          },
          {
            "value": "delete_bank_accounts",
            "label": "Delete BankAccounts",
            "module": "bank-accounts"
          }
        ]
      },
      {
        "module": "account-types",
        "moduleLabel": "Account Types",
        "permissions": [
          {
            "value": "manage_account_types",
            "label": "Manage AccountTypes",
            "module": "account-types"
          },
          {
            "value": "manage_any_account_types",
            "label": "Manage All AccountTypes",
            "module": "account-types"
          },
          {
            "value": "manage_own_account_types",
            "label": "Manage Own AccountTypes",
            "module": "account-types"
          },
          {
            "value": "view_account_types",
            "label": "View AccountTypes",
            "module": "account-types"
          },
          {
            "value": "create_account_types",
            "label": "Create AccountTypes",
            "module": "account-types"
          },
          {
            "value": "edit_account_types",
            "label": "Edit AccountTypes",
            "module": "account-types"
          },
          {
            "value": "delete_account_types",
            "label": "Delete AccountTypes",
            "module": "account-types"
          }
        ]
      },
      {
        "module": "chart-of-accounts",
        "moduleLabel": "Chart Of Accounts",
        "permissions": [
          {
            "value": "manage_chart_of_accounts",
            "label": "Manage ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "manage_any_chart_of_accounts",
            "label": "Manage All ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "manage_own_chart_of_accounts",
            "label": "Manage Own ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "view_chart_of_accounts",
            "label": "View ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "create_chart_of_accounts",
            "label": "Create ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "edit_chart_of_accounts",
            "label": "Edit ChartOfAccounts",
            "module": "chart-of-accounts"
          },
          {
            "value": "delete_chart_of_accounts",
            "label": "Delete ChartOfAccounts",
            "module": "chart-of-accounts"
          }
        ]
      },
      {
        "module": "vendor-payments",
        "moduleLabel": "Vendor Payments",
        "permissions": [
          {
            "value": "manage_vendor_payments",
            "label": "Manage Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "manage_any_vendor_payments",
            "label": "Manage All Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "manage_own_vendor_payments",
            "label": "Manage Own Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "view_vendor_payments",
            "label": "View Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "create_vendor_payments",
            "label": "Create Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "cleared_vendor_payments",
            "label": "Cleared Vendor Payments",
            "module": "vendor-payments"
          },
          {
            "value": "delete_vendor_payments",
            "label": "Delete Vendor Payments",
            "module": "vendor-payments"
          }
        ]
      },
      {
        "module": "customer-payments",
        "moduleLabel": "Customer Payments",
        "permissions": [
          {
            "value": "manage_customer_payments",
            "label": "Manage Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "manage_any_customer_payments",
            "label": "Manage All Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "manage_own_customer_payments",
            "label": "Manage Own Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "view_customer_payments",
            "label": "View Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "create_customer_payments",
            "label": "Create Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "cleared_customer_payments",
            "label": "Clear Customer Payments",
            "module": "customer-payments"
          },
          {
            "value": "delete_customer_payments",
            "label": "Delete Customer Payments",
            "module": "customer-payments"
          }
        ]
      },
      {
        "module": "bank-transaction",
        "moduleLabel": "Bank Transaction",
        "permissions": [
          {
            "value": "manage_bank_transactions",
            "label": "Manage Bank Transaction",
            "module": "bank-transaction"
          },
          {
            "value": "reconcile_bank_transactions",
            "label": "Reconcile Bank Transaction",
            "module": "bank-transaction"
          }
        ]
      },
      {
        "module": "debit-notes",
        "moduleLabel": "Debit Notes",
        "permissions": [
          {
            "value": "manage_debit_notes",
            "label": "Manage Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "manage_any_debit_notes",
            "label": "Manage All Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "manage_own_debit_notes",
            "label": "Manage Own Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "view_debit_notes",
            "label": "View Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "create_debit_notes",
            "label": "Create Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "approve_debit_notes",
            "label": "Approve Debit Notes",
            "module": "debit-notes"
          },
          {
            "value": "delete_debit_notes",
            "label": "Delete Debit Notes",
            "module": "debit-notes"
          }
        ]
      },
      {
        "module": "credit-notes",
        "moduleLabel": "Credit Notes",
        "permissions": [
          {
            "value": "manage_credit_notes",
            "label": "Manage Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "manage_any_credit_notes",
            "label": "Manage All Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "manage_own_credit_notes",
            "label": "Manage Own Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "view_credit_notes",
            "label": "View Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "create_credit_notes",
            "label": "Create Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "approve_credit_notes",
            "label": "Approve Credit Notes",
            "module": "credit-notes"
          },
          {
            "value": "delete_credit_notes",
            "label": "Delete Credit Notes",
            "module": "credit-notes"
          }
        ]
      },
      {
        "module": "bank-transfers",
        "moduleLabel": "Bank Transfers",
        "permissions": [
          {
            "value": "manage_bank_transfers",
            "label": "Manage Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "manage_any_bank_transfers",
            "label": "Manage All Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "manage_own_bank_transfers",
            "label": "Manage Own Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "view_bank_transfers",
            "label": "View Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "create_bank_transfers",
            "label": "Create Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "edit_bank_transfers",
            "label": "Edit Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "delete_bank_transfers",
            "label": "Delete Bank Transfers",
            "module": "bank-transfers"
          },
          {
            "value": "process_bank_transfers",
            "label": "Process Bank Transfers",
            "module": "bank-transfers"
          }
        ]
      },
      {
        "module": "revenue-categories",
        "moduleLabel": "Revenue Categories",
        "permissions": [
          {
            "value": "manage_revenue_categories",
            "label": "Manage RevenueCategories",
            "module": "revenue-categories"
          },
          {
            "value": "manage_any_revenue_categories",
            "label": "Manage All RevenueCategories",
            "module": "revenue-categories"
          },
          {
            "value": "manage_own_revenue_categories",
            "label": "Manage Own RevenueCategories",
            "module": "revenue-categories"
          },
          {
            "value": "create_revenue_categories",
            "label": "Create RevenueCategories",
            "module": "revenue-categories"
          },
          {
            "value": "edit_revenue_categories",
            "label": "Edit RevenueCategories",
            "module": "revenue-categories"
          },
          {
            "value": "delete_revenue_categories",
            "label": "Delete RevenueCategories",
            "module": "revenue-categories"
          }
        ]
      },
      {
        "module": "expense-categories",
        "moduleLabel": "Expense Categories",
        "permissions": [
          {
            "value": "manage_expense_categories",
            "label": "Manage ExpenseCategories",
            "module": "expense-categories"
          },
          {
            "value": "manage_any_expense_categories",
            "label": "Manage All ExpenseCategories",
            "module": "expense-categories"
          },
          {
            "value": "manage_own_expense_categories",
            "label": "Manage Own ExpenseCategories",
            "module": "expense-categories"
          },
          {
            "value": "create_expense_categories",
            "label": "Create ExpenseCategories",
            "module": "expense-categories"
          },
          {
            "value": "edit_expense_categories",
            "label": "Edit ExpenseCategories",
            "module": "expense-categories"
          },
          {
            "value": "delete_expense_categories",
            "label": "Delete ExpenseCategories",
            "module": "expense-categories"
          }
        ]
      },
      {
        "module": "revenues",
        "moduleLabel": "Revenues",
        "permissions": [
          {
            "value": "manage_revenues",
            "label": "Manage Revenues",
            "module": "revenues"
          },
          {
            "value": "manage_any_revenues",
            "label": "Manage All Revenues",
            "module": "revenues"
          },
          {
            "value": "manage_own_revenues",
            "label": "Manage Own Revenues",
            "module": "revenues"
          },
          {
            "value": "view_revenues",
            "label": "View Revenues",
            "module": "revenues"
          },
          {
            "value": "create_revenues",
            "label": "Create Revenues",
            "module": "revenues"
          },
          {
            "value": "edit_revenues",
            "label": "Edit Revenues",
            "module": "revenues"
          },
          {
            "value": "delete_revenues",
            "label": "Delete Revenues",
            "module": "revenues"
          },
          {
            "value": "approve_revenues",
            "label": "Approve Revenues",
            "module": "revenues"
          },
          {
            "value": "post_revenues",
            "label": "Post Revenues",
            "module": "revenues"
          }
        ]
      },
      {
        "module": "expenses",
        "moduleLabel": "Expenses",
        "permissions": [
          {
            "value": "manage_expenses",
            "label": "Manage Expenses",
            "module": "expenses"
          },
          {
            "value": "manage_any_expenses",
            "label": "Manage All Expenses",
            "module": "expenses"
          },
          {
            "value": "manage_own_expenses",
            "label": "Manage Own Expenses",
            "module": "expenses"
          },
          {
            "value": "view_expenses",
            "label": "View Expenses",
            "module": "expenses"
          },
          {
            "value": "create_expenses",
            "label": "Create Expenses",
            "module": "expenses"
          },
          {
            "value": "edit_expenses",
            "label": "Edit Expenses",
            "module": "expenses"
          },
          {
            "value": "delete_expenses",
            "label": "Delete Expenses",
            "module": "expenses"
          },
          {
            "value": "approve_expenses",
            "label": "Approve Expenses",
            "module": "expenses"
          },
          {
            "value": "post_expenses",
            "label": "Post Expenses",
            "module": "expenses"
          }
        ]
      },
      {
        "module": "account-reports",
        "moduleLabel": "Account Reports",
        "permissions": [
          {
            "value": "manage_account_reports",
            "label": "Manage Account Reports",
            "module": "account-reports"
          },
          {
            "value": "view_invoice_aging",
            "label": "View Invoice Aging",
            "module": "account-reports"
          },
          {
            "value": "print_invoice_aging",
            "label": "Print Invoice Aging",
            "module": "account-reports"
          },
          {
            "value": "view_bill_aging",
            "label": "View Bill Aging",
            "module": "account-reports"
          },
          {
            "value": "print_bill_aging",
            "label": "Print Bill Aging",
            "module": "account-reports"
          },
          {
            "value": "view_tax_summary",
            "label": "View Tax Summary",
            "module": "account-reports"
          },
          {
            "value": "print_tax_summary",
            "label": "Print Tax Summary",
            "module": "account-reports"
          },
          {
            "value": "view_customer_balance",
            "label": "View Customer Balance",
            "module": "account-reports"
          },
          {
            "value": "print_customer_balance",
            "label": "Print Customer Balance",
            "module": "account-reports"
          },
          {
            "value": "view_vendor_balance",
            "label": "View Vendor Balance",
            "module": "account-reports"
          },
          {
            "value": "print_vendor_balance",
            "label": "Print Vendor Balance",
            "module": "account-reports"
          },
          {
            "value": "view_customer_detail_report",
            "label": "View Customer Detail Report",
            "module": "account-reports"
          },
          {
            "value": "print_customer_detail_report",
            "label": "Print Customer Detail Report",
            "module": "account-reports"
          },
          {
            "value": "view_vendor_detail_report",
            "label": "View Vendor Detail Report",
            "module": "account-reports"
          },
          {
            "value": "print_vendor_detail_report",
            "label": "Print Vendor Detail Report",
            "module": "account-reports"
          }
        ]
      }
    ]
  },
  {
    "addOn": "LandingPage",
    "label": "CMS",
    "packageName": "LandingPage",
    "modules": [
      {
        "module": "landing-page",
        "moduleLabel": "Landing Page",
        "permissions": [
          {
            "value": "manage_landing_page",
            "label": "Manage LandingPage",
            "module": "landing-page"
          },
          {
            "value": "view_landing_page",
            "label": "View LandingPage",
            "module": "landing-page"
          },
          {
            "value": "edit_landing_page",
            "label": "Edit LandingPage",
            "module": "landing-page"
          },
          {
            "value": "manage_marketplace_settings",
            "label": "Manage Marketplace Settings",
            "module": "landing-page"
          },
          {
            "value": "manage_custom_pages",
            "label": "Manage Custom Pages",
            "module": "landing-page"
          },
          {
            "value": "create_custom_pages",
            "label": "Create Custom Pages",
            "module": "landing-page"
          },
          {
            "value": "edit_custom_pages",
            "label": "Edit Custom Pages",
            "module": "landing-page"
          },
          {
            "value": "delete_custom_pages",
            "label": "Delete Custom Pages",
            "module": "landing-page"
          },
          {
            "value": "view_custom_pages",
            "label": "View Custom Pages",
            "module": "landing-page"
          },
          {
            "value": "manage_newsletter_subscribers",
            "label": "Manage Newsletter Subscribers",
            "module": "landing-page"
          },
          {
            "value": "view_newsletter_subscribers",
            "label": "View Newsletter Subscribers",
            "module": "landing-page"
          },
          {
            "value": "edit_newsletter_subscribers",
            "label": "Edit Newsletter Subscribers",
            "module": "landing-page"
          },
          {
            "value": "delete_newsletter_subscribers",
            "label": "Delete Newsletter Subscribers",
            "module": "landing-page"
          },
          {
            "value": "export_newsletter_subscribers",
            "label": "Export Newsletter Subscribers",
            "module": "landing-page"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Hrm",
    "label": "HRM",
    "packageName": "Hrm",
    "modules": [
      {
        "module": "Dashboard",
        "moduleLabel": "Dashboard",
        "permissions": [
          {
            "value": "manage_hrm_dashboard",
            "label": "Manage HRM Dashboard",
            "module": "Dashboard"
          }
        ]
      },
      {
        "module": "hrm",
        "moduleLabel": "Hrm",
        "permissions": [
          {
            "value": "manage_hrm",
            "label": "Manage Hrm",
            "module": "hrm"
          }
        ]
      },
      {
        "module": "branches",
        "moduleLabel": "Branches",
        "permissions": [
          {
            "value": "manage_branches",
            "label": "Manage Branches",
            "module": "branches"
          },
          {
            "value": "manage_any_branches",
            "label": "Manage All Branches",
            "module": "branches"
          },
          {
            "value": "manage_own_branches",
            "label": "Manage Own Branches",
            "module": "branches"
          },
          {
            "value": "create_branches",
            "label": "Create Branches",
            "module": "branches"
          },
          {
            "value": "edit_branches",
            "label": "Edit Branches",
            "module": "branches"
          },
          {
            "value": "delete_branches",
            "label": "Delete Branches",
            "module": "branches"
          }
        ]
      },
      {
        "module": "departments",
        "moduleLabel": "Departments",
        "permissions": [
          {
            "value": "manage_departments",
            "label": "Manage Departments",
            "module": "departments"
          },
          {
            "value": "manage_any_departments",
            "label": "Manage All Departments",
            "module": "departments"
          },
          {
            "value": "manage_own_departments",
            "label": "Manage Own Departments",
            "module": "departments"
          },
          {
            "value": "create_departments",
            "label": "Create Departments",
            "module": "departments"
          },
          {
            "value": "edit_departments",
            "label": "Edit Departments",
            "module": "departments"
          },
          {
            "value": "delete_departments",
            "label": "Delete Departments",
            "module": "departments"
          }
        ]
      },
      {
        "module": "designations",
        "moduleLabel": "Designations",
        "permissions": [
          {
            "value": "manage_designations",
            "label": "Manage Designations",
            "module": "designations"
          },
          {
            "value": "manage_any_designations",
            "label": "Manage All Designations",
            "module": "designations"
          },
          {
            "value": "manage_own_designations",
            "label": "Manage Own Designations",
            "module": "designations"
          },
          {
            "value": "create_designations",
            "label": "Create Designations",
            "module": "designations"
          },
          {
            "value": "edit_designations",
            "label": "Edit Designations",
            "module": "designations"
          },
          {
            "value": "delete_designations",
            "label": "Delete Designations",
            "module": "designations"
          }
        ]
      },
      {
        "module": "employee-document-types",
        "moduleLabel": "Employee Document Types",
        "permissions": [
          {
            "value": "manage_employee_document_types",
            "label": "Manage EmployeeDocumentTypes",
            "module": "employee-document-types"
          },
          {
            "value": "manage_any_employee_document_types",
            "label": "Manage All EmployeeDocumentTypes",
            "module": "employee-document-types"
          },
          {
            "value": "manage_own_employee_document_types",
            "label": "Manage Own EmployeeDocumentTypes",
            "module": "employee-document-types"
          },
          {
            "value": "create_employee_document_types",
            "label": "Create EmployeeDocumentTypes",
            "module": "employee-document-types"
          },
          {
            "value": "edit_employee_document_types",
            "label": "Edit EmployeeDocumentTypes",
            "module": "employee-document-types"
          },
          {
            "value": "delete_employee_document_types",
            "label": "Delete EmployeeDocumentTypes",
            "module": "employee-document-types"
          }
        ]
      },
      {
        "module": "employees",
        "moduleLabel": "Employees",
        "permissions": [
          {
            "value": "manage_employees",
            "label": "Manage Employees",
            "module": "employees"
          },
          {
            "value": "manage_any_employees",
            "label": "Manage All Employees",
            "module": "employees"
          },
          {
            "value": "manage_own_employees",
            "label": "Manage Own Employees",
            "module": "employees"
          },
          {
            "value": "view_employees",
            "label": "View Employees",
            "module": "employees"
          },
          {
            "value": "create_employees",
            "label": "Create Employees",
            "module": "employees"
          },
          {
            "value": "edit_employees",
            "label": "Edit Employees",
            "module": "employees"
          },
          {
            "value": "delete_employees",
            "label": "Delete Employees",
            "module": "employees"
          }
        ]
      },
      {
        "module": "award-types",
        "moduleLabel": "Award Types",
        "permissions": [
          {
            "value": "manage_award_types",
            "label": "Manage AwardTypes",
            "module": "award-types"
          },
          {
            "value": "manage_any_award_types",
            "label": "Manage All AwardTypes",
            "module": "award-types"
          },
          {
            "value": "manage_own_award_types",
            "label": "Manage Own AwardTypes",
            "module": "award-types"
          },
          {
            "value": "create_award_types",
            "label": "Create AwardTypes",
            "module": "award-types"
          },
          {
            "value": "edit_award_types",
            "label": "Edit AwardTypes",
            "module": "award-types"
          },
          {
            "value": "delete_award_types",
            "label": "Delete AwardTypes",
            "module": "award-types"
          }
        ]
      },
      {
        "module": "awards",
        "moduleLabel": "Awards",
        "permissions": [
          {
            "value": "manage_awards",
            "label": "Manage Awards",
            "module": "awards"
          },
          {
            "value": "manage_any_awards",
            "label": "Manage All Awards",
            "module": "awards"
          },
          {
            "value": "manage_own_awards",
            "label": "Manage Own Awards",
            "module": "awards"
          },
          {
            "value": "create_awards",
            "label": "Create Awards",
            "module": "awards"
          },
          {
            "value": "view_awards",
            "label": "View Awards",
            "module": "awards"
          },
          {
            "value": "edit_awards",
            "label": "Edit Awards",
            "module": "awards"
          },
          {
            "value": "delete_awards",
            "label": "Delete Awards",
            "module": "awards"
          }
        ]
      },
      {
        "module": "promotions",
        "moduleLabel": "Promotions",
        "permissions": [
          {
            "value": "manage_promotions",
            "label": "Manage Promotions",
            "module": "promotions"
          },
          {
            "value": "manage_any_promotions",
            "label": "Manage All Promotions",
            "module": "promotions"
          },
          {
            "value": "manage_own_promotions",
            "label": "Manage Own Promotions",
            "module": "promotions"
          },
          {
            "value": "manage_promotions_status",
            "label": "Manage Promotions Status",
            "module": "promotions"
          },
          {
            "value": "view_promotions",
            "label": "View Promotions",
            "module": "promotions"
          },
          {
            "value": "create_promotions",
            "label": "Create Promotions",
            "module": "promotions"
          },
          {
            "value": "edit_promotions",
            "label": "Edit Promotions",
            "module": "promotions"
          },
          {
            "value": "delete_promotions",
            "label": "Delete Promotions",
            "module": "promotions"
          }
        ]
      },
      {
        "module": "resignations",
        "moduleLabel": "Resignations",
        "permissions": [
          {
            "value": "manage_resignations",
            "label": "Manage Resignations",
            "module": "resignations"
          },
          {
            "value": "manage_any_resignations",
            "label": "Manage All Resignations",
            "module": "resignations"
          },
          {
            "value": "manage_own_resignations",
            "label": "Manage Own Resignations",
            "module": "resignations"
          },
          {
            "value": "manage_resignation_status",
            "label": "Manage Resignation Status",
            "module": "resignations"
          },
          {
            "value": "view_resignations",
            "label": "View Resignations",
            "module": "resignations"
          },
          {
            "value": "create_resignations",
            "label": "Create Resignations",
            "module": "resignations"
          },
          {
            "value": "edit_resignations",
            "label": "Edit Resignations",
            "module": "resignations"
          },
          {
            "value": "delete_resignations",
            "label": "Delete Resignations",
            "module": "resignations"
          }
        ]
      },
      {
        "module": "termination-types",
        "moduleLabel": "Termination Types",
        "permissions": [
          {
            "value": "manage_termination_types",
            "label": "Manage TerminationTypes",
            "module": "termination-types"
          },
          {
            "value": "manage_any_termination_types",
            "label": "Manage All TerminationTypes",
            "module": "termination-types"
          },
          {
            "value": "manage_own_termination_types",
            "label": "Manage Own TerminationTypes",
            "module": "termination-types"
          },
          {
            "value": "create_termination_types",
            "label": "Create TerminationTypes",
            "module": "termination-types"
          },
          {
            "value": "edit_termination_types",
            "label": "Edit TerminationTypes",
            "module": "termination-types"
          },
          {
            "value": "delete_termination_types",
            "label": "Delete TerminationTypes",
            "module": "termination-types"
          }
        ]
      },
      {
        "module": "terminations",
        "moduleLabel": "Terminations",
        "permissions": [
          {
            "value": "manage_terminations",
            "label": "Manage Terminations",
            "module": "terminations"
          },
          {
            "value": "manage_any_terminations",
            "label": "Manage All Terminations",
            "module": "terminations"
          },
          {
            "value": "manage_own_terminations",
            "label": "Manage Own Terminations",
            "module": "terminations"
          },
          {
            "value": "manage_termination_status",
            "label": "Manage Termination Status",
            "module": "terminations"
          },
          {
            "value": "view_terminations",
            "label": "View Terminations",
            "module": "terminations"
          },
          {
            "value": "create_terminations",
            "label": "Create Terminations",
            "module": "terminations"
          },
          {
            "value": "edit_terminations",
            "label": "Edit Terminations",
            "module": "terminations"
          },
          {
            "value": "delete_terminations",
            "label": "Delete Terminations",
            "module": "terminations"
          }
        ]
      },
      {
        "module": "warning-types",
        "moduleLabel": "Warning Types",
        "permissions": [
          {
            "value": "manage_warning_types",
            "label": "Manage WarningTypes",
            "module": "warning-types"
          },
          {
            "value": "manage_any_warning_types",
            "label": "Manage All WarningTypes",
            "module": "warning-types"
          },
          {
            "value": "manage_own_warning_types",
            "label": "Manage Own WarningTypes",
            "module": "warning-types"
          },
          {
            "value": "create_warning_types",
            "label": "Create WarningTypes",
            "module": "warning-types"
          },
          {
            "value": "edit_warning_types",
            "label": "Edit WarningTypes",
            "module": "warning-types"
          },
          {
            "value": "delete_warning_types",
            "label": "Delete WarningTypes",
            "module": "warning-types"
          }
        ]
      },
      {
        "module": "warnings",
        "moduleLabel": "Warnings",
        "permissions": [
          {
            "value": "manage_warnings",
            "label": "Manage Warnings",
            "module": "warnings"
          },
          {
            "value": "manage_any_warnings",
            "label": "Manage All Warnings",
            "module": "warnings"
          },
          {
            "value": "manage_own_warnings",
            "label": "Manage Own Warnings",
            "module": "warnings"
          },
          {
            "value": "manage_warning_response",
            "label": "Manage Warning Response",
            "module": "warnings"
          },
          {
            "value": "view_warnings",
            "label": "View Warnings",
            "module": "warnings"
          },
          {
            "value": "create_warnings",
            "label": "Create Warnings",
            "module": "warnings"
          },
          {
            "value": "edit_warnings",
            "label": "Edit Warnings",
            "module": "warnings"
          },
          {
            "value": "delete_warnings",
            "label": "Delete Warnings",
            "module": "warnings"
          }
        ]
      },
      {
        "module": "complaint-types",
        "moduleLabel": "Complaint Types",
        "permissions": [
          {
            "value": "manage_complaint_types",
            "label": "Manage ComplaintTypes",
            "module": "complaint-types"
          },
          {
            "value": "manage_any_complaint_types",
            "label": "Manage All ComplaintTypes",
            "module": "complaint-types"
          },
          {
            "value": "manage_own_complaint_types",
            "label": "Manage Own ComplaintTypes",
            "module": "complaint-types"
          },
          {
            "value": "create_complaint_types",
            "label": "Create ComplaintTypes",
            "module": "complaint-types"
          },
          {
            "value": "edit_complaint_types",
            "label": "Edit ComplaintTypes",
            "module": "complaint-types"
          },
          {
            "value": "delete_complaint_types",
            "label": "Delete ComplaintTypes",
            "module": "complaint-types"
          }
        ]
      },
      {
        "module": "complaints",
        "moduleLabel": "Complaints",
        "permissions": [
          {
            "value": "manage_complaints",
            "label": "Manage Complaints",
            "module": "complaints"
          },
          {
            "value": "manage_any_complaints",
            "label": "Manage All Complaints",
            "module": "complaints"
          },
          {
            "value": "manage_own_complaints",
            "label": "Manage Own Complaints",
            "module": "complaints"
          },
          {
            "value": "manage_complaint_status",
            "label": "Manage Complaint Status",
            "module": "complaints"
          },
          {
            "value": "view_complaints",
            "label": "View Complaints",
            "module": "complaints"
          },
          {
            "value": "create_complaints",
            "label": "Create Complaints",
            "module": "complaints"
          },
          {
            "value": "edit_complaints",
            "label": "Edit Complaints",
            "module": "complaints"
          },
          {
            "value": "delete_complaints",
            "label": "Delete Complaints",
            "module": "complaints"
          }
        ]
      },
      {
        "module": "employee-transfers",
        "moduleLabel": "Employee Transfers",
        "permissions": [
          {
            "value": "manage_employee_transfers",
            "label": "Manage EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "manage_any_employee_transfers",
            "label": "Manage All EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "manage_own_employee_transfers",
            "label": "Manage Own EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "manage_employee_transfers_status",
            "label": "Manage EmployeeTransfers Status",
            "module": "employee-transfers"
          },
          {
            "value": "view_employee_transfers",
            "label": "View EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "create_employee_transfers",
            "label": "Create EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "edit_employee_transfers",
            "label": "Edit EmployeeTransfers",
            "module": "employee-transfers"
          },
          {
            "value": "delete_employee_transfers",
            "label": "Delete EmployeeTransfers",
            "module": "employee-transfers"
          }
        ]
      },
      {
        "module": "holiday-types",
        "moduleLabel": "Holiday Types",
        "permissions": [
          {
            "value": "manage_holiday_types",
            "label": "Manage HolidayTypes",
            "module": "holiday-types"
          },
          {
            "value": "manage_any_holiday_types",
            "label": "Manage All HolidayTypes",
            "module": "holiday-types"
          },
          {
            "value": "manage_own_holiday_types",
            "label": "Manage Own HolidayTypes",
            "module": "holiday-types"
          },
          {
            "value": "create_holiday_types",
            "label": "Create HolidayTypes",
            "module": "holiday-types"
          },
          {
            "value": "edit_holiday_types",
            "label": "Edit HolidayTypes",
            "module": "holiday-types"
          },
          {
            "value": "delete_holiday_types",
            "label": "Delete HolidayTypes",
            "module": "holiday-types"
          }
        ]
      },
      {
        "module": "holidays",
        "moduleLabel": "Holidays",
        "permissions": [
          {
            "value": "manage_holidays",
            "label": "Manage Holidays",
            "module": "holidays"
          },
          {
            "value": "manage_any_holidays",
            "label": "Manage All Holidays",
            "module": "holidays"
          },
          {
            "value": "manage_own_holidays",
            "label": "Manage Own Holidays",
            "module": "holidays"
          },
          {
            "value": "view_holidays",
            "label": "View Holidays",
            "module": "holidays"
          },
          {
            "value": "create_holidays",
            "label": "Create Holidays",
            "module": "holidays"
          },
          {
            "value": "edit_holidays",
            "label": "Edit Holidays",
            "module": "holidays"
          },
          {
            "value": "delete_holidays",
            "label": "Delete Holidays",
            "module": "holidays"
          }
        ]
      },
      {
        "module": "document-categories",
        "moduleLabel": "Document Categories",
        "permissions": [
          {
            "value": "manage_document_categories",
            "label": "Manage DocumentCategories",
            "module": "document-categories"
          },
          {
            "value": "manage_any_document_categories",
            "label": "Manage All DocumentCategories",
            "module": "document-categories"
          },
          {
            "value": "manage_own_document_categories",
            "label": "Manage Own DocumentCategories",
            "module": "document-categories"
          },
          {
            "value": "create_document_categories",
            "label": "Create DocumentCategories",
            "module": "document-categories"
          },
          {
            "value": "edit_document_categories",
            "label": "Edit DocumentCategories",
            "module": "document-categories"
          },
          {
            "value": "delete_document_categories",
            "label": "Delete DocumentCategories",
            "module": "document-categories"
          }
        ]
      },
      {
        "module": "hrm-documents",
        "moduleLabel": "Hrm Documents",
        "permissions": [
          {
            "value": "manage_hrm_documents",
            "label": "Manage HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "manage_any_hrm_documents",
            "label": "Manage All HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "manage_own_hrm_documents",
            "label": "Manage Own HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "manage_hrm_documents_status",
            "label": "Manage  HrmDocuments status",
            "module": "hrm-documents"
          },
          {
            "value": "view_hrm_documents",
            "label": "View HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "download_hrm_documents",
            "label": "Download HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "create_hrm_documents",
            "label": "Create HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "edit_hrm_documents",
            "label": "Edit HrmDocuments",
            "module": "hrm-documents"
          },
          {
            "value": "delete_hrm_documents",
            "label": "Delete HrmDocuments",
            "module": "hrm-documents"
          }
        ]
      },
      {
        "module": "acknowledgments",
        "moduleLabel": "Acknowledgments",
        "permissions": [
          {
            "value": "manage_acknowledgments",
            "label": "Manage Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "manage_any_acknowledgments",
            "label": "Manage All Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "manage_own_acknowledgments",
            "label": "Manage Own Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "manage_acknowledgment_status",
            "label": "Manage Acknowledgment Status",
            "module": "acknowledgments"
          },
          {
            "value": "download_acknowledgment",
            "label": "Download Acknowledgment",
            "module": "acknowledgments"
          },
          {
            "value": "view_acknowledgments",
            "label": "View Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "create_acknowledgments",
            "label": "Create Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "edit_acknowledgments",
            "label": "Edit Acknowledgments",
            "module": "acknowledgments"
          },
          {
            "value": "delete_acknowledgments",
            "label": "Delete Acknowledgments",
            "module": "acknowledgments"
          }
        ]
      },
      {
        "module": "announcement-categories",
        "moduleLabel": "Announcement Categories",
        "permissions": [
          {
            "value": "manage_announcement_categories",
            "label": "Manage AnnouncementCategories",
            "module": "announcement-categories"
          },
          {
            "value": "manage_any_announcement_categories",
            "label": "Manage All AnnouncementCategories",
            "module": "announcement-categories"
          },
          {
            "value": "manage_own_announcement_categories",
            "label": "Manage Own AnnouncementCategories",
            "module": "announcement-categories"
          },
          {
            "value": "create_announcement_categories",
            "label": "Create AnnouncementCategories",
            "module": "announcement-categories"
          },
          {
            "value": "edit_announcement_categories",
            "label": "Edit AnnouncementCategories",
            "module": "announcement-categories"
          },
          {
            "value": "delete_announcement_categories",
            "label": "Delete AnnouncementCategories",
            "module": "announcement-categories"
          }
        ]
      },
      {
        "module": "announcements",
        "moduleLabel": "Announcements",
        "permissions": [
          {
            "value": "manage_announcements",
            "label": "Manage Announcements",
            "module": "announcements"
          },
          {
            "value": "manage_any_announcements",
            "label": "Manage All Announcements",
            "module": "announcements"
          },
          {
            "value": "manage_own_announcements",
            "label": "Manage Own Announcements",
            "module": "announcements"
          },
          {
            "value": "manage_announcements_status",
            "label": "Manage Announcement Status",
            "module": "announcements"
          },
          {
            "value": "view_announcements",
            "label": "View Announcements",
            "module": "announcements"
          },
          {
            "value": "create_announcements",
            "label": "Create Announcements",
            "module": "announcements"
          },
          {
            "value": "edit_announcements",
            "label": "Edit Announcements",
            "module": "announcements"
          },
          {
            "value": "delete_announcements",
            "label": "Delete Announcements",
            "module": "announcements"
          }
        ]
      },
      {
        "module": "event-types",
        "moduleLabel": "Event Types",
        "permissions": [
          {
            "value": "manage_event_types",
            "label": "Manage EventTypes",
            "module": "event-types"
          },
          {
            "value": "manage_any_event_types",
            "label": "Manage All EventTypes",
            "module": "event-types"
          },
          {
            "value": "manage_own_event_types",
            "label": "Manage Own EventTypes",
            "module": "event-types"
          },
          {
            "value": "create_event_types",
            "label": "Create EventTypes",
            "module": "event-types"
          },
          {
            "value": "edit_event_types",
            "label": "Edit EventTypes",
            "module": "event-types"
          },
          {
            "value": "delete_event_types",
            "label": "Delete EventTypes",
            "module": "event-types"
          }
        ]
      },
      {
        "module": "events",
        "moduleLabel": "Events",
        "permissions": [
          {
            "value": "manage_events",
            "label": "Manage Events",
            "module": "events"
          },
          {
            "value": "manage_any_events",
            "label": "Manage All Events",
            "module": "events"
          },
          {
            "value": "manage_own_events",
            "label": "Manage Own Events",
            "module": "events"
          },
          {
            "value": "manage_event_status",
            "label": "Manage Event Status",
            "module": "events"
          },
          {
            "value": "view_event_calendar",
            "label": "View Event Calendar",
            "module": "events"
          },
          {
            "value": "view_events",
            "label": "View Events",
            "module": "events"
          },
          {
            "value": "create_events",
            "label": "Create Events",
            "module": "events"
          },
          {
            "value": "edit_events",
            "label": "Edit Events",
            "module": "events"
          },
          {
            "value": "delete_events",
            "label": "Delete Events",
            "module": "events"
          }
        ]
      },
      {
        "module": "leave-types",
        "moduleLabel": "Leave Types",
        "permissions": [
          {
            "value": "manage_leave_types",
            "label": "Manage LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "manage_any_leave_types",
            "label": "Manage All LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "manage_own_leave_types",
            "label": "Manage Own LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "view_leave_types",
            "label": "View LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "create_leave_types",
            "label": "Create LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "edit_leave_types",
            "label": "Edit LeaveTypes",
            "module": "leave-types"
          },
          {
            "value": "delete_leave_types",
            "label": "Delete LeaveTypes",
            "module": "leave-types"
          }
        ]
      },
      {
        "module": "leave-applications",
        "moduleLabel": "Leave Applications",
        "permissions": [
          {
            "value": "manage_leave_applications",
            "label": "Manage LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "manage_any_leave_applications",
            "label": "Manage All LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "manage_own_leave_applications",
            "label": "Manage Own LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "manage_leave_status",
            "label": "Manage Leave Status",
            "module": "leave-applications"
          },
          {
            "value": "view_leave_applications",
            "label": "View LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "create_leave_applications",
            "label": "Create LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "edit_leave_applications",
            "label": "Edit LeaveApplications",
            "module": "leave-applications"
          },
          {
            "value": "delete_leave_applications",
            "label": "Delete LeaveApplications",
            "module": "leave-applications"
          }
        ]
      },
      {
        "module": "leave-balance",
        "moduleLabel": "Leave Balance",
        "permissions": [
          {
            "value": "manage_leave_balance",
            "label": "View Leave Balance",
            "module": "leave-balance"
          },
          {
            "value": "manage_any_leave_balance",
            "label": "Manage All Leave Balance",
            "module": "leave-balance"
          },
          {
            "value": "manage_own_leave_balance",
            "label": "Manage Own Leave Balance",
            "module": "leave-balance"
          }
        ]
      },
      {
        "module": "shifts",
        "moduleLabel": "Shifts",
        "permissions": [
          {
            "value": "manage_shifts",
            "label": "Manage Shifts",
            "module": "shifts"
          },
          {
            "value": "manage_any_shifts",
            "label": "Manage All Shifts",
            "module": "shifts"
          },
          {
            "value": "manage_own_shifts",
            "label": "Manage Own Shifts",
            "module": "shifts"
          },
          {
            "value": "view_shifts",
            "label": "View Shifts",
            "module": "shifts"
          },
          {
            "value": "create_shifts",
            "label": "Create Shifts",
            "module": "shifts"
          },
          {
            "value": "edit_shifts",
            "label": "Edit Shifts",
            "module": "shifts"
          },
          {
            "value": "delete_shifts",
            "label": "Delete Shifts",
            "module": "shifts"
          }
        ]
      },
      {
        "module": "attendances",
        "moduleLabel": "Attendances",
        "permissions": [
          {
            "value": "manage_attendances",
            "label": "Manage Attendances",
            "module": "attendances"
          },
          {
            "value": "manage_any_attendances",
            "label": "Manage All Attendances",
            "module": "attendances"
          },
          {
            "value": "manage_own_attendances",
            "label": "Manage Own Attendances",
            "module": "attendances"
          },
          {
            "value": "view_attendances",
            "label": "View Attendances",
            "module": "attendances"
          },
          {
            "value": "create_attendances",
            "label": "Create Attendances",
            "module": "attendances"
          },
          {
            "value": "edit_attendances",
            "label": "Edit Attendances",
            "module": "attendances"
          },
          {
            "value": "delete_attendances",
            "label": "Delete Attendances",
            "module": "attendances"
          },
          {
            "value": "clock_in",
            "label": "Clock In",
            "module": "attendances"
          },
          {
            "value": "clock_out",
            "label": "Clock Out",
            "module": "attendances"
          }
        ]
      },
      {
        "module": "payslip",
        "moduleLabel": "Payslip",
        "permissions": [
          {
            "value": "manage_payslip",
            "label": "Manage Payslip",
            "module": "payslip"
          },
          {
            "value": "manage_any_payslip",
            "label": "Manage All Payslip",
            "module": "payslip"
          },
          {
            "value": "manage_own_payslip",
            "label": "Manage Own Payslip",
            "module": "payslip"
          },
          {
            "value": "pay_payslip",
            "label": "Pay Payslip",
            "module": "payslip"
          },
          {
            "value": "download_payslip",
            "label": "Download Payslip",
            "module": "payslip"
          },
          {
            "value": "view_payslip",
            "label": "View Payslip",
            "module": "payslip"
          },
          {
            "value": "delete_payslip",
            "label": "Delete Payslip",
            "module": "payslip"
          }
        ]
      },
      {
        "module": "set-salary",
        "moduleLabel": "Set Salary",
        "permissions": [
          {
            "value": "manage_set_salary",
            "label": "Manage Set Salary",
            "module": "set-salary"
          },
          {
            "value": "manage_any_set_salary",
            "label": "Manage All Set Salary",
            "module": "set-salary"
          },
          {
            "value": "manage_own_set_salary",
            "label": "Manage Own Set Salary",
            "module": "set-salary"
          },
          {
            "value": "view_set_salary",
            "label": "View Set Salary",
            "module": "set-salary"
          },
          {
            "value": "create_set_salary",
            "label": "Create Set Salary",
            "module": "set-salary"
          },
          {
            "value": "edit_set_salary",
            "label": "Edit Set Salary",
            "module": "set-salary"
          },
          {
            "value": "delete_set_salary",
            "label": "Delete Set Salary",
            "module": "set-salary"
          }
        ]
      },
      {
        "module": "allowance-types",
        "moduleLabel": "Allowance Types",
        "permissions": [
          {
            "value": "manage_allowance_types",
            "label": "Manage AllowanceTypes",
            "module": "allowance-types"
          },
          {
            "value": "manage_any_allowance_types",
            "label": "Manage All AllowanceTypes",
            "module": "allowance-types"
          },
          {
            "value": "manage_own_allowance_types",
            "label": "Manage Own AllowanceTypes",
            "module": "allowance-types"
          },
          {
            "value": "create_allowance_types",
            "label": "Create AllowanceTypes",
            "module": "allowance-types"
          },
          {
            "value": "edit_allowance_types",
            "label": "Edit AllowanceTypes",
            "module": "allowance-types"
          },
          {
            "value": "delete_allowance_types",
            "label": "Delete AllowanceTypes",
            "module": "allowance-types"
          }
        ]
      },
      {
        "module": "deduction-types",
        "moduleLabel": "Deduction Types",
        "permissions": [
          {
            "value": "manage_deduction_types",
            "label": "Manage DeductionTypes",
            "module": "deduction-types"
          },
          {
            "value": "manage_any_deduction_types",
            "label": "Manage All DeductionTypes",
            "module": "deduction-types"
          },
          {
            "value": "manage_own_deduction_types",
            "label": "Manage Own DeductionTypes",
            "module": "deduction-types"
          },
          {
            "value": "create_deduction_types",
            "label": "Create DeductionTypes",
            "module": "deduction-types"
          },
          {
            "value": "edit_deduction_types",
            "label": "Edit DeductionTypes",
            "module": "deduction-types"
          },
          {
            "value": "delete_deduction_types",
            "label": "Delete DeductionTypes",
            "module": "deduction-types"
          }
        ]
      },
      {
        "module": "loan-types",
        "moduleLabel": "Loan Types",
        "permissions": [
          {
            "value": "manage_loan_types",
            "label": "Manage LoanTypes",
            "module": "loan-types"
          },
          {
            "value": "manage_any_loan_types",
            "label": "Manage All LoanTypes",
            "module": "loan-types"
          },
          {
            "value": "manage_own_loan_types",
            "label": "Manage Own LoanTypes",
            "module": "loan-types"
          },
          {
            "value": "create_loan_types",
            "label": "Create LoanTypes",
            "module": "loan-types"
          },
          {
            "value": "edit_loan_types",
            "label": "Edit LoanTypes",
            "module": "loan-types"
          },
          {
            "value": "delete_loan_types",
            "label": "Delete LoanTypes",
            "module": "loan-types"
          }
        ]
      },
      {
        "module": "allowances",
        "moduleLabel": "Allowances",
        "permissions": [
          {
            "value": "manage_allowances",
            "label": "Manage Allowances",
            "module": "allowances"
          },
          {
            "value": "manage_any_allowances",
            "label": "Manage All Allowances",
            "module": "allowances"
          },
          {
            "value": "manage_own_allowances",
            "label": "Manage Own Allowances",
            "module": "allowances"
          },
          {
            "value": "create_allowances",
            "label": "Create Allowances",
            "module": "allowances"
          },
          {
            "value": "edit_allowances",
            "label": "Edit Allowances",
            "module": "allowances"
          },
          {
            "value": "delete_allowances",
            "label": "Delete Allowances",
            "module": "allowances"
          }
        ]
      },
      {
        "module": "deductions",
        "moduleLabel": "Deductions",
        "permissions": [
          {
            "value": "manage_deductions",
            "label": "Manage Deductions",
            "module": "deductions"
          },
          {
            "value": "manage_any_deductions",
            "label": "Manage All Deductions",
            "module": "deductions"
          },
          {
            "value": "manage_own_deductions",
            "label": "Manage Own Deductions",
            "module": "deductions"
          },
          {
            "value": "create_deductions",
            "label": "Create Deductions",
            "module": "deductions"
          },
          {
            "value": "edit_deductions",
            "label": "Edit Deductions",
            "module": "deductions"
          },
          {
            "value": "delete_deductions",
            "label": "Delete Deductions",
            "module": "deductions"
          }
        ]
      },
      {
        "module": "loans",
        "moduleLabel": "Loans",
        "permissions": [
          {
            "value": "manage_loans",
            "label": "Manage Loans",
            "module": "loans"
          },
          {
            "value": "manage_any_loans",
            "label": "Manage All Loans",
            "module": "loans"
          },
          {
            "value": "manage_own_loans",
            "label": "Manage Own Loans",
            "module": "loans"
          },
          {
            "value": "view_loans",
            "label": "View Loans",
            "module": "loans"
          },
          {
            "value": "create_loans",
            "label": "Create Loans",
            "module": "loans"
          },
          {
            "value": "edit_loans",
            "label": "Edit Loans",
            "module": "loans"
          },
          {
            "value": "delete_loans",
            "label": "Delete Loans",
            "module": "loans"
          }
        ]
      },
      {
        "module": "overtimes",
        "moduleLabel": "Overtimes",
        "permissions": [
          {
            "value": "manage_overtimes",
            "label": "Manage Overtimes",
            "module": "overtimes"
          },
          {
            "value": "manage_any_overtimes",
            "label": "Manage All Overtimes",
            "module": "overtimes"
          },
          {
            "value": "manage_own_overtimes",
            "label": "Manage Own Overtimes",
            "module": "overtimes"
          },
          {
            "value": "view_overtimes",
            "label": "View Overtimes",
            "module": "overtimes"
          },
          {
            "value": "create_overtimes",
            "label": "Create Overtimes",
            "module": "overtimes"
          },
          {
            "value": "edit_overtimes",
            "label": "Edit Overtimes",
            "module": "overtimes"
          },
          {
            "value": "delete_overtimes",
            "label": "Delete Overtimes",
            "module": "overtimes"
          }
        ]
      },
      {
        "module": "payrolls",
        "moduleLabel": "Payrolls",
        "permissions": [
          {
            "value": "manage_payrolls",
            "label": "Manage Payrolls",
            "module": "payrolls"
          },
          {
            "value": "manage_any_payrolls",
            "label": "Manage All Payrolls",
            "module": "payrolls"
          },
          {
            "value": "manage_own_payrolls",
            "label": "Manage Own Payrolls",
            "module": "payrolls"
          },
          {
            "value": "view_payrolls",
            "label": "View Payrolls",
            "module": "payrolls"
          },
          {
            "value": "view_any_payrolls",
            "label": "View All Payrolls",
            "module": "payrolls"
          },
          {
            "value": "view_own_payrolls",
            "label": "View Own Payrolls",
            "module": "payrolls"
          },
          {
            "value": "run_payrolls",
            "label": "Run Payrolls",
            "module": "payrolls"
          },
          {
            "value": "create_payrolls",
            "label": "Create Payrolls",
            "module": "payrolls"
          },
          {
            "value": "edit_payrolls",
            "label": "Edit Payrolls",
            "module": "payrolls"
          },
          {
            "value": "delete_payrolls",
            "label": "Delete Payrolls",
            "module": "payrolls"
          }
        ]
      },
      {
        "module": "working-days",
        "moduleLabel": "Working Days",
        "permissions": [
          {
            "value": "manage_working_days",
            "label": "Manage Working Days",
            "module": "working-days"
          },
          {
            "value": "edit_working_days",
            "label": "Edit Working Days",
            "module": "working-days"
          }
        ]
      },
      {
        "module": "ip-restricts",
        "moduleLabel": "Ip Restricts",
        "permissions": [
          {
            "value": "manage_ip_restricts",
            "label": "Manage IpRestricts",
            "module": "ip-restricts"
          },
          {
            "value": "manage_any_ip_restricts",
            "label": "Manage All IpRestricts",
            "module": "ip-restricts"
          },
          {
            "value": "manage_own_ip_restricts",
            "label": "Manage Own IpRestricts",
            "module": "ip-restricts"
          },
          {
            "value": "create_ip_restricts",
            "label": "Create IpRestricts",
            "module": "ip-restricts"
          },
          {
            "value": "edit_ip_restricts",
            "label": "Edit IpRestricts",
            "module": "ip-restricts"
          },
          {
            "value": "delete_ip_restricts",
            "label": "Delete IpRestricts",
            "module": "ip-restricts"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Lead",
    "label": "CRM",
    "packageName": "Lead",
    "modules": [
      {
        "module": "lead",
        "moduleLabel": "Lead",
        "permissions": [
          {
            "value": "manage_crm_dashboard",
            "label": "Manage CRM Dashboard",
            "module": "lead"
          }
        ]
      },
      {
        "module": "pipelines",
        "moduleLabel": "Pipelines",
        "permissions": [
          {
            "value": "manage_pipelines",
            "label": "Manage Pipelines",
            "module": "pipelines"
          },
          {
            "value": "manage_any_pipelines",
            "label": "Manage All Pipelines",
            "module": "pipelines"
          },
          {
            "value": "manage_own_pipelines",
            "label": "Manage Own Pipelines",
            "module": "pipelines"
          },
          {
            "value": "create_pipelines",
            "label": "Create Pipelines",
            "module": "pipelines"
          },
          {
            "value": "edit_pipelines",
            "label": "Edit Pipelines",
            "module": "pipelines"
          },
          {
            "value": "delete_pipelines",
            "label": "Delete Pipelines",
            "module": "pipelines"
          }
        ]
      },
      {
        "module": "lead-stages",
        "moduleLabel": "Lead Stages",
        "permissions": [
          {
            "value": "manage_lead_stages",
            "label": "Manage LeadStages",
            "module": "lead-stages"
          },
          {
            "value": "manage_any_lead_stages",
            "label": "Manage All LeadStages",
            "module": "lead-stages"
          },
          {
            "value": "manage_own_lead_stages",
            "label": "Manage Own LeadStages",
            "module": "lead-stages"
          },
          {
            "value": "create_lead_stages",
            "label": "Create LeadStages",
            "module": "lead-stages"
          },
          {
            "value": "edit_lead_stages",
            "label": "Edit LeadStages",
            "module": "lead-stages"
          },
          {
            "value": "delete_lead_stages",
            "label": "Delete LeadStages",
            "module": "lead-stages"
          }
        ]
      },
      {
        "module": "deal-stages",
        "moduleLabel": "Deal Stages",
        "permissions": [
          {
            "value": "manage_deal_stages",
            "label": "Manage DealStages",
            "module": "deal-stages"
          },
          {
            "value": "manage_any_deal_stages",
            "label": "Manage All DealStages",
            "module": "deal-stages"
          },
          {
            "value": "manage_own_deal_stages",
            "label": "Manage Own DealStages",
            "module": "deal-stages"
          },
          {
            "value": "create_deal_stages",
            "label": "Create DealStages",
            "module": "deal-stages"
          },
          {
            "value": "edit_deal_stages",
            "label": "Edit DealStages",
            "module": "deal-stages"
          },
          {
            "value": "delete_deal_stages",
            "label": "Delete DealStages",
            "module": "deal-stages"
          }
        ]
      },
      {
        "module": "labels",
        "moduleLabel": "Labels",
        "permissions": [
          {
            "value": "manage_labels",
            "label": "Manage Labels",
            "module": "labels"
          },
          {
            "value": "manage_any_labels",
            "label": "Manage All Labels",
            "module": "labels"
          },
          {
            "value": "manage_own_labels",
            "label": "Manage Own Labels",
            "module": "labels"
          },
          {
            "value": "create_labels",
            "label": "Create Labels",
            "module": "labels"
          },
          {
            "value": "edit_labels",
            "label": "Edit Labels",
            "module": "labels"
          },
          {
            "value": "delete_labels",
            "label": "Delete Labels",
            "module": "labels"
          }
        ]
      },
      {
        "module": "sources",
        "moduleLabel": "Sources",
        "permissions": [
          {
            "value": "manage_sources",
            "label": "Manage Sources",
            "module": "sources"
          },
          {
            "value": "manage_any_sources",
            "label": "Manage All Sources",
            "module": "sources"
          },
          {
            "value": "manage_own_sources",
            "label": "Manage Own Sources",
            "module": "sources"
          },
          {
            "value": "create_sources",
            "label": "Create Sources",
            "module": "sources"
          },
          {
            "value": "edit_sources",
            "label": "Edit Sources",
            "module": "sources"
          },
          {
            "value": "delete_sources",
            "label": "Delete Sources",
            "module": "sources"
          }
        ]
      },
      {
        "module": "leads",
        "moduleLabel": "Leads",
        "permissions": [
          {
            "value": "manage_leads",
            "label": "Manage Leads",
            "module": "leads"
          },
          {
            "value": "manage_any_leads",
            "label": "Manage All Leads",
            "module": "leads"
          },
          {
            "value": "manage_own_leads",
            "label": "Manage Own Leads",
            "module": "leads"
          },
          {
            "value": "view_leads",
            "label": "View Leads",
            "module": "leads"
          },
          {
            "value": "create_leads",
            "label": "Create Leads",
            "module": "leads"
          },
          {
            "value": "edit_leads",
            "label": "Edit Leads",
            "module": "leads"
          },
          {
            "value": "delete_leads",
            "label": "Delete Leads",
            "module": "leads"
          },
          {
            "value": "lead_move",
            "label": "Move Leads",
            "module": "leads"
          }
        ]
      },
      {
        "module": "lead-tasks",
        "moduleLabel": "Lead Tasks",
        "permissions": [
          {
            "value": "manage_lead_tasks",
            "label": "Manage Lead Tasks",
            "module": "lead-tasks"
          },
          {
            "value": "manage_any_lead_tasks",
            "label": "Manage All Lead Tasks",
            "module": "lead-tasks"
          },
          {
            "value": "manage_own_lead_tasks",
            "label": "Manage Own Lead Tasks",
            "module": "lead-tasks"
          },
          {
            "value": "create_lead_tasks",
            "label": "Create Lead Tasks",
            "module": "lead-tasks"
          },
          {
            "value": "edit_lead_tasks",
            "label": "Edit Lead Tasks",
            "module": "lead-tasks"
          },
          {
            "value": "delete_lead_tasks",
            "label": "Delete Lead Tasks",
            "module": "lead-tasks"
          }
        ]
      },
      {
        "module": "deals",
        "moduleLabel": "Deals",
        "permissions": [
          {
            "value": "manage_deals",
            "label": "Manage Deals",
            "module": "deals"
          },
          {
            "value": "manage_any_deals",
            "label": "Manage All Deals",
            "module": "deals"
          },
          {
            "value": "manage_own_deals",
            "label": "Manage Own Deals",
            "module": "deals"
          },
          {
            "value": "view_deals",
            "label": "View Deals",
            "module": "deals"
          },
          {
            "value": "create_deals",
            "label": "Create Deals",
            "module": "deals"
          },
          {
            "value": "edit_deals",
            "label": "Edit Deals",
            "module": "deals"
          },
          {
            "value": "delete_deals",
            "label": "Delete Deals",
            "module": "deals"
          },
          {
            "value": "deal_move",
            "label": "Move Deals",
            "module": "deals"
          }
        ]
      },
      {
        "module": "deal-tasks",
        "moduleLabel": "Deal Tasks",
        "permissions": [
          {
            "value": "manage_deal_tasks",
            "label": "Manage Deal Tasks",
            "module": "deal-tasks"
          },
          {
            "value": "manage_any_deal_tasks",
            "label": "Manage All Deal Tasks",
            "module": "deal-tasks"
          },
          {
            "value": "manage_own_deal_tasks",
            "label": "Manage Own Deal Tasks",
            "module": "deal-tasks"
          },
          {
            "value": "create_deal_tasks",
            "label": "Create Deal Tasks",
            "module": "deal-tasks"
          },
          {
            "value": "edit_deal_tasks",
            "label": "Edit Deal Tasks",
            "module": "deal-tasks"
          },
          {
            "value": "delete_deal_tasks",
            "label": "Delete Deal Tasks",
            "module": "deal-tasks"
          }
        ]
      },
      {
        "module": "reports",
        "moduleLabel": "Reports",
        "permissions": [
          {
            "value": "manage_reports",
            "label": "Manage Reports",
            "module": "reports"
          },
          {
            "value": "view_reports",
            "label": "View Reports",
            "module": "reports"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Pos",
    "label": "POS",
    "packageName": "Pos",
    "modules": [
      {
        "module": "pos",
        "moduleLabel": "Pos",
        "permissions": [
          {
            "value": "manage_pos_dashboard",
            "label": "Manage Pos Dashboard",
            "module": "pos"
          },
          {
            "value": "manage_pos",
            "label": "Manage Pos",
            "module": "pos"
          },
          {
            "value": "create_pos",
            "label": "Create Pos",
            "module": "pos"
          }
        ]
      },
      {
        "module": "pos-orders",
        "moduleLabel": "Pos Orders",
        "permissions": [
          {
            "value": "manage_pos_orders",
            "label": "Manage Pos Orders",
            "module": "pos-orders"
          },
          {
            "value": "view_pos_orders",
            "label": "View Pos Orders",
            "module": "pos-orders"
          }
        ]
      },
      {
        "module": "pos-barcodes",
        "moduleLabel": "Pos Barcodes",
        "permissions": [
          {
            "value": "manage_pos_barcodes",
            "label": "Manage Pos Barcodes",
            "module": "pos-barcodes"
          },
          {
            "value": "print_pos_barcodes",
            "label": "Print Pos Barcodes",
            "module": "pos-barcodes"
          }
        ]
      },
      {
        "module": "pos-reports",
        "moduleLabel": "Pos Reports",
        "permissions": [
          {
            "value": "manage_pos_reports",
            "label": "Manage Pos Reports",
            "module": "pos-reports"
          },
          {
            "value": "view_pos_reports",
            "label": "View Pos Reports",
            "module": "pos-reports"
          }
        ]
      }
    ]
  },
  {
    "addOn": "SupportTicket",
    "label": "Support Ticket",
    "packageName": "SupportTicket",
    "modules": [
      {
        "module": "dashboard",
        "moduleLabel": "Dashboard",
        "permissions": [
          {
            "value": "manage_dashboard_support_ticket",
            "label": "Manage Support Ticket Dashboard",
            "module": "dashboard"
          }
        ]
      },
      {
        "module": "support-tickets",
        "moduleLabel": "Support Tickets",
        "permissions": [
          {
            "value": "manage_support_tickets",
            "label": "Manage Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "manage_any_support_tickets",
            "label": "Manage All Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "manage_own_support_tickets",
            "label": "Manage Own Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "view_support_tickets",
            "label": "View Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "create_support_tickets",
            "label": "Create Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "edit_support_tickets",
            "label": "Edit Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "delete_support_tickets",
            "label": "Delete Support Tickets",
            "module": "support-tickets"
          },
          {
            "value": "reply_support_tickets",
            "label": "Reply Support Tickets",
            "module": "support-tickets"
          }
        ]
      },
      {
        "module": "ticket-categories",
        "moduleLabel": "Ticket Categories",
        "permissions": [
          {
            "value": "manage_ticket_categories",
            "label": "Manage Categories",
            "module": "ticket-categories"
          },
          {
            "value": "manage_any_ticket_categories",
            "label": "Manage All Categories",
            "module": "ticket-categories"
          },
          {
            "value": "manage_own_ticket_categories",
            "label": "Manage Own Categories",
            "module": "ticket-categories"
          },
          {
            "value": "create_ticket_categories",
            "label": "Create Categories",
            "module": "ticket-categories"
          },
          {
            "value": "edit_ticket_categories",
            "label": "Edit Categories",
            "module": "ticket-categories"
          },
          {
            "value": "delete_ticket_categories",
            "label": "Delete Categories",
            "module": "ticket-categories"
          }
        ]
      },
      {
        "module": "knowledge-base",
        "moduleLabel": "Knowledge Base",
        "permissions": [
          {
            "value": "manage_knowledge_base",
            "label": "Manage Knowledge Base",
            "module": "knowledge-base"
          },
          {
            "value": "manage_any_knowledge_base",
            "label": "Manage All Knowledge Base",
            "module": "knowledge-base"
          },
          {
            "value": "manage_own_knowledge_base",
            "label": "Manage Own Knowledge Base",
            "module": "knowledge-base"
          },
          {
            "value": "create_knowledge_base",
            "label": "Create Knowledge Base",
            "module": "knowledge-base"
          },
          {
            "value": "edit_knowledge_base",
            "label": "Edit Knowledge Base",
            "module": "knowledge-base"
          },
          {
            "value": "delete_knowledge_base",
            "label": "Delete Knowledge Base",
            "module": "knowledge-base"
          }
        ]
      },
      {
        "module": "faq",
        "moduleLabel": "Faq",
        "permissions": [
          {
            "value": "manage_faq",
            "label": "Manage FAQ",
            "module": "faq"
          },
          {
            "value": "manage_any_faq",
            "label": "Manage All FAQ",
            "module": "faq"
          },
          {
            "value": "manage_own_faq",
            "label": "Manage Own FAQ",
            "module": "faq"
          },
          {
            "value": "create_faq",
            "label": "Create FAQ",
            "module": "faq"
          },
          {
            "value": "edit_faq",
            "label": "Edit FAQ",
            "module": "faq"
          },
          {
            "value": "delete_faq",
            "label": "Delete FAQ",
            "module": "faq"
          }
        ]
      },
      {
        "module": "contact",
        "moduleLabel": "Contact",
        "permissions": [
          {
            "value": "manage_contact",
            "label": "Manage Contact",
            "module": "contact"
          },
          {
            "value": "manage_any_contact",
            "label": "Manage All Contact",
            "module": "contact"
          },
          {
            "value": "manage_own_contact",
            "label": "Manage Own Contact",
            "module": "contact"
          },
          {
            "value": "view_contact",
            "label": "View Contact",
            "module": "contact"
          },
          {
            "value": "delete_contact",
            "label": "Delete Contact",
            "module": "contact"
          }
        ]
      },
      {
        "module": "support-settings",
        "moduleLabel": "Support Settings",
        "permissions": [
          {
            "value": "manage_support_settings",
            "label": "Manage Support Settings",
            "module": "support-settings"
          },
          {
            "value": "edit_support_settings",
            "label": "Edit Support Settings",
            "module": "support-settings"
          }
        ]
      },
      {
        "module": "support-ticket-settings",
        "moduleLabel": "Support Ticket Settings",
        "permissions": [
          {
            "value": "manage_support_ticket_settings",
            "label": "Manage Support Ticket Settings",
            "module": "support-ticket-settings"
          }
        ]
      },
      {
        "module": "support-ticket-title-sections",
        "moduleLabel": "Support Ticket Title Sections",
        "permissions": [
          {
            "value": "manage_support_ticket_title_sections",
            "label": "Manage Title Sections",
            "module": "support-ticket-title-sections"
          },
          {
            "value": "edit_support_ticket_title_sections",
            "label": "Edit Title Sections",
            "module": "support-ticket-title-sections"
          }
        ]
      },
      {
        "module": "support-ticket-contact-information",
        "moduleLabel": "Support Ticket Contact Information",
        "permissions": [
          {
            "value": "manage_support_ticket_contact_information",
            "label": "Manage Contact Information",
            "module": "support-ticket-contact-information"
          }
        ]
      },
      {
        "module": "support-ticket-custom-pages",
        "moduleLabel": "Support Ticket Custom Pages",
        "permissions": [
          {
            "value": "create_support_ticket_contact_information",
            "label": "Create Contact Information",
            "module": "support-ticket-custom-pages"
          },
          {
            "value": "manage_support_ticket_custom_pages",
            "label": "Manage Custom Pages",
            "module": "support-ticket-custom-pages"
          },
          {
            "value": "create_support_ticket_custom_pages",
            "label": "Create Custom Pages",
            "module": "support-ticket-custom-pages"
          },
          {
            "value": "edit_support_ticket_custom_pages",
            "label": "Edit Custom Pages",
            "module": "support-ticket-custom-pages"
          },
          {
            "value": "delete_support_ticket_custom_pages",
            "label": "Delete Custom Pages",
            "module": "support-ticket-custom-pages"
          },
          {
            "value": "edit_support_ticket_brand_settings",
            "label": "Edit Brand Settings",
            "module": "support-ticket-custom-pages"
          }
        ]
      },
      {
        "module": "support-ticket-cta-sections",
        "moduleLabel": "Support Ticket Cta Sections",
        "permissions": [
          {
            "value": "manage_support_ticket_cta_sections",
            "label": "Manage CTA Sections",
            "module": "support-ticket-cta-sections"
          },
          {
            "value": "create_support_ticket_cta_sections",
            "label": "Create CTA Sections",
            "module": "support-ticket-cta-sections"
          }
        ]
      },
      {
        "module": "support-ticket-quick-links",
        "moduleLabel": "Support Ticket Quick Links",
        "permissions": [
          {
            "value": "manage_support_ticket_quick_links",
            "label": "Manage Quick Links",
            "module": "support-ticket-quick-links"
          },
          {
            "value": "create_support_ticket_quick_links",
            "label": "Create Quick Links",
            "module": "support-ticket-quick-links"
          },
          {
            "value": "edit_support_ticket_quick_links",
            "label": "Edit Quick Links",
            "module": "support-ticket-quick-links"
          },
          {
            "value": "delete_support_ticket_quick_links",
            "label": "Delete Quick Links",
            "module": "support-ticket-quick-links"
          },
          {
            "value": "edit_support_ticket_support_information",
            "label": "Edit Support Information",
            "module": "support-ticket-quick-links"
          }
        ]
      },
      {
        "module": "support-ticket-support-information",
        "moduleLabel": "Support Ticket Support Information",
        "permissions": [
          {
            "value": "manage_support_ticket_support_information",
            "label": "Manage Support Information",
            "module": "support-ticket-support-information"
          }
        ]
      },
      {
        "module": "support-ticket-brand-settings",
        "moduleLabel": "Support Ticket Brand Settings",
        "permissions": [
          {
            "value": "manage_support_ticket_brand_settings",
            "label": "Manage Brand Settings",
            "module": "support-ticket-brand-settings"
          }
        ]
      }
    ]
  },
  {
    "addOn": "DoubleEntry",
    "label": "Double Entry",
    "packageName": "DoubleEntry",
    "modules": [
      {
        "module": "double-entry",
        "moduleLabel": "Double Entry",
        "permissions": [
          {
            "value": "manage_double_entry",
            "label": "Manage Double Entry",
            "module": "double-entry"
          }
        ]
      },
      {
        "module": "balance-sheets",
        "moduleLabel": "Balance Sheets",
        "permissions": [
          {
            "value": "manage_balance_sheets",
            "label": "Manage Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "view_balance_sheets",
            "label": "View Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "create_balance_sheets",
            "label": "Create Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "finalize_balance_sheets",
            "label": "Finalize Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "delete_balance_sheets",
            "label": "Delete Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "print_balance_sheets",
            "label": "Print Balance Sheets",
            "module": "balance-sheets"
          },
          {
            "value": "year_end_close",
            "label": "Year-End Close",
            "module": "balance-sheets"
          }
        ]
      },
      {
        "module": "balance-sheet-notes",
        "moduleLabel": "Balance Sheet Notes",
        "permissions": [
          {
            "value": "create_balance_sheet_notes",
            "label": "Create Balance Sheet Notes",
            "module": "balance-sheet-notes"
          },
          {
            "value": "delete_balance_sheet_notes",
            "label": "Delete Balance Sheet Notes",
            "module": "balance-sheet-notes"
          }
        ]
      },
      {
        "module": "balance-sheet-comparisons",
        "moduleLabel": "Balance Sheet Comparisons",
        "permissions": [
          {
            "value": "create_balance_sheet_comparisons",
            "label": "Create Balance Sheet Comparisons",
            "module": "balance-sheet-comparisons"
          },
          {
            "value": "view_balance_sheet_comparisons",
            "label": "View Balance Sheet Comparisons",
            "module": "balance-sheet-comparisons"
          }
        ]
      },
      {
        "module": "ledger-summary",
        "moduleLabel": "Ledger Summary",
        "permissions": [
          {
            "value": "manage_ledger_summary",
            "label": "Manage Ledger Summary",
            "module": "ledger-summary"
          },
          {
            "value": "print_ledger_summary",
            "label": "Print Ledger Summary",
            "module": "ledger-summary"
          }
        ]
      },
      {
        "module": "profit-loss",
        "moduleLabel": "Profit Loss",
        "permissions": [
          {
            "value": "manage_profit_loss",
            "label": "Manage Profit & Loss",
            "module": "profit-loss"
          },
          {
            "value": "print_profit_loss",
            "label": "Print Profit & Loss",
            "module": "profit-loss"
          }
        ]
      },
      {
        "module": "trial-balance",
        "moduleLabel": "Trial Balance",
        "permissions": [
          {
            "value": "manage_trial_balance",
            "label": "Manage Trial Balance",
            "module": "trial-balance"
          },
          {
            "value": "print_trial_balance",
            "label": "Print Trial Balance",
            "module": "trial-balance"
          }
        ]
      },
      {
        "module": "reports",
        "moduleLabel": "Reports",
        "permissions": [
          {
            "value": "manage_double_entry_reports",
            "label": "Manage Reports",
            "module": "reports"
          },
          {
            "value": "view_general_ledger",
            "label": "View General Ledger",
            "module": "reports"
          },
          {
            "value": "view_account_statement",
            "label": "View Account Statement",
            "module": "reports"
          },
          {
            "value": "view_journal_entry",
            "label": "View Journal Entry",
            "module": "reports"
          },
          {
            "value": "view_account_balance",
            "label": "View Account Balance",
            "module": "reports"
          },
          {
            "value": "view_cash_flow",
            "label": "View Cash Flow",
            "module": "reports"
          },
          {
            "value": "view_expense_report",
            "label": "View Expense Report",
            "module": "reports"
          },
          {
            "value": "print_general_ledger",
            "label": "Print General Ledger",
            "module": "reports"
          },
          {
            "value": "print_account_statement",
            "label": "Print Account Statement",
            "module": "reports"
          },
          {
            "value": "print_journal_entry",
            "label": "Print Journal Entry",
            "module": "reports"
          },
          {
            "value": "print_account_balance",
            "label": "Print Account Balance",
            "module": "reports"
          },
          {
            "value": "print_cash_flow",
            "label": "Print Cash Flow",
            "module": "reports"
          },
          {
            "value": "print_expense_report",
            "label": "Print Expense Report",
            "module": "reports"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Goal",
    "label": "Financial Goal",
    "packageName": "Goal",
    "modules": [
      {
        "module": "goal",
        "moduleLabel": "Goal",
        "permissions": [
          {
            "value": "manage_goal",
            "label": "Manage Goal",
            "module": "goal"
          }
        ]
      },
      {
        "module": "categories",
        "moduleLabel": "Categories",
        "permissions": [
          {
            "value": "manage_categories",
            "label": "Manage Categories",
            "module": "categories"
          },
          {
            "value": "manage_any_categories",
            "label": "Manage All Categories",
            "module": "categories"
          },
          {
            "value": "manage_own_categories",
            "label": "Manage Own Categories",
            "module": "categories"
          },
          {
            "value": "create_categories",
            "label": "Create Categories",
            "module": "categories"
          },
          {
            "value": "edit_categories",
            "label": "Edit Categories",
            "module": "categories"
          },
          {
            "value": "delete_categories",
            "label": "Delete Categories",
            "module": "categories"
          }
        ]
      },
      {
        "module": "goals",
        "moduleLabel": "Goals",
        "permissions": [
          {
            "value": "manage_goals",
            "label": "Manage Goals",
            "module": "goals"
          },
          {
            "value": "manage_any_goals",
            "label": "Manage All Goals",
            "module": "goals"
          },
          {
            "value": "manage_own_goals",
            "label": "Manage Own Goals",
            "module": "goals"
          },
          {
            "value": "view_goals",
            "label": "View Goals",
            "module": "goals"
          },
          {
            "value": "create_goals",
            "label": "Create Goals",
            "module": "goals"
          },
          {
            "value": "edit_goals",
            "label": "Edit Goals",
            "module": "goals"
          },
          {
            "value": "delete_goals",
            "label": "Delete Goals",
            "module": "goals"
          },
          {
            "value": "active_goals",
            "label": "Active Goals",
            "module": "goals"
          }
        ]
      },
      {
        "module": "goal-milestones",
        "moduleLabel": "Goal Milestones",
        "permissions": [
          {
            "value": "manage_goal_milestones",
            "label": "Manage Goal Milestones",
            "module": "goal-milestones"
          },
          {
            "value": "manage_any_goal_milestones",
            "label": "Manage All Goal Milestones",
            "module": "goal-milestones"
          },
          {
            "value": "manage_own_goal_milestones",
            "label": "Manage Own Goal Milestones",
            "module": "goal-milestones"
          },
          {
            "value": "create_goal_milestones",
            "label": "Create Goal Milestones",
            "module": "goal-milestones"
          },
          {
            "value": "edit_goal_milestones",
            "label": "Edit Goal Milestones",
            "module": "goal-milestones"
          },
          {
            "value": "delete_goal_milestones",
            "label": "Delete Goal Milestones",
            "module": "goal-milestones"
          }
        ]
      },
      {
        "module": "goal-contributions",
        "moduleLabel": "Goal Contributions",
        "permissions": [
          {
            "value": "manage_goal_contributions",
            "label": "Manage Goal Contributions",
            "module": "goal-contributions"
          },
          {
            "value": "manage_any_goal_contributions",
            "label": "Manage All Goal Contributions",
            "module": "goal-contributions"
          },
          {
            "value": "manage_own_goal_contributions",
            "label": "Manage Own Goal Contributions",
            "module": "goal-contributions"
          },
          {
            "value": "create_goal_contributions",
            "label": "Create Goal Contributions",
            "module": "goal-contributions"
          },
          {
            "value": "edit_goal_contributions",
            "label": "Edit Goal Contributions",
            "module": "goal-contributions"
          },
          {
            "value": "delete_goal_contributions",
            "label": "Delete Goal Contributions",
            "module": "goal-contributions"
          }
        ]
      },
      {
        "module": "goal-tracking",
        "moduleLabel": "Goal Tracking",
        "permissions": [
          {
            "value": "manage_goal_tracking",
            "label": "Manage Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "manage_any_goal_tracking",
            "label": "Manage All Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "manage_own_goal_tracking",
            "label": "Manage Own Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "view_goal_tracking",
            "label": "View Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "create_goal_tracking",
            "label": "Create Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "edit_goal_tracking",
            "label": "Edit Goal Tracking",
            "module": "goal-tracking"
          },
          {
            "value": "delete_goal_tracking",
            "label": "Delete Goal Tracking",
            "module": "goal-tracking"
          }
        ]
      }
    ]
  },
  {
    "addOn": "BudgetPlanner",
    "label": "Budget Planner",
    "packageName": "BudgetPlanner",
    "modules": [
      {
        "module": "budget-planner",
        "moduleLabel": "Budget Planner",
        "permissions": [
          {
            "value": "manage_budget_planner",
            "label": "Manage BudgetPlanner",
            "module": "budget-planner"
          }
        ]
      },
      {
        "module": "budget-periods",
        "moduleLabel": "Budget Periods",
        "permissions": [
          {
            "value": "manage_budget_periods",
            "label": "Manage BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "manage_any_budget_periods",
            "label": "Manage All BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "manage_own_budget_periods",
            "label": "Manage Own BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "create_budget_periods",
            "label": "Create BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "edit_budget_periods",
            "label": "Edit BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "delete_budget_periods",
            "label": "Delete BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "approve_budget_periods",
            "label": "Approve BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "active_budget_periods",
            "label": "Active BudgetPeriods",
            "module": "budget-periods"
          },
          {
            "value": "close_budget_periods",
            "label": "Close BudgetPeriods",
            "module": "budget-periods"
          }
        ]
      },
      {
        "module": "budgets",
        "moduleLabel": "Budgets",
        "permissions": [
          {
            "value": "manage_budgets",
            "label": "Manage Budgets",
            "module": "budgets"
          },
          {
            "value": "manage_any_budgets",
            "label": "Manage All Budgets",
            "module": "budgets"
          },
          {
            "value": "manage_own_budgets",
            "label": "Manage Own Budgets",
            "module": "budgets"
          },
          {
            "value": "create_budgets",
            "label": "Create Budgets",
            "module": "budgets"
          },
          {
            "value": "edit_budgets",
            "label": "Edit Budgets",
            "module": "budgets"
          },
          {
            "value": "delete_budgets",
            "label": "Delete Budgets",
            "module": "budgets"
          },
          {
            "value": "approve_budgets",
            "label": "Approve Budgets",
            "module": "budgets"
          },
          {
            "value": "active_budgets",
            "label": "Active Budgets",
            "module": "budgets"
          },
          {
            "value": "close_budgets",
            "label": "Close Budgets",
            "module": "budgets"
          }
        ]
      },
      {
        "module": "budget-allocations",
        "moduleLabel": "Budget Allocations",
        "permissions": [
          {
            "value": "manage_budget_allocations",
            "label": "Manage Budget Allocations",
            "module": "budget-allocations"
          },
          {
            "value": "manage_any_budget_allocations",
            "label": "Manage All Budget Allocations",
            "module": "budget-allocations"
          },
          {
            "value": "manage_own_budget_allocations",
            "label": "Manage Own Budget Allocations",
            "module": "budget-allocations"
          },
          {
            "value": "create_budget_allocations",
            "label": "Create Budget Allocations",
            "module": "budget-allocations"
          },
          {
            "value": "edit_budget_allocations",
            "label": "Edit Budget Allocations",
            "module": "budget-allocations"
          },
          {
            "value": "delete_budget_allocations",
            "label": "Delete Budget Allocations",
            "module": "budget-allocations"
          }
        ]
      },
      {
        "module": "budget-monitoring",
        "moduleLabel": "Budget Monitoring",
        "permissions": [
          {
            "value": "manage_budget_monitoring",
            "label": "Manage Budget Monitoring",
            "module": "budget-monitoring"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Training",
    "label": "Training",
    "packageName": "Training",
    "modules": [
      {
        "module": "training",
        "moduleLabel": "Training",
        "permissions": [
          {
            "value": "manage_training",
            "label": "Manage Training",
            "module": "training"
          },
          {
            "value": "manage_training_types",
            "label": "Manage Training Types",
            "module": "training"
          },
          {
            "value": "manage_any_training_types",
            "label": "Manage All Training Types",
            "module": "training"
          },
          {
            "value": "manage_own_training_types",
            "label": "Manage Own Training Types",
            "module": "training"
          },
          {
            "value": "create_training_types",
            "label": "Create Training Types",
            "module": "training"
          },
          {
            "value": "edit_training_types",
            "label": "Edit Training Types",
            "module": "training"
          },
          {
            "value": "delete_training_types",
            "label": "Delete Training Types",
            "module": "training"
          },
          {
            "value": "manage_trainers",
            "label": "Manage Trainers",
            "module": "training"
          },
          {
            "value": "manage_any_trainers",
            "label": "Manage All Trainers",
            "module": "training"
          },
          {
            "value": "manage_own_trainers",
            "label": "Manage Own Trainers",
            "module": "training"
          },
          {
            "value": "create_trainers",
            "label": "Create Trainers",
            "module": "training"
          },
          {
            "value": "edit_trainers",
            "label": "Edit Trainers",
            "module": "training"
          },
          {
            "value": "delete_trainers",
            "label": "Delete Trainers",
            "module": "training"
          },
          {
            "value": "manage_trainings",
            "label": "Manage Trainings",
            "module": "training"
          },
          {
            "value": "manage_any_trainings",
            "label": "Manage All Trainings",
            "module": "training"
          },
          {
            "value": "manage_own_trainings",
            "label": "Manage Own Trainings",
            "module": "training"
          },
          {
            "value": "create_trainings",
            "label": "Create Trainings",
            "module": "training"
          },
          {
            "value": "edit_trainings",
            "label": "Edit Trainings",
            "module": "training"
          },
          {
            "value": "delete_trainings",
            "label": "Delete Trainings",
            "module": "training"
          },
          {
            "value": "manage_training_tasks",
            "label": "Manage Training Tasks",
            "module": "training"
          },
          {
            "value": "manage_any_training_tasks",
            "label": "Manage All Training Tasks",
            "module": "training"
          },
          {
            "value": "manage_own_training_tasks",
            "label": "Manage Own Training Tasks",
            "module": "training"
          },
          {
            "value": "create_training_tasks",
            "label": "Create Training Tasks",
            "module": "training"
          },
          {
            "value": "edit_training_tasks",
            "label": "Edit Training Tasks",
            "module": "training"
          },
          {
            "value": "delete_training_tasks",
            "label": "Delete Training Tasks",
            "module": "training"
          },
          {
            "value": "manage_training_feedbacks",
            "label": "Manage Training Feedbacks",
            "module": "training"
          },
          {
            "value": "manage_any_training_feedbacks",
            "label": "Manage All Training Feedbacks",
            "module": "training"
          },
          {
            "value": "manage_own_training_feedbacks",
            "label": "Manage Own Training Feedbacks",
            "module": "training"
          },
          {
            "value": "create_training_feedbacks",
            "label": "Create Training Feedbacks",
            "module": "training"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Performance",
    "label": "Performance",
    "packageName": "Performance",
    "modules": [
      {
        "module": "performance",
        "moduleLabel": "Performance",
        "permissions": [
          {
            "value": "manage_performance",
            "label": "Manage Performance",
            "module": "performance"
          },
          {
            "value": "manage_performance_system_setup",
            "label": "Manage System Setup",
            "module": "performance"
          }
        ]
      },
      {
        "module": "performance-indicator-category",
        "moduleLabel": "Performance Indicator Category",
        "permissions": [
          {
            "value": "manage_performance_indicator_categories",
            "label": "Manage Performance Indicator Categories",
            "module": "performance-indicator-category"
          },
          {
            "value": "manage_any_performance_indicator_categories",
            "label": "Manage All Performance Indicator Categories",
            "module": "performance-indicator-category"
          },
          {
            "value": "manage_own_performance_indicator_categories",
            "label": "Manage Own Performance Indicator Categories",
            "module": "performance-indicator-category"
          },
          {
            "value": "create_performance_indicator_categories",
            "label": "Create Performance Indicator Categories",
            "module": "performance-indicator-category"
          },
          {
            "value": "edit_performance_indicator_categories",
            "label": "Edit Performance Indicator Categories",
            "module": "performance-indicator-category"
          },
          {
            "value": "delete_performance_indicator_categories",
            "label": "Delete Performance Indicator Categories",
            "module": "performance-indicator-category"
          }
        ]
      },
      {
        "module": "performance-indicator",
        "moduleLabel": "Performance Indicator",
        "permissions": [
          {
            "value": "manage_performance_indicators",
            "label": "Manage Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "manage_any_performance_indicators",
            "label": "Manage All Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "manage_own_performance_indicators",
            "label": "Manage Own Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "view_performance_indicators",
            "label": "View Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "create_performance_indicators",
            "label": "Create Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "edit_performance_indicators",
            "label": "Edit Performance Indicators",
            "module": "performance-indicator"
          },
          {
            "value": "delete_performance_indicators",
            "label": "Delete Performance Indicators",
            "module": "performance-indicator"
          }
        ]
      },
      {
        "module": "goal-type",
        "moduleLabel": "Goal Type",
        "permissions": [
          {
            "value": "manage_goal_types",
            "label": "Manage Goal Types",
            "module": "goal-type"
          },
          {
            "value": "manage_any_goal_types",
            "label": "Manage All Goal Types",
            "module": "goal-type"
          },
          {
            "value": "manage_own_goal_types",
            "label": "Manage Own Goal Types",
            "module": "goal-type"
          },
          {
            "value": "create_goal_types",
            "label": "Create Goal Types",
            "module": "goal-type"
          },
          {
            "value": "edit_goal_types",
            "label": "Edit Goal Types",
            "module": "goal-type"
          },
          {
            "value": "delete_goal_types",
            "label": "Delete Goal Types",
            "module": "goal-type"
          }
        ]
      },
      {
        "module": "employee-goal",
        "moduleLabel": "Employee Goal",
        "permissions": [
          {
            "value": "manage_employee_goals",
            "label": "Manage Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "manage_any_employee_goals",
            "label": "Manage All Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "manage_own_employee_goals",
            "label": "Manage Own Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "view_employee_goals",
            "label": "View Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "create_employee_goals",
            "label": "Create Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "edit_employee_goals",
            "label": "Edit Employee Goals",
            "module": "employee-goal"
          },
          {
            "value": "delete_employee_goals",
            "label": "Delete Employee Goals",
            "module": "employee-goal"
          }
        ]
      },
      {
        "module": "review-cycle",
        "moduleLabel": "Review Cycle",
        "permissions": [
          {
            "value": "manage_review_cycles",
            "label": "Manage Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "manage_any_review_cycles",
            "label": "Manage All Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "manage_own_review_cycles",
            "label": "Manage Own Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "view_review_cycles",
            "label": "View Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "create_review_cycles",
            "label": "Create Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "edit_review_cycles",
            "label": "Edit Review Cycles",
            "module": "review-cycle"
          },
          {
            "value": "delete_review_cycles",
            "label": "Delete Review Cycles",
            "module": "review-cycle"
          }
        ]
      },
      {
        "module": "employee-review",
        "moduleLabel": "Employee Review",
        "permissions": [
          {
            "value": "manage_employee_reviews",
            "label": "Manage Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "manage_any_employee_reviews",
            "label": "Manage All Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "manage_own_employee_reviews",
            "label": "Manage Own Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "view_employee_reviews",
            "label": "View Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "create_employee_reviews",
            "label": "Create Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "edit_employee_reviews",
            "label": "Edit Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "delete_employee_reviews",
            "label": "Delete Employee Reviews",
            "module": "employee-review"
          },
          {
            "value": "conduct_employee_reviews",
            "label": "Conduct Employee Reviews",
            "module": "employee-review"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Recruitment",
    "label": "Recruitment",
    "packageName": "Recruitment",
    "modules": [
      {
        "module": "recruitment",
        "moduleLabel": "Recruitment",
        "permissions": [
          {
            "value": "manage_recruitment",
            "label": "Manage Recruitment",
            "module": "recruitment"
          },
          {
            "value": "manage_recruitment_dashboard",
            "label": "Manage Recruitment Dashboard",
            "module": "recruitment"
          },
          {
            "value": "manage_recruitment_system_setup",
            "label": "Manage System Setup",
            "module": "recruitment"
          }
        ]
      },
      {
        "module": "job-locations",
        "moduleLabel": "Job Locations",
        "permissions": [
          {
            "value": "manage_job_locations",
            "label": "Manage Job Locations",
            "module": "job-locations"
          },
          {
            "value": "manage_any_job_locations",
            "label": "Manage All Job Locations",
            "module": "job-locations"
          },
          {
            "value": "manage_own_job_locations",
            "label": "Manage Own Job Locations",
            "module": "job-locations"
          },
          {
            "value": "view_job_locations",
            "label": "View Job Locations",
            "module": "job-locations"
          },
          {
            "value": "create_job_locations",
            "label": "Create Job Locations",
            "module": "job-locations"
          },
          {
            "value": "edit_job_locations",
            "label": "Edit Job Locations",
            "module": "job-locations"
          },
          {
            "value": "delete_job_locations",
            "label": "Delete Job Locations",
            "module": "job-locations"
          }
        ]
      },
      {
        "module": "custom-questions",
        "moduleLabel": "Custom Questions",
        "permissions": [
          {
            "value": "manage_custom_questions",
            "label": "Manage Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "manage_any_custom_questions",
            "label": "Manage All Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "manage_own_custom_questions",
            "label": "Manage Own Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "view_custom_questions",
            "label": "View Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "create_custom_questions",
            "label": "Create Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "edit_custom_questions",
            "label": "Edit Custom Questions",
            "module": "custom-questions"
          },
          {
            "value": "delete_custom_questions",
            "label": "Delete Custom Questions",
            "module": "custom-questions"
          }
        ]
      },
      {
        "module": "job-postings",
        "moduleLabel": "Job Postings",
        "permissions": [
          {
            "value": "manage_job_postings",
            "label": "Manage Job Postings",
            "module": "job-postings"
          },
          {
            "value": "manage_any_job_postings",
            "label": "Manage All Job Postings",
            "module": "job-postings"
          },
          {
            "value": "manage_own_job_postings",
            "label": "Manage Own Job Postings",
            "module": "job-postings"
          },
          {
            "value": "publish_job_postings",
            "label": "Publish Job Postings",
            "module": "job-postings"
          },
          {
            "value": "view_job_postings",
            "label": "View Job Postings",
            "module": "job-postings"
          },
          {
            "value": "create_job_postings",
            "label": "Create Job Postings",
            "module": "job-postings"
          },
          {
            "value": "edit_job_postings",
            "label": "Edit Job Postings",
            "module": "job-postings"
          },
          {
            "value": "delete_job_postings",
            "label": "Delete Job Postings",
            "module": "job-postings"
          }
        ]
      },
      {
        "module": "candidates",
        "moduleLabel": "Candidates",
        "permissions": [
          {
            "value": "manage_candidates",
            "label": "Manage Candidates",
            "module": "candidates"
          },
          {
            "value": "manage_any_candidates",
            "label": "Manage All Candidates",
            "module": "candidates"
          },
          {
            "value": "manage_own_candidates",
            "label": "Manage Own Candidates",
            "module": "candidates"
          },
          {
            "value": "view_candidates",
            "label": "View Candidates",
            "module": "candidates"
          },
          {
            "value": "create_candidates",
            "label": "Create Candidates",
            "module": "candidates"
          },
          {
            "value": "edit_candidates",
            "label": "Edit Candidates",
            "module": "candidates"
          },
          {
            "value": "delete_candidates",
            "label": "Delete Candidates",
            "module": "candidates"
          }
        ]
      },
      {
        "module": "interview-rounds",
        "moduleLabel": "Interview Rounds",
        "permissions": [
          {
            "value": "manage_interview_rounds",
            "label": "Manage Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "manage_any_interview_rounds",
            "label": "Manage All Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "manage_own_interview_rounds",
            "label": "Manage Own Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "view_interview_rounds",
            "label": "View Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "create_interview_rounds",
            "label": "Create Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "edit_interview_rounds",
            "label": "Edit Interview Rounds",
            "module": "interview-rounds"
          },
          {
            "value": "delete_interview_rounds",
            "label": "Delete Interview Rounds",
            "module": "interview-rounds"
          }
        ]
      },
      {
        "module": "interviews",
        "moduleLabel": "Interviews",
        "permissions": [
          {
            "value": "manage_interviews",
            "label": "Manage Interviews",
            "module": "interviews"
          },
          {
            "value": "manage_any_interviews",
            "label": "Manage All Interviews",
            "module": "interviews"
          },
          {
            "value": "manage_own_interviews",
            "label": "Manage Own Interviews",
            "module": "interviews"
          },
          {
            "value": "view_interviews",
            "label": "View Interviews",
            "module": "interviews"
          },
          {
            "value": "create_interviews",
            "label": "Create Interviews",
            "module": "interviews"
          },
          {
            "value": "edit_interviews",
            "label": "Edit Interviews",
            "module": "interviews"
          },
          {
            "value": "delete_interviews",
            "label": "Delete Interviews",
            "module": "interviews"
          }
        ]
      },
      {
        "module": "interview-feedbacks",
        "moduleLabel": "Interview Feedbacks",
        "permissions": [
          {
            "value": "manage_interview_feedbacks",
            "label": "Manage Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "manage_any_interview_feedbacks",
            "label": "Manage All Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "manage_own_interview_feedbacks",
            "label": "Manage Own Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "view_interview_feedbacks",
            "label": "View Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "create_interview_feedbacks",
            "label": "Create Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "edit_interview_feedbacks",
            "label": "Edit Interview Feedbacks",
            "module": "interview-feedbacks"
          },
          {
            "value": "delete_interview_feedbacks",
            "label": "Delete Interview Feedbacks",
            "module": "interview-feedbacks"
          }
        ]
      },
      {
        "module": "candidate-assessments",
        "moduleLabel": "Candidate Assessments",
        "permissions": [
          {
            "value": "manage_candidate_assessments",
            "label": "Manage Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "manage_any_candidate_assessments",
            "label": "Manage All Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "manage_own_candidate_assessments",
            "label": "Manage Own Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "view_candidate_assessments",
            "label": "View Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "create_candidate_assessments",
            "label": "Create Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "edit_candidate_assessments",
            "label": "Edit Candidate Assessments",
            "module": "candidate-assessments"
          },
          {
            "value": "delete_candidate_assessments",
            "label": "Delete Candidate Assessments",
            "module": "candidate-assessments"
          }
        ]
      },
      {
        "module": "offers",
        "moduleLabel": "Offers",
        "permissions": [
          {
            "value": "manage_offers",
            "label": "Manage Offers",
            "module": "offers"
          },
          {
            "value": "manage_any_offers",
            "label": "Manage All Offers",
            "module": "offers"
          },
          {
            "value": "manage_own_offers",
            "label": "Manage Own Offers",
            "module": "offers"
          },
          {
            "value": "view_offers",
            "label": "View Offers",
            "module": "offers"
          },
          {
            "value": "create_offers",
            "label": "Create Offers",
            "module": "offers"
          },
          {
            "value": "edit_offers",
            "label": "Edit Offers",
            "module": "offers"
          },
          {
            "value": "approve_offers",
            "label": "Approve Offers",
            "module": "offers"
          },
          {
            "value": "send_offer_emails",
            "label": "Send Offer Emails",
            "module": "offers"
          },
          {
            "value": "download_offer_letters",
            "label": "Download Offer Letters",
            "module": "offers"
          },
          {
            "value": "convert_offers_to_employees",
            "label": "Convert Offers to Employees",
            "module": "offers"
          },
          {
            "value": "view_offer_employees",
            "label": "View Offer Employee Details",
            "module": "offers"
          },
          {
            "value": "delete_offers",
            "label": "Delete Offers",
            "module": "offers"
          }
        ]
      },
      {
        "module": "checklist-items",
        "moduleLabel": "Checklist Items",
        "permissions": [
          {
            "value": "manage_checklist_items",
            "label": "Manage Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "manage_any_checklist_items",
            "label": "Manage All Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "manage_own_checklist_items",
            "label": "Manage Own Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "view_checklist_items",
            "label": "View Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "create_checklist_items",
            "label": "Create Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "edit_checklist_items",
            "label": "Edit Checklist Items",
            "module": "checklist-items"
          },
          {
            "value": "delete_checklist_items",
            "label": "Delete Checklist Items",
            "module": "checklist-items"
          }
        ]
      },
      {
        "module": "candidate-onboardings",
        "moduleLabel": "Candidate Onboardings",
        "permissions": [
          {
            "value": "manage_candidate_onboardings",
            "label": "Manage Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "manage_any_candidate_onboardings",
            "label": "Manage All Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "manage_own_candidate_onboardings",
            "label": "Manage Own Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "view_candidate_onboardings",
            "label": "View Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "create_candidate_onboardings",
            "label": "Create Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "edit_candidate_onboardings",
            "label": "Edit Candidate Onboardings",
            "module": "candidate-onboardings"
          },
          {
            "value": "delete_candidate_onboardings",
            "label": "Delete Candidate Onboardings",
            "module": "candidate-onboardings"
          }
        ]
      },
      {
        "module": "job-types",
        "moduleLabel": "Job Types",
        "permissions": [
          {
            "value": "manage_job_types",
            "label": "Manage Job Types",
            "module": "job-types"
          },
          {
            "value": "manage_any_job_types",
            "label": "Manage All Job Types",
            "module": "job-types"
          },
          {
            "value": "manage_own_job_types",
            "label": "Manage Own Job Types",
            "module": "job-types"
          },
          {
            "value": "create_job_types",
            "label": "Create Job Types",
            "module": "job-types"
          },
          {
            "value": "edit_job_types",
            "label": "Edit Job Types",
            "module": "job-types"
          },
          {
            "value": "delete_job_types",
            "label": "Delete Job Types",
            "module": "job-types"
          }
        ]
      },
      {
        "module": "candidate-sources",
        "moduleLabel": "Candidate Sources",
        "permissions": [
          {
            "value": "manage_candidate_sources",
            "label": "Manage Candidate Sources",
            "module": "candidate-sources"
          },
          {
            "value": "manage_any_candidate_sources",
            "label": "Manage All Candidate Sources",
            "module": "candidate-sources"
          },
          {
            "value": "manage_own_candidate_sources",
            "label": "Manage Own Candidate Sources",
            "module": "candidate-sources"
          },
          {
            "value": "create_candidate_sources",
            "label": "Create Candidate Sources",
            "module": "candidate-sources"
          },
          {
            "value": "edit_candidate_sources",
            "label": "Edit Candidate Sources",
            "module": "candidate-sources"
          },
          {
            "value": "delete_candidate_sources",
            "label": "Delete Candidate Sources",
            "module": "candidate-sources"
          }
        ]
      },
      {
        "module": "interview-types",
        "moduleLabel": "Interview Types",
        "permissions": [
          {
            "value": "manage_interview_types",
            "label": "Manage Interview Types",
            "module": "interview-types"
          },
          {
            "value": "manage_any_interview_types",
            "label": "Manage All Interview Types",
            "module": "interview-types"
          },
          {
            "value": "manage_own_interview_types",
            "label": "Manage Own Interview Types",
            "module": "interview-types"
          },
          {
            "value": "create_interview_types",
            "label": "Create Interview Types",
            "module": "interview-types"
          },
          {
            "value": "edit_interview_types",
            "label": "Edit Interview Types",
            "module": "interview-types"
          },
          {
            "value": "delete_interview_types",
            "label": "Delete Interview Types",
            "module": "interview-types"
          }
        ]
      },
      {
        "module": "onboarding-checklists",
        "moduleLabel": "Onboarding Checklists",
        "permissions": [
          {
            "value": "manage_onboarding_checklists",
            "label": "Manage Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "manage_any_onboarding_checklists",
            "label": "Manage All Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "manage_own_onboarding_checklists",
            "label": "Manage Own Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "view_onboarding_checklists",
            "label": "View Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "create_onboarding_checklists",
            "label": "Create Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "edit_onboarding_checklists",
            "label": "Edit Onboarding Checklists",
            "module": "onboarding-checklists"
          },
          {
            "value": "delete_onboarding_checklists",
            "label": "Delete Onboarding Checklists",
            "module": "onboarding-checklists"
          }
        ]
      },
      {
        "module": "setting",
        "moduleLabel": "Setting",
        "permissions": [
          {
            "value": "manage_recruitment_brand_settings",
            "label": "Manage Brand Settings",
            "module": "setting"
          },
          {
            "value": "manage_about_company",
            "label": "Manage About Company",
            "module": "setting"
          },
          {
            "value": "manage_application_tips",
            "label": "Manage Application Tips",
            "module": "setting"
          },
          {
            "value": "manage_what_happens_next",
            "label": "Manage What Happens Next Section",
            "module": "setting"
          },
          {
            "value": "manage_need_help",
            "label": "Manage Need Help Section",
            "module": "setting"
          },
          {
            "value": "manage_tracking_faq",
            "label": "Manage Tracking FAQ",
            "module": "setting"
          },
          {
            "value": "manage_offer_letter_template",
            "label": "Manage Offer Letter Template",
            "module": "setting"
          },
          {
            "value": "manage_recruitment_dashboard_welcome_card",
            "label": "Manage Dashboard Welcome Card",
            "module": "setting"
          }
        ]
      }
    ]
  },
  {
    "addOn": "FormBuilder",
    "label": "Form Builder",
    "packageName": "FormBuilder",
    "modules": [
      {
        "module": "form",
        "moduleLabel": "Form",
        "permissions": [
          {
            "value": "manage_formbuilder",
            "label": "Manage FormBuilder",
            "module": "form"
          },
          {
            "value": "manage_any_formbuilder_form",
            "label": "Manage All Form",
            "module": "form"
          },
          {
            "value": "manage_own_formbuilder_form",
            "label": "Manage Own Form",
            "module": "form"
          },
          {
            "value": "create_formbuilder_form",
            "label": "Create Form",
            "module": "form"
          },
          {
            "value": "edit_formbuilder_form",
            "label": "Edit Form",
            "module": "form"
          },
          {
            "value": "edit_formbuilder_form_fields",
            "label": "Edit Form Fields",
            "module": "form"
          },
          {
            "value": "delete_formbuilder_form_fields",
            "label": "Delete Form Fields",
            "module": "form"
          },
          {
            "value": "delete_formbuilder_form",
            "label": "Delete Form",
            "module": "form"
          }
        ]
      },
      {
        "module": "form-responses",
        "moduleLabel": "Form Responses",
        "permissions": [
          {
            "value": "view_formbuilder_responses",
            "label": "View Form Responses",
            "module": "form-responses"
          },
          {
            "value": "delete_formbuilder_responses",
            "label": "Delete Form Responses",
            "module": "form-responses"
          }
        ]
      },
      {
        "module": "form-conversions",
        "moduleLabel": "Form Conversions",
        "permissions": [
          {
            "value": "manage_formbuilder_conversions",
            "label": "Manage Form Conversions",
            "module": "form-conversions"
          },
          {
            "value": "edit_formbuilder_conversions",
            "label": "Edit Form Conversions",
            "module": "form-conversions"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Contract",
    "label": "Contract",
    "packageName": "Contract",
    "modules": [
      {
        "module": "contracts",
        "moduleLabel": "Contracts",
        "permissions": [
          {
            "value": "manage_contracts",
            "label": "Manage Contracts",
            "module": "contracts"
          },
          {
            "value": "manage_any_contracts",
            "label": "Manage All Contracts",
            "module": "contracts"
          },
          {
            "value": "manage_own_contracts",
            "label": "Manage Own Contracts",
            "module": "contracts"
          },
          {
            "value": "view_contracts",
            "label": "View Contracts",
            "module": "contracts"
          },
          {
            "value": "create_contracts",
            "label": "Create Contracts",
            "module": "contracts"
          },
          {
            "value": "edit_contracts",
            "label": "Edit Contracts",
            "module": "contracts"
          },
          {
            "value": "delete_contracts",
            "label": "Delete Contracts",
            "module": "contracts"
          },
          {
            "value": "duplicate_contracts",
            "label": "Duplicate Contracts",
            "module": "contracts"
          },
          {
            "value": "preview_contracts",
            "label": "Preview Contracts",
            "module": "contracts"
          },
          {
            "value": "signatures_contracts",
            "label": "Sign Contracts",
            "module": "contracts"
          }
        ]
      },
      {
        "module": "contract-types",
        "moduleLabel": "Contract Types",
        "permissions": [
          {
            "value": "manage_contract_types",
            "label": "Manage Contract Types",
            "module": "contract-types"
          },
          {
            "value": "manage_any_contract_types",
            "label": "Manage All Contract Types",
            "module": "contract-types"
          },
          {
            "value": "manage_own_contract_types",
            "label": "Manage Own Contract Types",
            "module": "contract-types"
          },
          {
            "value": "create_contract_types",
            "label": "Create Contract Types",
            "module": "contract-types"
          },
          {
            "value": "edit_contract_types",
            "label": "Edit Contract Types",
            "module": "contract-types"
          },
          {
            "value": "delete_contract_types",
            "label": "Delete Contract Types",
            "module": "contract-types"
          }
        ]
      },
      {
        "module": "contract-attachments",
        "moduleLabel": "Contract Attachments",
        "permissions": [
          {
            "value": "manage_any_contract_attachments",
            "label": "Manage All Contract Attachments",
            "module": "contract-attachments"
          },
          {
            "value": "manage_own_contract_attachments",
            "label": "Manage Own Contract Attachments",
            "module": "contract-attachments"
          },
          {
            "value": "create_contract_attachments",
            "label": "Create Contract Attachments",
            "module": "contract-attachments"
          },
          {
            "value": "delete_contract_attachments",
            "label": "Delete Contract Attachments",
            "module": "contract-attachments"
          }
        ]
      },
      {
        "module": "contract-comments",
        "moduleLabel": "Contract Comments",
        "permissions": [
          {
            "value": "manage_any_contract_comments",
            "label": "Manage All Contract Comments",
            "module": "contract-comments"
          },
          {
            "value": "manage_own_contract_comments",
            "label": "Manage Own Contract Comments",
            "module": "contract-comments"
          },
          {
            "value": "create_contract_comments",
            "label": "Create Contract Comments",
            "module": "contract-comments"
          },
          {
            "value": "edit_contract_comments",
            "label": "Edit Contract Comments",
            "module": "contract-comments"
          },
          {
            "value": "delete_contract_comments",
            "label": "Delete Contract Comments",
            "module": "contract-comments"
          }
        ]
      },
      {
        "module": "contract-notes",
        "moduleLabel": "Contract Notes",
        "permissions": [
          {
            "value": "manage_any_contract_notes",
            "label": "Manage All Contract Notes",
            "module": "contract-notes"
          },
          {
            "value": "manage_own_contract_notes",
            "label": "Manage Own Contract Notes",
            "module": "contract-notes"
          },
          {
            "value": "create_contract_notes",
            "label": "Create Contract Notes",
            "module": "contract-notes"
          },
          {
            "value": "edit_contract_notes",
            "label": "Edit Contract Notes",
            "module": "contract-notes"
          },
          {
            "value": "delete_contract_notes",
            "label": "Delete Contract Notes",
            "module": "contract-notes"
          }
        ]
      },
      {
        "module": "contract-renewals",
        "moduleLabel": "Contract Renewals",
        "permissions": [
          {
            "value": "manage_any_contract_renewals",
            "label": "Manage All Contract Renewals",
            "module": "contract-renewals"
          },
          {
            "value": "manage_own_contract_renewals",
            "label": "Manage Own Contract Renewals",
            "module": "contract-renewals"
          },
          {
            "value": "create_contract_renewals",
            "label": "Create Contract Renewals",
            "module": "contract-renewals"
          },
          {
            "value": "edit_contract_renewals",
            "label": "Edit Contract Renewals",
            "module": "contract-renewals"
          },
          {
            "value": "delete_contract_renewals",
            "label": "Delete Contract Renewals",
            "module": "contract-renewals"
          }
        ]
      },
      {
        "module": "settings",
        "moduleLabel": "Settings",
        "permissions": [
          {
            "value": "manage_contract_settings",
            "label": "Manage Contract Settings",
            "module": "settings"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Timesheet",
    "label": "Timesheet",
    "packageName": "Timesheet",
    "modules": [
      {
        "module": "timesheet",
        "moduleLabel": "Timesheet",
        "permissions": [
          {
            "value": "manage_timesheet",
            "label": "Manage Timesheet",
            "module": "timesheet"
          },
          {
            "value": "manage_any_timesheet",
            "label": "Manage All Timesheet",
            "module": "timesheet"
          },
          {
            "value": "manage_own_timesheet",
            "label": "Manage Own Timesheet",
            "module": "timesheet"
          },
          {
            "value": "create_timesheet",
            "label": "Create Timesheet",
            "module": "timesheet"
          },
          {
            "value": "edit_timesheet",
            "label": "Edit Timesheet",
            "module": "timesheet"
          },
          {
            "value": "delete_timesheet",
            "label": "Delete Timesheet",
            "module": "timesheet"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Quotation",
    "label": "Quotation",
    "packageName": "Quotation",
    "modules": [
      {
        "module": "quotation",
        "moduleLabel": "Quotation",
        "permissions": [
          {
            "value": "manage_quotations",
            "label": "Manage Quotation",
            "module": "quotation"
          },
          {
            "value": "manage_any_quotations",
            "label": "Manage All Quotation",
            "module": "quotation"
          },
          {
            "value": "manage_own_quotations",
            "label": "Manage Own Quotation",
            "module": "quotation"
          },
          {
            "value": "view_quotations",
            "label": "View Quotation",
            "module": "quotation"
          },
          {
            "value": "create_quotations",
            "label": "Create Quotation",
            "module": "quotation"
          },
          {
            "value": "edit_quotations",
            "label": "Edit Quotation",
            "module": "quotation"
          },
          {
            "value": "delete_quotations",
            "label": "Delete Quotation",
            "module": "quotation"
          },
          {
            "value": "print_quotations",
            "label": "Print Quotation",
            "module": "quotation"
          },
          {
            "value": "sent_quotations",
            "label": "Sent Quotation",
            "module": "quotation"
          },
          {
            "value": "approve_quotations",
            "label": "Approve Quotation",
            "module": "quotation"
          },
          {
            "value": "reject_quotations",
            "label": "Reject Quotation",
            "module": "quotation"
          },
          {
            "value": "convert_to_invoice_quotations",
            "label": "Convert to Invoice Quotation",
            "module": "quotation"
          },
          {
            "value": "create_quotations_revision",
            "label": "Create Quotation Revision",
            "module": "quotation"
          },
          {
            "value": "duplicate_quotations",
            "label": "Duplicate Quotation",
            "module": "quotation"
          }
        ]
      }
    ]
  },
  {
    "addOn": "AIAssistant",
    "label": "AI Assistant",
    "packageName": "AIAssistant",
    "modules": [
      {
        "module": "aiassistant",
        "moduleLabel": "Aiassistant",
        "permissions": [
          {
            "value": "manage_ai_assistant_settings",
            "label": "Manage AI Assistant Settings",
            "module": "aiassistant"
          },
          {
            "value": "edit_ai_assistant_settings",
            "label": "Edit AI Assistant Settings",
            "module": "aiassistant"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Slack",
    "label": "Slack",
    "packageName": "Slack",
    "modules": [
      {
        "module": "slack",
        "moduleLabel": "Slack",
        "permissions": [
          {
            "value": "manage_slack_settings",
            "label": "Manage Slack Settings",
            "module": "slack"
          },
          {
            "value": "edit_slack_settings",
            "label": "Edit Slack Settings",
            "module": "slack"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Telegram",
    "label": "Telegram",
    "packageName": "Telegram",
    "modules": [
      {
        "module": "telegram",
        "moduleLabel": "Telegram",
        "permissions": [
          {
            "value": "manage_telegram_settings",
            "label": "Manage Telegram Settings",
            "module": "telegram"
          },
          {
            "value": "edit_telegram_settings",
            "label": "Edit Telegram Settings",
            "module": "telegram"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Twilio",
    "label": "Twilio",
    "packageName": "Twilio",
    "modules": [
      {
        "module": "twilio",
        "moduleLabel": "Twilio",
        "permissions": [
          {
            "value": "manage_twilio_settings",
            "label": "Manage Twilio Settings",
            "module": "twilio"
          },
          {
            "value": "edit_twilio_settings",
            "label": "Edit Twilio Settings",
            "module": "twilio"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Calendar",
    "label": "Calendar",
    "packageName": "Calendar",
    "modules": [
      {
        "module": "calendar",
        "moduleLabel": "Calendar",
        "permissions": [
          {
            "value": "manage_calendar",
            "label": "Manage Calendar",
            "module": "calendar"
          },
          {
            "value": "view_calendar",
            "label": "View Calendar",
            "module": "calendar"
          }
        ]
      },
      {
        "module": "google-calendar-settings",
        "moduleLabel": "Google Calendar Settings",
        "permissions": [
          {
            "value": "manage_google_calendar_settings",
            "label": "Manage Google Calendar Settings",
            "module": "google-calendar-settings"
          },
          {
            "value": "edit_google_calendar_settings",
            "label": "Edit Google Calendar Settings",
            "module": "google-calendar-settings"
          }
        ]
      }
    ]
  },
  {
    "addOn": "GoogleCaptcha",
    "label": "Google Captcha",
    "packageName": "GoogleCaptcha",
    "modules": [
      {
        "module": "google-captcha",
        "moduleLabel": "Google Captcha",
        "permissions": [
          {
            "value": "manage_google_captcha_settings",
            "label": "Manage Google Captcha Settings",
            "module": "google-captcha"
          },
          {
            "value": "edit_google_captcha_settings",
            "label": "Edit Google Captcha Settings",
            "module": "google-captcha"
          }
        ]
      }
    ]
  },
  {
    "addOn": "ZoomMeeting",
    "label": "Zoom Meeting",
    "packageName": "ZoomMeeting",
    "modules": [
      {
        "module": "zoom meeting settings",
        "moduleLabel": "Zoom meeting settings",
        "permissions": [
          {
            "value": "manage_zoom_meeting_settings",
            "label": "Manage Zoom Meeting Settings",
            "module": "zoom meeting settings"
          },
          {
            "value": "edit_zoom_meeting_settings",
            "label": "Edit Zoom Meeting Settings",
            "module": "zoom meeting settings"
          }
        ]
      },
      {
        "module": "zoom-meetings",
        "moduleLabel": "Zoom Meetings",
        "permissions": [
          {
            "value": "manage_zoom_meetings",
            "label": "Manage Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "manage_any_zoom_meetings",
            "label": "Manage All Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "manage_own_zoom_meetings",
            "label": "Manage Own Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "view_zoom_meetings",
            "label": "View Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "create_zoom_meetings",
            "label": "Create Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "edit_zoom_meetings",
            "label": "Edit Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "delete_zoom_meetings",
            "label": "Delete Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "join_zoom_meetings",
            "label": "Join Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "start_zoom_meetings",
            "label": "Start Zoom Meetings",
            "module": "zoom-meetings"
          },
          {
            "value": "update_zoom_meeting_status",
            "label": "Update Zoom Meeting Status",
            "module": "zoom-meetings"
          }
        ]
      }
    ]
  },
  {
    "addOn": "Webhook",
    "label": "Webhook",
    "packageName": "Webhook",
    "modules": [
      {
        "module": "webhook",
        "moduleLabel": "Webhook",
        "permissions": [
          {
            "value": "manage_webhooks",
            "label": "Manage Webhooks",
            "module": "webhook"
          },
          {
            "value": "create_webhooks",
            "label": "Create Webhooks",
            "module": "webhook"
          },
          {
            "value": "edit_webhooks",
            "label": "Edit Webhooks",
            "module": "webhook"
          },
          {
            "value": "delete_webhooks",
            "label": "Delete Webhooks",
            "module": "webhook"
          }
        ]
      }
    ]
  // },
  // {
  //   "addOn": "Stripe",
  //   "label": "Stripe",
  //   "packageName": "Stripe",
  //   "modules": [
  //     {
  //       "module": "stripe",
  //       "moduleLabel": "Stripe",
  //       "permissions": [
  //         {
  //           "value": "edit_stripe_settings",
  //           "label": "Edit Stripe Settings",
  //           "module": "stripe"
  //         },
  //         {
  //           "value": "manage_stripe_settings",
  //           "label": "Manage Stripe Settings",
  //           "module": "stripe"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Paypal",
  //   "label": "Paypal",
  //   "packageName": "Paypal",
  //   "modules": [
  //     {
  //       "module": "paypal",
  //       "moduleLabel": "Paypal",
  //       "permissions": [
  //         {
  //           "value": "edit_paypal_settings",
  //           "label": "Edit PayPal Settings",
  //           "module": "paypal"
  //         },
  //         {
  //           "value": "manage_paypal_settings",
  //           "label": "Manage PayPal Settings",
  //           "module": "paypal"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Flutterwave",
  //   "label": "Flutterwave",
  //   "packageName": "Flutterwave",
  //   "modules": [
  //     {
  //       "module": "flutterwave",
  //       "moduleLabel": "Flutterwave",
  //       "permissions": [
  //         {
  //           "value": "edit_flutterwave_settings",
  //           "label": "Edit Flutterwave Settings",
  //           "module": "flutterwave"
  //         },
  //         {
  //           "value": "manage_flutterwave_settings",
  //           "label": "Manage Flutterwave Settings",
  //           "module": "flutterwave"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Paystack",
  //   "label": "Paystack",
  //   "packageName": "Paystack",
  //   "modules": [
  //     {
  //       "module": "paystack",
  //       "moduleLabel": "Paystack",
  //       "permissions": [
  //         {
  //           "value": "edit_paystack_settings",
  //           "label": "Edit Paystack Settings",
  //           "module": "paystack"
  //         },
  //         {
  //           "value": "manage_paystack_settings",
  //           "label": "Manage Paystack Settings",
  //           "module": "paystack"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Mollie",
  //   "label": "Mollie",
  //   "packageName": "Mollie",
  //   "modules": [
  //     {
  //       "module": "mollie",
  //       "moduleLabel": "Mollie",
  //       "permissions": [
  //         {
  //           "value": "manage_mollie_settings",
  //           "label": "Manage Mollie Settings",
  //           "module": "mollie"
  //         },
  //         {
  //           "value": "edit_mollie_settings",
  //           "label": "Edit Mollie Settings",
  //           "module": "mollie"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Razorpay",
  //   "label": "Razorpay",
  //   "packageName": "Razorpay",
  //   "modules": [
  //     {
  //       "module": "razorpay",
  //       "moduleLabel": "Razorpay",
  //       "permissions": [
  //         {
  //           "value": "edit_razorpay_settings",
  //           "label": "Edit Razorpay Settings",
  //           "module": "razorpay"
  //         },
  //         {
  //           "value": "manage_razorpay_settings",
  //           "label": "Manage Razorpay Settings",
  //           "module": "razorpay"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Payfast",
  //   "label": "Payfast",
  //   "packageName": "Payfast",
  //   "modules": [
  //     {
  //       "module": "payfast",
  //       "moduleLabel": "Payfast",
  //       "permissions": [
  //         {
  //           "value": "manage_payfast_settings",
  //           "label": "Manage Payfast Settings",
  //           "module": "payfast"
  //         },
  //         {
  //           "value": "edit_payfast_settings",
  //           "label": "Edit Payfast Settings",
  //           "module": "payfast"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "YooKassa",
  //   "label": "YooKassa",
  //   "packageName": "YooKassa",
  //   "modules": [
  //     {
  //       "module": "yookassa",
  //       "moduleLabel": "Yookassa",
  //       "permissions": [
  //         {
  //           "value": "manage_yookassa_settings",
  //           "label": "Manage YooKassa Settings",
  //           "module": "yookassa"
  //         },
  //         {
  //           "value": "edit_yookassa_settings",
  //           "label": "Edit YooKassa Settings",
  //           "module": "yookassa"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "PayTab",
  //   "label": "PayTabs",
  //   "packageName": "PayTab",
  //   "modules": [
  //     {
  //       "module": "pay-tab",
  //       "moduleLabel": "Pay Tab",
  //       "permissions": [
  //         {
  //           "value": "edit_paytab_settings",
  //           "label": "Edit PayTab Settings",
  //           "module": "pay-tab"
  //         },
  //         {
  //           "value": "manage_paytab_settings",
  //           "label": "Manage PayTab Settings",
  //           "module": "pay-tab"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Toyyibpay",
  //   "label": "Toyyibpay",
  //   "packageName": "Toyyibpay",
  //   "modules": [
  //     {
  //       "module": "toyyibpay",
  //       "moduleLabel": "Toyyibpay",
  //       "permissions": [
  //         {
  //           "value": "manage_toyyibpay_settings",
  //           "label": "Manage Toyyibpay Settings",
  //           "module": "toyyibpay"
  //         },
  //         {
  //           "value": "edit_toyyibpay_settings",
  //           "label": "Edit Toyyibpay Settings",
  //           "module": "toyyibpay"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Iyzipay",
  //   "label": "Iyzipay",
  //   "packageName": "Iyzipay",
  //   "modules": [
  //     {
  //       "module": "iyzipay",
  //       "moduleLabel": "Iyzipay",
  //       "permissions": [
  //         {
  //           "value": "manage_iyzipay_settings",
  //           "label": "Manage Iyzipay Settings",
  //           "module": "iyzipay"
  //         },
  //         {
  //           "value": "edit_iyzipay_settings",
  //           "label": "Edit Iyzipay Settings",
  //           "module": "iyzipay"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "PayTR",
  //   "label": "PayTR",
  //   "packageName": "PayTR",
  //   "modules": [
  //     {
  //       "module": "paytr",
  //       "moduleLabel": "Paytr",
  //       "permissions": [
  //         {
  //           "value": "edit_paytr_settings",
  //           "label": "Edit PayTR Settings",
  //           "module": "paytr"
  //         },
  //         {
  //           "value": "manage_paytr_settings",
  //           "label": "Manage PayTR Settings",
  //           "module": "paytr"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Aamarpay",
  //   "label": "AamarPay",
  //   "packageName": "Aamarpay",
  //   "modules": [
  //     {
  //       "module": "aamarpay",
  //       "moduleLabel": "Aamarpay",
  //       "permissions": [
  //         {
  //           "value": "edit_aamarpay_settings",
  //           "label": "Edit Aamarpay Settings",
  //           "module": "aamarpay"
  //         },
  //         {
  //           "value": "manage_aamarpay_settings",
  //           "label": "Manage Aamarpay Settings",
  //           "module": "aamarpay"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Benefit",
  //   "label": "Benefit",
  //   "packageName": "Benefit",
  //   "modules": [
  //     {
  //       "module": "benefit",
  //       "moduleLabel": "Benefit",
  //       "permissions": [
  //         {
  //           "value": "manage_benefit_settings",
  //           "label": "Manage Benefit Settings",
  //           "module": "benefit"
  //         },
  //         {
  //           "value": "edit_benefit_settings",
  //           "label": "Edit Benefit Settings",
  //           "module": "benefit"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Cashfree",
  //   "label": "Cashfree",
  //   "packageName": "Cashfree",
  //   "modules": [
  //     {
  //       "module": "cashfree",
  //       "moduleLabel": "Cashfree",
  //       "permissions": [
  //         {
  //           "value": "manage_cashfree_settings",
  //           "label": "Manage Cashfree Settings",
  //           "module": "cashfree"
  //         },
  //         {
  //           "value": "edit_cashfree_settings",
  //           "label": "Edit Cashfree Settings",
  //           "module": "cashfree"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Coingate",
  //   "label": "Coingate",
  //   "packageName": "Coingate",
  //   "modules": [
  //     {
  //       "module": "coingate",
  //       "moduleLabel": "Coingate",
  //       "permissions": [
  //         {
  //           "value": "manage_coingate_settings",
  //           "label": "Manage Coingate Settings",
  //           "module": "coingate"
  //         },
  //         {
  //           "value": "edit_coingate_settings",
  //           "label": "Edit Coingate Settings",
  //           "module": "coingate"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Midtrans",
  //   "label": "Midtrans",
  //   "packageName": "Midtrans",
  //   "modules": [
  //     {
  //       "module": "midtrans",
  //       "moduleLabel": "Midtrans",
  //       "permissions": [
  //         {
  //           "value": "manage_midtrans_settings",
  //           "label": "Manage Midtrans Settings",
  //           "module": "midtrans"
  //         },
  //         {
  //           "value": "edit_midtrans_settings",
  //           "label": "Edit Midtrans Settings",
  //           "module": "midtrans"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Xendit",
  //   "label": "Xendit",
  //   "packageName": "Xendit",
  //   "modules": [
  //     {
  //       "module": "xendit",
  //       "moduleLabel": "Xendit",
  //       "permissions": [
  //         {
  //           "value": "manage_xendit_settings",
  //           "label": "Manage Xendit Settings",
  //           "module": "xendit"
  //         },
  //         {
  //           "value": "edit_xendit_settings",
  //           "label": "Edit Xendit Settings",
  //           "module": "xendit"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Tap",
  //   "label": "Tap",
  //   "packageName": "Tap",
  //   "modules": [
  //     {
  //       "module": "tap",
  //       "moduleLabel": "Tap",
  //       "permissions": [
  //         {
  //           "value": "manage_tap_settings",
  //           "label": "Manage Tap Settings",
  //           "module": "tap"
  //         },
  //         {
  //           "value": "edit_tap_settings",
  //           "label": "Edit Tap Settings",
  //           "module": "tap"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "AuthorizeNet",
  //   "label": "AuthorizeNet",
  //   "packageName": "AuthorizeNet",
  //   "modules": [
  //     {
  //       "module": "authorizenet",
  //       "moduleLabel": "Authorizenet",
  //       "permissions": [
  //         {
  //           "value": "edit_authorizenet_settings",
  //           "label": "Edit AuthorizeNet Settings",
  //           "module": "authorizenet"
  //         },
  //         {
  //           "value": "manage_authorizenet_settings",
  //           "label": "Manage AuthorizeNet Settings",
  //           "module": "authorizenet"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "Fedapay",
  //   "label": "Fedapay",
  //   "packageName": "Fedapay",
  //   "modules": [
  //     {
  //       "module": "fedapay",
  //       "moduleLabel": "Fedapay",
  //       "permissions": [
  //         {
  //           "value": "manage_fedapay_settings",
  //           "label": "Manage FedaPay Settings",
  //           "module": "fedapay"
  //         },
  //         {
  //           "value": "edit_fedapay_settings",
  //           "label": "Edit FedaPay Settings",
  //           "module": "fedapay"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   "addOn": "CinetPay",
  //   "label": "CinetPay",
  //   "packageName": "CinetPay",
  //   "modules": [
  //     {
  //       "module": "cinetpay",
  //       "moduleLabel": "Cinetpay",
  //       "permissions": [
  //         {
  //           "value": "manage_cinetpay_settings",
  //           "label": "Manage CinetPay Settings",
  //           "module": "cinetpay"
  //         },
  //         {
  //           "value": "edit_cinetpay_settings",
  //           "label": "Edit CinetPay Settings",
  //           "module": "cinetpay"
  //         }
  //       ]
  //     }
  //   ]
  }
] as const satisfies readonly PermissionTreeAddOn[];

export const permissions = rolePermission.flatMap((addOn) =>
  addOn.modules.flatMap((module) =>
    module.permissions.map((permission) => permission.value)
  )
);
