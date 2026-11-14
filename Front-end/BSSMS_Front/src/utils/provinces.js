export const PROVINCES = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội", "Hà Tĩnh", "Hải Phòng", "Hưng Yên", "Huế",
  "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ",
  "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa",
  "TP. Hồ Chí Minh", "Tuyên Quang", "Vĩnh Long",
];

export const joinAddress = (detail, province) => [detail?.trim(), province].filter(Boolean).join(", ");

const ALIASES = [[/,?\s*(TP\.?\s*HCM|TP\.?\s*Hồ Chí Minh|Thành phố Hồ Chí Minh|Hồ Chí Minh)$/i, "TP. Hồ Chí Minh"]];

export const splitAddress = (address) => {
  let text = (address || "").trim();
  for (const [re, name] of ALIASES) if (re.test(text)) text = joinAddress(text.replace(re, ""), name);
  const province = PROVINCES.find((p) => text === p || text.endsWith(`, ${p}`));
  if (!province) return { detail: text, province: "" };
  return { detail: text.slice(0, text.length - province.length).replace(/,\s*$/, "").trim(), province };
};
