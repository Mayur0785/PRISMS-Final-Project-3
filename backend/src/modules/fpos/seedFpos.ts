import { FPO } from './fpo.model';

export const DEMO_FPOS = [
  {
    fpoId: 'FPO-2026-0001',
    name: 'Sahyadri Farmer Producer Co-op Ltd.',
    registrationNumber: 'FPO-MH-NSK-2021-0042',
    district: 'Nashik',
    state: 'Maharashtra',
    village: 'Mohadi, Dindori',
    cropsSupported: ['Red Onion', 'Grapes', 'Tomato', 'Soybeans'],
    memberCount: 340,
    description: 'Leading Maharashtra horticulture aggregation FPO specializing in quality grading, cold storage pooling, and bulk buyer direct sales.',
    isDemo: true,
  },
  {
    fpoId: 'FPO-2026-0002',
    name: 'MahaAnand Onion & Grain Growers FPO',
    registrationNumber: 'FPO-MH-LSG-2022-0118',
    district: 'Nashik',
    state: 'Maharashtra',
    village: 'Lasalgaon, Niphad',
    cropsSupported: ['Red Onion', 'Wheat', 'Soybeans', 'Maize'],
    memberCount: 215,
    description: 'Niphad-taluka farmer collective enabling pooled truck transport optimization for onion and grain lots directly to terminal wholesalers.',
    isDemo: true,
  },
  {
    fpoId: 'FPO-2026-0003',
    name: 'Punashlok Ahilya Agro Producer Co.',
    registrationNumber: 'FPO-MH-ANG-2023-0089',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    village: 'Rahuri, Ahmednagar',
    cropsSupported: ['Red Onion', 'Soybeans', 'Wheat', 'Cotton'],
    memberCount: 180,
    description: 'Central Maharashtra aggregation hub providing collective transport freight savings and direct processor contract linkages.',
    isDemo: true,
  },
];

export async function seedDemoFpos() {
  try {
    for (const fpoData of DEMO_FPOS) {
      await FPO.findOneAndUpdate(
        { fpoId: fpoData.fpoId },
        { $set: fpoData },
        { upsert: true, new: true }
      );
    }
    console.log('✅ PRISMS Demo FPOs seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding demo FPOs:', err);
  }
}
