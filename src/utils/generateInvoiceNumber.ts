import { InvoiceModel } from "../modules/make_modules/invoice/invoice.model";
import { SalesReceiptModel } from "../modules/make_modules/salesReceipt/salesReceipt.model";

type TGenerateType = "invoice" | "sales";

export const generateInvoiceNumber = async (
    prefix: string = "INV",
    type: TGenerateType = "invoice"
): Promise<string> => {
    let lastInvoice;

    if (type === "sales") {
        lastInvoice = await SalesReceiptModel.findOne({
            invoice_number: { $regex: `^${prefix}-\\d+$` },
        })
            .sort({ createdAt: -1 })
            .select("invoice_number")
            .lean();
    } else {
        lastInvoice = await InvoiceModel.findOne({
            invoice_number: { $regex: `^${prefix}-\\d+$` },
        })
            .sort({ createdAt: -1 })
            .select("invoice_number")
            .lean();
    }

    if (!lastInvoice?.invoice_number) {
        return `${prefix}-0001`;
    }

    const match = lastInvoice.invoice_number.match(
        new RegExp(`^${prefix}-(\\d+)$`)
    );

    if (!match) {
        return `${prefix}-0001`;
    }

    const nextSequence = Number(match[1]) + 1;

    return `${prefix}-${String(nextSequence).padStart(4, "0")}`;
};