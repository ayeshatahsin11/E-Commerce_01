// Change the numbers here to change delivery pricing
const FREE_DELIVERY_ABOVE = Number(process.env.FREE_DELIVERY_ABOVE) || 500;

const ZONES = [
  { key: "inside_dhaka", label: "Inside Dhaka", fee: 60 },
  { key: "outside_dhaka", label: "Outside Dhaka", fee: 120 },
];

const SLOTS = [
  { key: "morning", label: "Morning (8 AM - 12 PM)" },
  { key: "afternoon", label: "Afternoon (12 PM - 4 PM)" },
  { key: "evening", label: "Evening (4 PM - 8 PM)" },
];

const findZone = (key) => ZONES.find((zone) => zone.key === key);
const findSlot = (key) => SLOTS.find((slot) => slot.key === key);

module.exports = { FREE_DELIVERY_ABOVE, ZONES, SLOTS, findZone, findSlot };