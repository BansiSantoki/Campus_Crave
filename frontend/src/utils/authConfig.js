export function isAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}
