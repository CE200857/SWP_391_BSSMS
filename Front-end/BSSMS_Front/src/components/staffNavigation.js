import { managerGroups, managerSection } from "./managerNavigation";

export const staffNavigation = {
  Manager: {
    label: "System management",
    home: "/manager/dashboard",
    homeLabel: "Overview & reports",
    groups: managerGroups,
  },
  Receptionist: {
    label: "Receptionist",
    home: "/receptionist/dashboard",
    homeLabel: "Receptionist overview",
    groups: [
      [
        "booking",
        "Appointments & reception",
        "calendar2-week",
        [
          ["/appointments", "Appointment list"],
          ["/treatment-status", "Service status"],
          ["/room-bed-board", "Room status & beds"],
          ["/tour-report", "Tour report"],
        ],
      ],
      [
        "customers",
        "Customer & offers",
        "people",
        [
          ["/customers", "Customer list"],
          ["/my-treatment-profile", "Customer care profiles"],
          ["/membership-benefits", "Membership benefits"],
          ["/vouchers", "Voucher"],
          ["/feedback", "Customer reviews"],
        ],
      ],
      [
        "catalog",
        "Service & treatment plan",
        "scissors",
        [
          ["/services", "Service list"],
          ["/treatment-packages", "Treatment package"],
          ["/service-history", "Service history"],
        ],
      ],
      [
        "finance",
        "Payments",
        "receipt",
        [
          ["/invoices/create", "Take payment for appointment"],
          ["/sell-treatment-package", "Sell treatment package"],
          ["/invoices", "Invoice"],
        ],
      ],
      [
        "schedule",
        "Work schedule",
        "clock-history",
        [["/my-schedule", "Shifts & leave"]],
      ],
    ],
  },
  Technician: {
    label: "Technician",
    home: "/technician/dashboard",
    homeLabel: "Today’s work",
    groups: [
      [
        "treatment",
        "Appointments & treatment",
        "clipboard-pulse",
        [
          ["/treatment-status", "Assigned services"],
          ["/appointments", "Assigned appointments"],
          ["/my-treatment-profile", "Customer profile"],
          ["/service-history", "Service history"],
        ],
      ],
      [
        "resources",
        "Rooms & beds",
        "building",
        [["/room-bed-board", "Room status & beds"]],
      ],
      [
        "catalog",
        "Service & treatment plan",
        "scissors",
        [
          ["/services", "Service list"],
          ["/treatment-packages", "Treatment package"],
        ],
      ],
      [
        "schedule",
        "Work schedule",
        "clock-history",
        [["/my-schedule", "Shifts & leave"]],
      ],
    ],
  },
};

export function staffSection(role, pathname) {
  if (role === "Manager") return managerSection(pathname);
  const path = pathname === "/receptionist/create-walkin"
    ? "/customers"
    : pathname === "/update-room-bed-status"
    ? "/room-bed-board"
    : pathname === "/appointments/create"
    ? "/appointments"
    : pathname.startsWith("/treatment-profile/")
    ? "/my-treatment-profile"
    : pathname;
  return (staffNavigation[role]?.groups || [])
    .flatMap((group) => group[3].map((link) => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + "/"))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
