/** Checks syntax only. A browser cannot verify that a VPA exists or who owns it. */
export function validateVpa(vpa: string): boolean {
  return (
    typeof vpa === "string" &&
    vpa.length <= 320 &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z0-9][a-zA-Z0-9.-]{1,63}$/.test(
      vpa.trim(),
    )
  );
}

export function validateMerchantName(name: string): boolean {
  return (
    typeof name === "string" &&
    name.trim().length >= 1 &&
    name.trim().length <= 80 &&
    !/[\u0000-\u001f\u007f]/.test(name)
  );
}

export function validateInvoice(invoice: string): boolean {
  return (
    typeof invoice === "string" &&
    invoice.length <= 120 &&
    !/[\u0000-\u001f\u007f]/.test(invoice)
  );
}
