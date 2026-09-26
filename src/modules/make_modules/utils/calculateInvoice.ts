const round2 = (n: number) => Number((Number.isFinite(n) ? n : 0).toFixed(2));

/**
 * Recomputes an invoice-style document's money fields from its line items and
 * order-level inputs. Mirrors the app's summary (see NewInvoiceController):
 *
 *   sub_total   = Σ(qty·rate) − Σ line discounts        (net of line discounts)
 *   order disc  = sub_total · discount%                 (order-level %)
 *   tax         = Σ line (taxBase · lineTax%)           taxBase = gross line,
 *                 or net-of-line-discount when discount_before_tax is set
 *   total       = sub_total − order disc + shipping + tax
 *
 * `tax_breakdown` (the named-tax rows the client computes) is passed through
 * untouched by the caller — it isn't recomputed here because the per-line `tax`
 * is a single numeric rate with no name.
 */
export const calculateInvoice = async (data: any) => {
  let gross = 0;
  let inline_discount = 0;
  let tax_total = 0;

  const beforeTax = Number(data?.discount_before_tax) > 0;

  const processItems = (items?: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    for (const item of items) {
      const quantity = Number(item?.quantity) || 0;
      const rate = Number(item?.rate) || 0;
      const discountPercent = Number(item?.discount) || 0;
      const taxPercent = Number(item?.tax) || 0;

      const base = quantity * rate;
      const discountAmount = (base * discountPercent) / 100;
      const afterDiscount = base - discountAmount;

      // Tax applies to the gross line, or to the discounted line when the
      // document is set to discount-before-tax.
      const taxBase = beforeTax ? afterDiscount : base;
      const taxAmount = (taxBase * taxPercent) / 100;

      gross += base;
      inline_discount += discountAmount;
      tax_total += taxAmount;
    }
  };

  processItems(data?.product);
  processItems(data?.service);

  const sub_total = gross - inline_discount;
  const discountPercent = Number(data?.discount) || 0; // order-level %
  const order_discount = (sub_total * discountPercent) / 100;
  const shipping_cost = Number(data?.shipping_cost) || 0;
  const deposit = Number(data?.deposit) || 0;

  const total = sub_total - order_discount + shipping_cost + tax_total;

  return {
    sub_total: round2(sub_total),
    deposit,
    discount: discountPercent,
    shipping_cost,
    inline_discount: round2(inline_discount),
    tax: round2(tax_total),
    total: round2(total < 0 ? 0 : total),
  };
};
