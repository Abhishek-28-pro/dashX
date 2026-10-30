/**
 * Database Seed Script for PromptWars x Astra Civic Issue Triage Platform
 *
 * Populates realistic, synthetic municipal data:
 * - Distributed across Central, West, North, and South Wards.
 * - Intentional true duplicates within 200m (same category, high token overlap).
 * - Intentional non-duplicate neighbor reports (different category or >200m).
 * - Dense hotspot clusters (>= 3 reports within 350m) for map clustering.
 * - Historical status transitions with audit logs.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing records...');
  await prisma.statusHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.hotspotCache.deleteMany();

  console.log('Seeding initial reports...');

  // Base coordinates around Central Ward (New Delhi Connaught Place / Barakhamba area)
  // Center: 28.6315, 77.2167

  // 1. Primary Urgent Pothole
  const potholeReport = await prisma.report.create({
    data: {
      trackingId: 'REP-7K9X2M4B',
      title: 'Massive deep pothole near Metro Gate 3',
      description:
        'Large circular crater on the right lane directly opposite Metro Gate 3. Two motorbikes lost balance this morning. Urgent repair needed before rush hour.',
      rawDescription:
        'Large circular crater on the right lane directly opposite Metro Gate 3. Two motorbikes lost balance this morning. Urgent repair needed before rush hour.',
      category: 'POTHOLE',
      subCategory: 'Deep crater on arterial road',
      status: 'ASSIGNED',
      priorityScore: 84.5,
      urgencyLevel: 'CRITICAL',
      priorityRationale:
        'Base severity: 24.0 | Public impact: 25.0 (metro station) | Recidivism: 10.5 | Decay: 15.0 | AI Urgency: 10.0',
      latitude: 28.6328,
      longitude: 77.2195,
      address: 'Outer Circle, Connaught Place, near Gate 3',
      ward: 'Ward 14 - Central',
      imageAltText: 'Deep pothole roughly 2 feet wide on asphalt road next to metro exit',
      assignedDept: 'ROADS_AND_BRIDGES',
      assignedTeam: 'Road Maintenance Unit Alpha',
      aiCategorized: true,
      aiSummary: 'Dangerous crater near high-density metro gate posing vehicular rollover hazard.',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000), // 48h ago
      statusHistory: {
        create: [
          {
            fromStatus: 'SUBMITTED',
            toStatus: 'TRIAGED',
            changedBy: 'SYSTEM_AI',
            note: 'Automatically prioritized as CRITICAL due to metro station proximity and recurring reports.',
            createdAt: new Date(Date.now() - 47 * 3600 * 1000),
          },
          {
            fromStatus: 'TRIAGED',
            toStatus: 'ASSIGNED',
            changedBy: 'OFFICER_VERMA',
            note: 'Dispatched Unit Alpha with quick-setting cold mix asphalt.',
            createdAt: new Date(Date.now() - 24 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // 2. Duplicate of Pothole (Within 80 meters, same issue reported by second commuter)
  await prisma.report.create({
    data: {
      trackingId: 'REP-3P9W8X1L',
      title: 'Huge crater road hole outside gate 3 metro',
      description:
        'Deep crater road hole outside gate 3 metro station. Vehicles swerving sharply to avoid it. Extremely hazardous.',
      rawDescription:
        'Deep crater road hole outside gate 3 metro station. Vehicles swerving sharply to avoid it. Extremely hazardous.',
      category: 'POTHOLE',
      status: 'TRIAGED',
      priorityScore: 78.0,
      urgencyLevel: 'HIGH',
      latitude: 28.6331,
      longitude: 77.2198,
      address: 'Outer Circle, Gate 3 Metro Lane',
      ward: 'Ward 14 - Central',
      isDuplicate: true,
      duplicateGroupId: potholeReport.id,
      parentReportId: potholeReport.id,
      similarityScore: 0.82,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000),
      statusHistory: {
        create: [
          {
            fromStatus: 'SUBMITTED',
            toStatus: 'TRIAGED',
            changedBy: 'SYSTEM_AI',
            note: 'Auto-linked as duplicate of REP-7K9X2M4B (similarity 82%, 45m distance).',
          },
        ],
      },
    },
  });

  // 3. Garbage Hotspot cluster Report 1 (Karol Bagh Ward)
  await prisma.report.create({
    data: {
      trackingId: 'REP-8M2N5T9V',
      title: 'Overflowing community garbage dump on Market Road',
      description:
        'Main municipal bin has been spilling onto pedestrian walkway for 4 days. Foul odor spreading into shops and stray animals tearing bags.',
      rawDescription:
        'Main municipal bin has been spilling onto pedestrian walkway for 4 days. Foul odor spreading into shops and stray animals tearing bags.',
      category: 'GARBAGE',
      subCategory: 'Dumpster overflow',
      status: 'IN_PROGRESS',
      priorityScore: 72.0,
      urgencyLevel: 'HIGH',
      priorityRationale:
        'Base severity: 18.0 | Public impact: 25.0 (commercial market) | Decay: 15.0 | AI Urgency: 8.0',
      latitude: 28.6512,
      longitude: 77.1904,
      address: 'Main Market Road, Block 4, Karol Bagh',
      ward: 'Ward 08 - West',
      assignedDept: 'SOLID_WASTE_MANAGEMENT',
      assignedTeam: 'West Sanitation Fleet 3',
      clusterId: 'HOTSPOT-GARBAGE-1',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
      statusHistory: {
        create: [
          {
            fromStatus: 'SUBMITTED',
            toStatus: 'IN_PROGRESS',
            changedBy: 'SUPERVISOR_SINGH',
            note: 'Compactor truck en route for clearance.',
          },
        ],
      },
    },
  });

  // 4. Garbage Hotspot cluster Report 2 (120 meters away)
  await prisma.report.create({
    data: {
      trackingId: 'REP-4Y6U2Q8K',
      title: 'Rotting trash pile behind market complex',
      description:
        'Commercial waste and cardboard dump accumulating behind shopping complex. Major sanitation issue.',
      rawDescription:
        'Commercial waste and cardboard dump accumulating behind shopping complex. Major sanitation issue.',
      category: 'GARBAGE',
      status: 'ASSIGNED',
      priorityScore: 68.0,
      urgencyLevel: 'HIGH',
      latitude: 28.6518,
      longitude: 77.1911,
      address: 'Behind Block 4 Shopping Complex',
      ward: 'Ward 08 - West',
      assignedDept: 'SOLID_WASTE_MANAGEMENT',
      clusterId: 'HOTSPOT-GARBAGE-1',
      createdAt: new Date(Date.now() - 30 * 3600 * 1000),
    },
  });

  // 5. Garbage Hotspot cluster Report 3 (180 meters away)
  await prisma.report.create({
    data: {
      trackingId: 'REP-9Q1Z4R7D',
      title: 'Secondary waste bin broken and scattered',
      description:
        'Metal dumpster damaged by truck, waste strewn across 20 meters of road near school corner.',
      rawDescription:
        'Metal dumpster damaged by truck, waste strewn across 20 meters of road near school corner.',
      category: 'GARBAGE',
      status: 'SUBMITTED',
      priorityScore: 74.0,
      urgencyLevel: 'HIGH',
      latitude: 28.6507,
      longitude: 77.1919,
      address: 'Near DAV School Gate, Karol Bagh',
      ward: 'Ward 08 - West',
      clusterId: 'HOTSPOT-GARBAGE-1',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  // 6. Resolved Streetlight Issue
  await prisma.report.create({
    data: {
      trackingId: 'REP-2L8C5W3P',
      title: 'Flickering street pole at Sector 5 crossroad',
      description:
        'Pole #SL-291 light blinks continuously and goes dark after 9 PM. Causes safety concerns for night commuters.',
      rawDescription:
        'Pole #SL-291 light blinks continuously and goes dark after 9 PM. Causes safety concerns for night commuters.',
      category: 'STREETLIGHT',
      status: 'RESOLVED',
      priorityScore: 45.0,
      urgencyLevel: 'MEDIUM',
      latitude: 28.5721,
      longitude: 77.2289,
      address: 'Sector 5 Crossroad, Lodhi Colony',
      ward: 'Ward 21 - South',
      assignedDept: 'ELECTRICAL_AND_LIGHTING',
      assignedTeam: 'South Night Maintenance',
      createdAt: new Date(Date.now() - 96 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 6 * 3600 * 1000),
      statusHistory: {
        create: [
          {
            fromStatus: 'SUBMITTED',
            toStatus: 'ASSIGNED',
            changedBy: 'SYSTEM_AI',
            note: 'Routed to Electrical team.',
            createdAt: new Date(Date.now() - 90 * 3600 * 1000),
          },
          {
            fromStatus: 'ASSIGNED',
            toStatus: 'RESOLVED',
            changedBy: 'OFFICER_SHARMA',
            note: 'Replaced faulty capacitor and LED driver on pole SL-291. Tested operational.',
            createdAt: new Date(Date.now() - 6 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // 7. Water Leakage Issue
  await prisma.report.create({
    data: {
      trackingId: 'REP-5W9J1K4E',
      title: 'High-pressure clean water pipe fracture',
      description:
        'Drinking water main line leaking heavily onto road. Gallons of clean water wasting and flooding pavement.',
      rawDescription:
        'Drinking water main line leaking heavily onto road. Gallons of clean water wasting and flooding pavement.',
      category: 'WATER_LEAKAGE',
      subCategory: 'Main line pipe rupture',
      status: 'SUBMITTED',
      priorityScore: 82.0,
      urgencyLevel: 'CRITICAL',
      priorityRationale:
        'Base severity: 21.0 | Public impact: 25.0 | Water loss escalation: 20.0 | AI Urgency: 9.0',
      latitude: 28.6214,
      longitude: 77.2145,
      address: 'Parliament Street, Near Patel Chowk',
      ward: 'Ward 14 - Central',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
  });

  // 8. Traffic Hazard / Open Manhole
  await prisma.report.create({
    data: {
      trackingId: 'REP-1T7H4X9S',
      title: 'Open storm drain manhole cover missing',
      description:
        'Cast iron cover missing on active bike lane. Extremely dangerous drop-off for two-wheelers and pedestrians at night.',
      rawDescription:
        'Cast iron cover missing on active bike lane. Extremely dangerous drop-off for two-wheelers and pedestrians at night.',
      category: 'TRAFFIC_HAZARD',
      status: 'SUBMITTED',
      priorityScore: 92.0,
      urgencyLevel: 'CRITICAL',
      priorityRationale:
        'Base severity: 30.0 | Public impact: 25.0 | High fatal risk | AI Urgency: 10.0',
      latitude: 28.6385,
      longitude: 77.2255,
      address: 'Barakhamba Road Junction',
      ward: 'Ward 14 - Central',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
