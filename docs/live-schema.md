# Live Supabase Schema (Public)

Generated: 2026-02-05T18:52:31.628Z
Source: PostgREST Swagger spec at /tmp/supabase_rest_root.json

Tables/views in spec: 43

- amazon_activation_license_keys
- amazon_asin_mapping
- amazon_orders
- amazon_seller_accounts
- blocked_ips
- bundles
- cart_items
- categories
- coupon_usage
- coupons
- cron_job_logs
- deals
- fba_early_appeals
- fba_state_delays
- feedback_appeals
- getcid_tokens
- getcid_usage
- license_replacement_requests
- loyalty_transactions
- multi_fsn_orders
- notifications
- office365_customizations
- office365_requests
- order_items
- orders
- point_transactions
- price_alerts
- product_comparisons
- product_requests
- products
- products_data
- profiles
- push_subscriptions
- quotes
- re_engagement_emails
- reviews
- ticket_messages
- tickets
- user_offers
- warranty_registrations
- welcome_offer_templates
- whatsapp_message_logs
- wishlist

---

## amazon_activation_license_keys

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| fsn | string (character varying) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_redeemed | boolean (boolean) |  | false |  |
| license_key | string (text) | yes |  |  |
| order_id | string (character varying) |  | NULL |  |
| redeemed_at | string (timestamp with time zone) |  |  |  |

---

## amazon_asin_mapping

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| asin | string (character varying) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| fsn | string (character varying) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| product_title | string (text) |  |  |  |

---

## amazon_orders

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| buyer_email | string (text) |  |  |  |
| city | string (character varying) |  |  |  |
| confirmation_id | string (character varying) |  |  |  |
| contact_email | string (text) |  |  |  |
| contact_phone | string (character varying) |  |  |  |
| country | string (character varying) |  | IN |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| currency | string (character varying) |  | INR |  |
| early_appeal_at | string (timestamp with time zone) |  |  |  |
| early_appeal_screenshot_url | string (text) |  |  |  |
| early_appeal_status | string (character varying) |  | NULL |  |
| fraud_marked_at | string (timestamp with time zone) |  |  |  |
| fraud_reason | string (character varying) |  |  |  |
| fsn | string (character varying) |  |  |  |
| fulfillment_status | string (text) |  |  |  |
| fulfillment_type | string (character varying) |  | amazon_digital |  |
| getcid_count | integer (integer) |  | 0 |  |
| getcid_used | boolean (boolean) |  | false |  |
| getcid_used_at | string (timestamp with time zone) |  |  |  |
| has_activation_issue | boolean (boolean) |  | false |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| installation_id | string (text) |  |  |  |
| is_fraud | boolean (boolean) |  | false |  |
| is_refunded | boolean (boolean) |  | false |  |
| is_returned | boolean (boolean) |  | false |  |
| issue_created_at | string (timestamp with time zone) |  |  |  |
| issue_status | string (character varying) |  | pending |  |
| last_access_ip | string (character varying) |  |  |  |
| license_key_id | string (uuid) |  |  |  |
| order_date | string (timestamp with time zone) |  |  |  |
| order_id | string (character varying) | yes |  |  |
| order_total | number (numeric) |  |  |  |
| postal_code | string (character varying) |  |  |  |
| quantity | integer (integer) |  | 1 |  |
| returned_at | string (timestamp with time zone) |  |  |  |
| review_email_sent_at | string (timestamp with time zone) |  |  |  |
| seller_account_id | string (uuid) |  |  | FK -> amazon_seller_accounts.id |
| shipped_at | string (timestamp with time zone) |  |  |  |
| state | string (character varying) |  |  |  |
| synced_at | string (timestamp with time zone) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| warranty_status | string (character varying) |  | PENDING |  |

---

## amazon_seller_accounts

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| client_id | string (text) | yes |  |  |
| client_secret | string (text) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| last_sync_at | string (timestamp with time zone) |  |  |  |
| last_sync_status | string (text) |  |  |  |
| marketplace_id | string (text) | yes | A21TJRUUN4KGV |  |
| merchant_token | string (text) | yes |  |  |
| name | string (text) | yes |  |  |
| orders_synced_count | integer (integer) |  | 0 |  |
| priority | integer (integer) | yes | 100 |  |
| refresh_token | string (text) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## blocked_ips

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| blocked_at | string (timestamp with time zone) |  | now() |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| ip_address | string (character varying) | yes |  |  |
| order_id | string (character varying) |  |  |  |
| reason | string (text) |  |  |  |

---

## bundles

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| bundle_price | number (numeric) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| description | string (text) |  |  |  |
| discount_percentage | number (numeric) | yes |  |  |
| display_order | integer (integer) |  | 0 |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| image_url | string (text) |  |  |  |
| is_active | boolean (boolean) |  | true |  |
| is_featured | boolean (boolean) |  | false |  |
| name | string (text) | yes |  |  |
| original_price | number (numeric) | yes |  |  |
| products |  (jsonb) | yes |  |  |
| slug | string (text) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| valid_from | string (timestamp with time zone) |  |  |  |
| valid_until | string (timestamp with time zone) |  |  |  |

---

## cart_items

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| added_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| product_id | string (uuid) | yes |  | FK -> products.id |
| quantity | integer (integer) | yes | 1 |  |
| session_id | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) |  |  | FK -> profiles.id |

---

## categories

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| description | string (text) |  |  |  |
| display_order | integer (integer) |  | 0 |  |
| icon | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| image_url | string (text) |  |  |  |
| is_active | boolean (boolean) |  | true |  |
| is_featured | boolean (boolean) |  | false |  |
| meta_description | string (text) |  |  |  |
| meta_title | string (text) |  |  |  |
| name | string (text) | yes |  |  |
| parent_id | string (uuid) |  |  | FK -> categories.id |
| product_count | integer (integer) |  | 0 |  |
| slug | string (text) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## coupon_usage

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| coupon_id | string (uuid) | yes |  | FK -> coupons.id |
| discount_applied | number (numeric) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| order_id | string (uuid) | yes |  | FK -> orders.id |
| used_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## coupons

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| code | string (text) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| created_by | string (uuid) |  |  | FK -> profiles.id |
| description | string (text) |  |  |  |
| discount_type | string (text) | yes |  |  |
| discount_value | number (numeric) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| max_discount_amount | number (numeric) |  |  |  |
| min_items | integer (integer) |  | 1 |  |
| min_order_amount | number (numeric) |  | 0 |  |
| per_user_limit | integer (integer) |  | 1 |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| usage_limit | integer (integer) |  |  |  |
| used_count | integer (integer) |  | 0 |  |
| valid_from | string (timestamp with time zone) |  | now() |  |
| valid_until | string (timestamp with time zone) |  |  |  |

---

## cron_job_logs

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| completed_at | string (timestamp with time zone) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| details |  (jsonb) |  |  |  |
| duration_ms | integer (integer) |  |  |  |
| error_message | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| job_name | string (character varying) | yes |  |  |
| records_processed | integer (integer) |  | 0 |  |
| started_at | string (timestamp with time zone) | yes | now() |  |
| status | string (character varying) | yes | running |  |

---

## deals

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| created_by | string (uuid) |  |  | FK -> profiles.id |
| deal_price | number (numeric) | yes |  |  |
| deal_type | string (text) |  | lightning |  |
| description | string (text) |  |  |  |
| discount_percentage | integer (integer) | yes |  |  |
| display_order | integer (integer) |  | 0 |  |
| ends_at | string (timestamp with time zone) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| is_featured | boolean (boolean) |  | false |  |
| original_price | number (numeric) | yes |  |  |
| product_id | string (uuid) | yes |  | FK -> products.id |
| quantity_limit | integer (integer) |  |  |  |
| quantity_sold | integer (integer) |  | 0 |  |
| starts_at | string (timestamp with time zone) | yes |  |  |
| title | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## fba_early_appeals

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| customer_email | string (text) | yes |  |  |
| customer_whatsapp | string (character varying) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| order_id | string (character varying) | yes |  |  |
| proof_image_url | string (text) | yes |  |  |
| rejection_reason | string (text) |  |  |  |
| reviewed_at | string (timestamp with time zone) |  |  |  |
| reviewed_by | string (text) |  |  |  |
| status | string (character varying) |  | PENDING |  |

---

## fba_state_delays

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| delay_hours | integer (integer) | yes | 96 |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| state_name | string (character varying) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## feedback_appeals

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| initiated_by | string (text) |  |  |  |
| last_reminder_at | string (timestamp with time zone) |  |  |  |
| order_id | string (text) | yes |  |  |
| partial_amount | number (numeric) |  |  |  |
| phone | string (text) |  |  |  |
| refund_type | string (text) |  | none |  |
| reminder_count | integer (integer) |  | 0 |  |
| reviewed_at | string (timestamp with time zone) |  |  |  |
| screenshot_url | string (text) | yes |  |  |
| status | string (text) |  | PENDING |  |
| submitted_at | string (timestamp with time zone) |  | now() |  |
| type | string (text) |  | feedback |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| whatsapp_sent | boolean (boolean) |  | false |  |

---

## getcid_tokens

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| count_used | integer (integer) |  | 0 |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| email | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| last_used_at | string (timestamp with time zone) |  |  |  |
| last_verified_at | string (timestamp with time zone) |  |  |  |
| priority | integer (integer) |  | 0 |  |
| token | string (text) | yes |  |  |
| total_available | integer (integer) |  | 100 |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## getcid_usage

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| api_response | string (text) |  |  |  |
| api_status | string (character varying) |  |  |  |
| confirmation_id | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| identifier | string (character varying) | yes |  |  |
| identifier_type | string (character varying) | yes |  |  |
| installation_id | string (text) | yes |  |  |
| ip_address | string (inet) |  |  |  |
| user_agent | string (text) |  |  |  |

---

## license_replacement_requests

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| customer_email | string (character varying) | yes |  |  |
| fsn | string (character varying) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| new_license_key_id | string (uuid) |  |  | FK -> amazon_activation_license_keys.id |
| order_id | string (character varying) | yes |  |  |
| original_license_key_id | string (uuid) |  |  | FK -> amazon_activation_license_keys.id |
| reviewed_at | string (timestamp with time zone) |  |  |  |
| reviewed_by | string (uuid) |  |  | FK -> profiles.id |
| screenshot_url | string (text) | yes |  |  |
| status | string (character varying) |  | PENDING |  |

---

## loyalty_transactions

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| description | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| metadata |  (jsonb) |  |  |  |
| order_id | string (uuid) |  |  | FK -> orders.id |
| points | integer (integer) | yes |  |  |
| transaction_type | string (text) | yes |  |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## multi_fsn_orders

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| buyer_email | string (text) |  |  |  |
| contact_email | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| currency | string (text) |  | INR |  |
| fulfillment_type | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| item_count | integer (integer) | yes |  |  |
| items |  (jsonb) | yes |  |  |
| order_date | string (timestamp with time zone) |  |  |  |
| order_id | string (text) | yes |  |  |
| processed_at | string (timestamp with time zone) |  |  |  |
| processed_by | string (uuid) |  |  |  |
| status | string (text) |  | PENDING |  |
| total_amount | number (numeric) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## notifications

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| body | string (text) | yes |  |  |
| data |  (jsonb) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_read | boolean (boolean) |  | false |  |
| sent_at | string (timestamp with time zone) |  | now() |  |
| title | string (text) | yes |  |  |
| type | string (text) | yes |  |  |
| user_id | string (uuid) |  |  | FK -> profiles.id |

---

## office365_customizations

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| address | string (text) |  |  |  |
| completed_at | string (timestamp with time zone) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| display_name | string (text) | yes |  |  |
| first_name | string (text) |  |  |  |
| generated_email | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_completed | boolean (boolean) |  | false |  |
| last_name | string (text) |  |  |  |
| order_id | string (character varying) | yes |  |  |
| phone_number | string (character varying) |  |  |  |

---

## office365_requests

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| completed_at | string (timestamp with time zone) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| email | string (text) | yes |  |  |
| first_name | string (text) | yes |  |  |
| generated_email | string (text) |  |  |  |
| generated_password | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_completed | boolean (boolean) |  | false |  |
| last_name | string (text) | yes |  |  |
| order_id | string (character varying) | yes |  |  |
| username_prefix | string (text) | yes |  |  |
| whatsapp_number | string (character varying) | yes |  |  |

---

## order_items

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| license_key_ids | array (uuid[]) |  |  |  |
| license_keys | array (text[]) |  |  |  |
| order_id | string (uuid) | yes |  | FK -> orders.id |
| product_fsn | string (character varying) |  |  |  |
| product_id | string (uuid) | yes |  | FK -> products.id |
| product_image | string (text) |  |  |  |
| product_name | string (text) | yes |  |  |
| product_sku | string (text) | yes |  |  |
| quantity | integer (integer) | yes | 1 |  |
| secret_codes | array (text[]) |  |  |  |
| status | string (text) |  | pending |  |
| total_price | number (numeric) | yes |  |  |
| unit_price | number (numeric) | yes |  |  |

---

## orders

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| affiliate_id | string (uuid) |  |  |  |
| billing_address |  (jsonb) |  |  |  |
| billing_business_name | string (text) |  |  |  |
| billing_email | string (text) | yes |  |  |
| billing_gstn | string (character varying) |  |  |  |
| billing_name | string (text) | yes |  |  |
| billing_phone | string (text) |  |  |  |
| cgst_amount | number (numeric) |  | 0 |  |
| coupon_code | string (text) |  |  |  |
| coupon_discount | number (numeric) |  | 0 |  |
| coupon_id | string (uuid) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| currency | string (text) |  | INR |  |
| customer_notes | string (text) |  |  |  |
| delivered_at | string (timestamp with time zone) |  |  |  |
| delivery_email_sent | boolean (boolean) |  | false |  |
| delivery_status | string (text) |  | pending |  |
| discount_amount | number (numeric) |  | 0 |  |
| gift_message | string (text) |  |  |  |
| gift_recipient_email | string (text) |  |  |  |
| gift_recipient_name | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| igst_amount | number (numeric) |  | 0 |  |
| is_gift | boolean (boolean) |  | false |  |
| loyalty_points_earned | integer (integer) |  | 0 |  |
| loyalty_points_used | integer (integer) |  | 0 |  |
| order_number | string (text) | yes |  |  |
| paid_at | string (timestamp with time zone) |  |  |  |
| payment_data |  (jsonb) |  |  |  |
| payment_method | string (text) |  | razorpay |  |
| payment_status | string (text) |  | pending |  |
| points_earned | integer (integer) |  | 0 |  |
| razorpay_order_id | string (text) |  |  |  |
| razorpay_payment_id | string (text) |  |  |  |
| razorpay_signature | string (text) |  |  |  |
| referral_code | string (text) |  |  |  |
| sgst_amount | number (numeric) |  | 0 |  |
| status | string (text) |  | pending |  |
| subtotal | number (numeric) | yes |  |  |
| tax_amount | number (numeric) |  | 0 |  |
| total_amount | number (numeric) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |
| wallet_used | number (numeric) |  | 0 |  |

---

## point_transactions

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| description | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| order_id | string (uuid) |  |  | FK -> orders.id |
| points | integer (integer) | yes |  |  |
| type | string (text) | yes |  |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## price_alerts

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| current_price | number (numeric) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| notified_at | string (timestamp with time zone) |  |  |  |
| product_id | string (uuid) | yes |  | FK -> products.id |
| target_price | number (numeric) |  |  |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## product_comparisons

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| product_ids | array (uuid[]) | yes |  |  |
| session_id | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) |  |  | FK -> profiles.id |

---

## product_requests

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| completed_at | string (timestamp with time zone) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| email | string (text) | yes |  |  |
| fsn | string (character varying) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_completed | boolean (boolean) |  | false |  |
| mobile_number | string (character varying) |  |  |  |
| order_id | string (character varying) |  |  |  |
| request_type | string (character varying) |  |  |  |

---

## products

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| allow_backorder | boolean (boolean) |  | false |  |
| avg_rating | number (numeric) |  | 0 |  |
| brand | string (text) |  | Microsoft |  |
| bullet_points | array (text[]) |  |  |  |
| category_id | string (uuid) |  |  | FK -> categories.id |
| cost_price | number (numeric) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| delivery_info | string (text) |  | Instant digital delivery via email |  |
| description | string (text) |  |  |  |
| edition | string (text) |  |  |  |
| features | array (text[]) |  |  |  |
| fsn | string (character varying) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| image_urls | array (text[]) |  |  |  |
| installation_guide_url | string (text) |  |  |  |
| is_active | boolean (boolean) |  | true |  |
| is_bestseller | boolean (boolean) |  | false |  |
| is_featured | boolean (boolean) |  | false |  |
| is_new_arrival | boolean (boolean) |  | false |  |
| keywords | array (text[]) |  |  |  |
| license_duration | string (text) |  | lifetime |  |
| low_stock_threshold | integer (integer) |  | 5 |  |
| main_image_url | string (text) |  |  |  |
| manufacturer | string (text) |  | Microsoft Corporation India |  |
| max_devices | integer (integer) |  | 1 |  |
| meta_description | string (text) |  |  |  |
| meta_keywords | array (text[]) |  |  |  |
| meta_title | string (text) |  |  |  |
| model_name | string (text) |  |  |  |
| model_number | string (text) |  |  |  |
| mrp | number (numeric) | yes |  |  |
| name | string (text) | yes |  |  |
| number_of_licenses | integer (integer) |  | 1 |  |
| operating_systems | array (text[]) |  |  |  |
| platform | array (text[]) |  |  |  |
| price | number (numeric) | yes |  |  |
| review_count | integer (integer) |  | 0 |  |
| sale_end_at | string (timestamp with time zone) |  |  |  |
| sale_price | number (numeric) |  |  |  |
| sale_start_at | string (timestamp with time zone) |  |  |  |
| short_description | string (text) |  |  |  |
| sku | string (text) | yes |  |  |
| slug | string (text) | yes |  |  |
| sold_count | integer (integer) |  | 0 |  |
| specifications |  (jsonb) |  |  |  |
| stock_quantity | integer (integer) |  | 0 |  |
| subscription_term | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| view_count | integer (integer) |  | 0 |  |

---

## products_data

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| download_link | string (text) |  |  |  |
| fsn | string (character varying) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| installation_doc | string (character varying) |  |  |  |
| original_image_url | string (text) |  |  |  |
| product_image | string (text) |  |  |  |
| product_title | string (text) | yes |  |  |
| slug | string (character varying) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## profiles

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| avatar_url | string (text) |  |  |  |
| billing_address |  (jsonb) |  |  |  |
| business_name | string (text) |  |  |  |
| business_type | string (text) |  | individual |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| email | string (text) | yes |  |  |
| email_verified | boolean (boolean) |  | false |  |
| full_name | string (text) |  |  |  |
| gstn | string (character varying) |  |  |  |
| id | string (uuid) | yes |  | PK |
| is_active | boolean (boolean) |  | true |  |
| last_login_at | string (timestamp with time zone) |  |  |  |
| lifetime_points | integer (integer) |  | 0 |  |
| loyalty_points_balance | integer (integer) |  | 0 |  |
| phone | string (text) |  |  |  |
| points | integer (integer) |  | 0 |  |
| preferred_currency | string (text) |  | INR |  |
| preferred_language | string (text) |  | en |  |
| referral_code | string (text) |  |  |  |
| referred_by | string (uuid) |  |  | FK -> profiles.id |
| role | string (text) |  | customer |  |
| tier | string (text) |  | bronze |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| wallet_balance | number (numeric) |  | 0 |  |

---

## push_subscriptions

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| endpoint | string (text) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_active | boolean (boolean) |  | true |  |
| is_admin_subscriber | boolean (boolean) |  | false |  |
| is_customer | boolean (boolean) |  | false |  |
| keys |  (jsonb) | yes |  |  |
| notify_product_request_status | boolean (boolean) |  | true |  |
| notify_replacement_status | boolean (boolean) |  | true |  |
| notify_warranty_status | boolean (boolean) |  | true |  |
| order_id | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_agent | string (text) |  |  |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## quotes

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| company_name | string (text) | yes |  |  |
| contact_name | string (text) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| email | string (text) | yes |  |  |
| gstn | string (character varying) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| notes | string (text) |  |  |  |
| phone | string (text) |  |  |  |
| products |  (jsonb) | yes |  |  |
| quoted_amount | number (numeric) |  |  |  |
| status | string (text) |  | pending |  |
| total_quantity | integer (integer) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) |  |  | FK -> profiles.id |
| valid_until | string (timestamp with time zone) |  |  |  |

---

## re_engagement_emails

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| customer_email | string (text) | yes |  |  |
| days_since_order | integer (integer) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| offer_code | string (text) |  |  |  |
| sent_at | string (timestamp with time zone) | yes | now() |  |

---

## reviews

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_response | string (text) |  |  |  |
| admin_response_at | string (timestamp with time zone) |  |  |  |
| cons | array (text[]) |  |  |  |
| content | string (text) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| helpful_count | integer (integer) |  | 0 |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_approved | boolean (boolean) |  | true |  |
| is_featured | boolean (boolean) |  | false |  |
| is_verified_purchase | boolean (boolean) |  | false |  |
| not_helpful_count | integer (integer) |  | 0 |  |
| order_id | string (uuid) |  |  | FK -> orders.id |
| product_id | string (uuid) | yes |  | FK -> products.id |
| pros | array (text[]) |  |  |  |
| rating | integer (integer) | yes |  |  |
| title | string (text) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## ticket_messages

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| attachments |  (jsonb) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_internal | boolean (boolean) |  | false |  |
| message | string (text) | yes |  |  |
| sender_id | string (uuid) | yes |  | FK -> profiles.id |
| sender_type | string (text) | yes |  |  |
| ticket_id | string (uuid) | yes |  | FK -> tickets.id |

---

## tickets

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| assigned_to | string (uuid) |  |  | FK -> profiles.id |
| category | string (text) | yes |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| order_id | string (uuid) |  |  | FK -> orders.id |
| priority | string (text) |  | medium |  |
| status | string (text) |  | open |  |
| subject | string (text) | yes |  |  |
| ticket_number | string (text) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## user_offers

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| discount_value | number (numeric) |  |  |  |
| expires_at | string (timestamp with time zone) | yes |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| is_used | boolean (boolean) |  | false |  |
| offer_price | number (numeric) |  |  |  |
| offer_type | string (text) | yes |  |  |
| original_price | number (numeric) |  |  |  |
| product_id | string (uuid) |  |  | FK -> products.id |
| used_at | string (timestamp with time zone) |  |  |  |
| user_id | string (uuid) | yes |  | FK -> profiles.id |

---

## warranty_registrations

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| admin_notes | string (text) |  |  |  |
| contact | string (character varying) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| customer_email | string (character varying) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| last_reminder_sent_at | string (timestamp with time zone) |  |  |  |
| missing_product_review | boolean (boolean) |  | false |  |
| missing_seller_feedback | boolean (boolean) |  | false |  |
| order_id | string (character varying) | yes |  |  |
| product_name | string (character varying) |  |  |  |
| purchase_date | string (date) |  |  |  |
| quantity | integer (integer) |  | 1 |  |
| rejection_reason | string (text) |  |  |  |
| reminder_count | integer (integer) |  | 0 |  |
| screenshot_product_review | string (text) |  |  |  |
| screenshot_seller_feedback | string (text) |  |  |  |
| status | string (character varying) |  | PROCESSING |  |
| verified_at | string (timestamp with time zone) |  |  |  |

---

## welcome_offer_templates

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| description | string (text) |  |  |  |
| discount_type | string (text) |  | percentage |  |
| discount_value | number (numeric) |  |  |  |
| duration_hours | integer (integer) | yes | 12 |  |
| id | string (uuid) | yes | extensions.uuid_generate_v4() | PK |
| is_active | boolean (boolean) |  | true |  |
| max_discount_cap | number (numeric) |  |  |  |
| offer_type | string (text) | yes |  |  |
| product_id | string (uuid) |  |  | FK -> products.id |
| special_price | number (numeric) |  |  |  |
| title | string (text) | yes |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## whatsapp_message_logs

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| context | string (character varying) |  |  |  |
| created_at | string (timestamp with time zone) |  | now() |  |
| error_message | string (text) |  |  |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| message_id | string (character varying) |  |  |  |
| order_id | string (character varying) | yes |  |  |
| phone | string (character varying) | yes |  |  |
| status | string (character varying) | yes |  |  |
| template_name | string (character varying) | yes |  |  |
| template_variables |  (jsonb) |  |  |  |
| updated_at | string (timestamp with time zone) |  | now() |  |

---

## wishlist

| column | type | required | default | constraints |
| --- | --- | --- | --- | --- |
| created_at | string (timestamp with time zone) |  | now() |  |
| id | string (uuid) | yes | gen_random_uuid() | PK |
| product_id | string (uuid) | yes |  | FK -> products.id |
| user_id | string (uuid) | yes |  | FK -> profiles.id |
