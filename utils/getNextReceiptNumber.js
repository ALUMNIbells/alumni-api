// utils/getNextReceiptNumber.js
import SystemState from "../models/systemState.js";

export async function getNextReceiptNumber() {
  const state = await SystemState.findOneAndUpdate(
    {},
    { $inc: { "counters.receipt": 1 } },
    { new: true, upsert: true }
  );

  const seq = state.counters.receipt;
  return {
    receiptSeq: seq,
    receiptNumber: String(seq).padStart(5, "0"),
  };
}
