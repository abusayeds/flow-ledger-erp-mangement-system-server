import { Schema, model } from "mongoose";
import { TStockTransfer } from "./transfer.interface";

const stockTransferSchema = new Schema<TStockTransfer>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // product_id is optional: users may type a free-text product name instead of
    // picking a catalog product. With an id we move stock; with only a name we
    // record the transfer without touching stock.
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    product_name: { type: String },
    from_warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    to_warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const StockTransferModel = model<TStockTransfer>("StockTransfer", stockTransferSchema);
