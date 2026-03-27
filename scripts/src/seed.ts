import { db, priceRulesTable, serviceAreasTable } from "@workspace/db";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding price rules...");

  await db.insert(priceRulesTable).values([
    {
      id: randomUUID(),
      serviceType: "standard_clean",
      propertyType: "house",
      minPriceCents: 12000,
      basePriceCents: 12000,
      perBedroomCents: 2000,
      perBathroomCents: 2500,
      addonPriceCents: 1500,
      surchargeJson: { weekend: 1.10, publicHoliday: 1.25 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "standard_clean",
      propertyType: "apartment",
      minPriceCents: 10000,
      basePriceCents: 10000,
      perBedroomCents: 1500,
      perBathroomCents: 2000,
      addonPriceCents: 1500,
      surchargeJson: { weekend: 1.10 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "deep_clean",
      propertyType: "house",
      minPriceCents: 18000,
      basePriceCents: 18000,
      perBedroomCents: 2500,
      perBathroomCents: 3000,
      addonPriceCents: 2000,
      surchargeJson: { weekend: 1.15, publicHoliday: 1.30 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "end_of_lease",
      propertyType: "house",
      minPriceCents: 26000,
      basePriceCents: 26000,
      perBedroomCents: 3000,
      perBathroomCents: 4000,
      addonPriceCents: 2500,
      surchargeJson: { weekend: 1.15, publicHoliday: 1.30 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "end_of_lease",
      propertyType: "apartment",
      minPriceCents: 22000,
      basePriceCents: 22000,
      perBedroomCents: 2500,
      perBathroomCents: 3500,
      addonPriceCents: 2500,
      surchargeJson: { weekend: 1.15 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "office_clean",
      propertyType: "office",
      minPriceCents: 18000,
      basePriceCents: 18000,
      perBedroomCents: 1500,
      perBathroomCents: 2000,
      addonPriceCents: 1800,
      surchargeJson: { afterHours: 1.20 },
      active: true,
    },
    {
      id: randomUUID(),
      serviceType: "ndis_support",
      propertyType: "house",
      minPriceCents: 15000,
      basePriceCents: 15000,
      perBedroomCents: 1800,
      perBathroomCents: 2200,
      addonPriceCents: 1500,
      surchargeJson: {},
      active: true,
    },
  ]).onConflictDoNothing();

  console.log("Seeding service areas...");

  await db.insert(serviceAreasTable).values([
    { id: randomUUID(), suburb: "Sydney CBD", state: "NSW", postcode: "2000", active: true },
    { id: randomUUID(), suburb: "Surry Hills", state: "NSW", postcode: "2010", active: true },
    { id: randomUUID(), suburb: "Newtown", state: "NSW", postcode: "2042", active: true },
    { id: randomUUID(), suburb: "Bondi", state: "NSW", postcode: "2026", active: true },
    { id: randomUUID(), suburb: "Parramatta", state: "NSW", postcode: "2150", active: true },
    { id: randomUUID(), suburb: "Melbourne CBD", state: "VIC", postcode: "3000", active: true },
    { id: randomUUID(), suburb: "St Kilda", state: "VIC", postcode: "3182", active: true },
    { id: randomUUID(), suburb: "Fitzroy", state: "VIC", postcode: "3065", active: true },
    { id: randomUUID(), suburb: "Richmond", state: "VIC", postcode: "3121", active: true },
    { id: randomUUID(), suburb: "Brisbane CBD", state: "QLD", postcode: "4000", active: true },
    { id: randomUUID(), suburb: "South Brisbane", state: "QLD", postcode: "4101", active: true },
    { id: randomUUID(), suburb: "West End", state: "QLD", postcode: "4101", active: true },
    { id: randomUUID(), suburb: "Perth CBD", state: "WA", postcode: "6000", active: true },
    { id: randomUUID(), suburb: "Fremantle", state: "WA", postcode: "6160", active: true },
    { id: randomUUID(), suburb: "Adelaide CBD", state: "SA", postcode: "5000", active: true },
    { id: randomUUID(), suburb: "Canberra", state: "ACT", postcode: "2600", active: true },
    { id: randomUUID(), suburb: "Hobart", state: "TAS", postcode: "7000", active: true },
    { id: randomUUID(), suburb: "Darwin", state: "NT", postcode: "0800", active: true },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
