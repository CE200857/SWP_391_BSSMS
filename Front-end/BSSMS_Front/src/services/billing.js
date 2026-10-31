export const monthRange = (value) => {
  const [year, month] = value.split("-").map(Number);
  return [
    value + "-01",
    `${value}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`,
  ];
};

export function refundableAmount(details) {
  return (
    (details?.payments || [])
      .filter((p) => p.status === "Success")
      .reduce((n, p) => n + Number(p.amount), 0) -
    (details?.refunds || [])
      .filter((r) => r.status === "Success")
      .reduce((n, r) => n + Number(r.amount), 0)
  );
}
