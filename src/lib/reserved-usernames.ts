export const RESERVED_USERNAMES = new Set([
  // Next.js / system
  "_next", "api", "static", "public", "favicon.ico", "robots.txt", "sitemap.xml",
  
  // App routes
  "dashboard", "sign-in", "sign-up", "onboarding", "settings", "bookings", "event-types", "availability",
  
  // Booking flow actions
  "booking", "manage", "cancel", "reschedule",
  
  // Common impersonations
  "admin", "support", "help", "about", "login", "logout", "root", "system"
]);