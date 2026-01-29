#!/usr/bin/env tsx
/**
 * Seed sample data for Bondi Beach agencies/agents
 * Used to demonstrate MVP while AI pipeline is being refined.
 */

import { db } from '../src/lib/db';
import {
  agencies,
  agents,
  agentSuburbs,
  sales,
  reviews,
  suburbs,
} from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Sample data for Bondi Beach
// ---------------------------------------------------------------------------

const sampleAgencies = [
  {
    slug: 'ray-white-bondi-beach',
    name: 'Ray White Bondi Beach',
    brandName: 'Ray White',
    logoUrl: 'https://www.raywhite.com/images/logo.svg',
    websiteUrl: 'https://raywhitebondibeach.com.au',
    phone: '02 9365 5888',
    email: 'bondibeach.nsw@raywhite.com',
    streetAddress: '170 Campbell Parade',
    suburb: 'Bondi Beach',
    state: 'NSW',
    postcode: '2026',
    lat: -33.8908,
    lng: 151.2743,
    description: 'Ray White Bondi Beach is a leading real estate agency serving the Eastern Suburbs of Sydney. With over 30 years of experience, our team specialises in residential sales and property management across Bondi Beach, Bondi, Tamarama, and surrounding suburbs.',
  },
  {
    slug: 'mcgrath-bondi-beach',
    name: 'McGrath Bondi Beach',
    brandName: 'McGrath',
    logoUrl: 'https://www.mcgrath.com.au/images/logo.svg',
    websiteUrl: 'https://www.mcgrath.com.au/offices/bondi-beach',
    phone: '02 9130 9888',
    email: 'bondibeach@mcgrath.com.au',
    streetAddress: '136 Campbell Parade',
    suburb: 'Bondi Beach',
    state: 'NSW',
    postcode: '2026',
    lat: -33.8905,
    lng: 151.2738,
    description: 'McGrath Bondi Beach is part of the McGrath network, offering premium real estate services in the Eastern Suburbs. Our agents are local experts with deep knowledge of the Bondi Beach property market.',
  },
  {
    slug: 'belle-property-bondi',
    name: 'Belle Property Bondi Beach',
    brandName: 'Belle Property',
    logoUrl: 'https://www.belleproperty.com/images/logo.svg',
    websiteUrl: 'https://www.belleproperty.com/bondi-beach',
    phone: '02 9130 7000',
    email: 'bondi@belleproperty.com',
    streetAddress: '83 Hall Street',
    suburb: 'Bondi Beach',
    state: 'NSW',
    postcode: '2026',
    lat: -33.8901,
    lng: 151.2735,
    description: 'Belle Property Bondi Beach delivers exceptional results for sellers and buyers in the Eastern Suburbs. Our boutique approach ensures personalised service and expert local knowledge.',
  },
];

const sampleAgents = [
  // Ray White agents
  {
    agencySlug: 'ray-white-bondi-beach',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@raywhite.com',
    phone: '02 9365 5888',
    mobilePhone: '0412 345 678',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    licenseNumber: '20123456',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'Michael Chen is a top-performing agent with over 15 years of experience in the Eastern Suburbs property market. Specialising in luxury apartments and beachfront properties, Michael has achieved record-breaking sales in Bondi Beach. His multilingual skills and attention to detail have earned him a loyal client base and numerous industry awards.',
    yearsActive: 15,
    languagesSpoken: ['English', 'Mandarin', 'Cantonese'],
    specializations: ['Residential', 'Luxury', 'Apartments'],
    suburbsServiced: ['Bondi Beach', 'Bondi', 'Tamarama', 'Bronte'],
  },
  {
    agencySlug: 'ray-white-bondi-beach',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@raywhite.com',
    phone: '02 9365 5888',
    mobilePhone: '0423 456 789',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    licenseNumber: '20234567',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'Sarah Williams brings a fresh perspective to real estate with her background in marketing and interior design. Her keen eye for property presentation and strong negotiation skills have helped clients achieve exceptional results. Sarah specialises in first-home buyers and young families looking to enter the Bondi market.',
    yearsActive: 8,
    languagesSpoken: ['English'],
    specializations: ['Residential', 'First Home Buyers', 'Investment'],
    suburbsServiced: ['Bondi Beach', 'Bondi', 'North Bondi', 'Dover Heights'],
  },
  {
    agencySlug: 'ray-white-bondi-beach',
    firstName: 'James',
    lastName: 'Thompson',
    email: 'james.thompson@raywhite.com',
    phone: '02 9365 5888',
    mobilePhone: '0434 567 890',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    licenseNumber: '20345678',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'James Thompson is a Bondi Beach local with an unparalleled understanding of the Eastern Suburbs lifestyle. His genuine passion for the area and commitment to client service has made him one of the most trusted agents in the region. James specialises in family homes and development sites.',
    yearsActive: 12,
    languagesSpoken: ['English', 'Spanish'],
    specializations: ['Residential', 'Development', 'Commercial'],
    suburbsServiced: ['Bondi Beach', 'Bondi Junction', 'Queens Park', 'Waverley'],
  },
  // McGrath agents
  {
    agencySlug: 'mcgrath-bondi-beach',
    firstName: 'Emma',
    lastName: 'Davidson',
    email: 'emma.davidson@mcgrath.com.au',
    phone: '02 9130 9888',
    mobilePhone: '0445 678 901',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    licenseNumber: '20456789',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'Emma Davidson is an award-winning agent known for her exceptional market knowledge and client-focused approach. With a background in finance, Emma provides clients with comprehensive advice on property investment. She has consistently ranked among the top performers at McGrath nationally.',
    yearsActive: 10,
    languagesSpoken: ['English', 'French'],
    specializations: ['Residential', 'Investment', 'Downsizers'],
    suburbsServiced: ['Bondi Beach', 'Bondi', 'Tamarama', 'Clovelly'],
  },
  {
    agencySlug: 'mcgrath-bondi-beach',
    firstName: 'David',
    lastName: 'Park',
    email: 'david.park@mcgrath.com.au',
    phone: '02 9130 9888',
    mobilePhone: '0456 789 012',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    licenseNumber: '20567890',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'David Park has built a reputation for delivering outstanding results through his innovative marketing strategies and deep understanding of buyer psychology. His attention to detail and professional approach have earned him numerous accolades in the industry.',
    yearsActive: 7,
    languagesSpoken: ['English', 'Korean'],
    specializations: ['Residential', 'Apartments', 'Off-the-plan'],
    suburbsServiced: ['Bondi Beach', 'Rose Bay', 'Double Bay', 'Vaucluse'],
  },
  // Belle Property agents
  {
    agencySlug: 'belle-property-bondi',
    firstName: 'Sophie',
    lastName: 'Anderson',
    email: 'sophie.anderson@belleproperty.com',
    phone: '02 9130 7000',
    mobilePhone: '0467 890 123',
    photoUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
    licenseNumber: '20678901',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'Sophie Anderson combines her passion for architecture with real estate expertise to deliver exceptional results for discerning clients. Her boutique approach and attention to property styling has helped achieve premium prices in the Eastern Suburbs market.',
    yearsActive: 9,
    languagesSpoken: ['English', 'Italian'],
    specializations: ['Residential', 'Luxury', 'Heritage Homes'],
    suburbsServiced: ['Bondi Beach', 'Bondi', 'Bellevue Hill', 'Woollahra'],
  },
  {
    agencySlug: 'belle-property-bondi',
    firstName: 'Tom',
    lastName: 'Richards',
    email: 'tom.richards@belleproperty.com',
    phone: '02 9130 7000',
    mobilePhone: '0478 901 234',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    licenseNumber: '20789012',
    licenseStatus: 'active',
    licenseState: 'NSW',
    bio: 'Tom Richards is known for his honest, straightforward approach to real estate. A former professional surfer, Tom understands the Bondi Beach lifestyle better than anyone. His local connections and genuine personality make him a favourite among both buyers and sellers.',
    yearsActive: 11,
    languagesSpoken: ['English'],
    specializations: ['Residential', 'Beachfront', 'Lifestyle Properties'],
    suburbsServiced: ['Bondi Beach', 'North Bondi', 'Tamarama', 'Bronte'],
  },
];

// Sample sales data (slugs match generated format: firstname-lastname-brand-suburb)
const sampleSales = [
  // Michael Chen sales
  { agentSlug: 'michael-chen-ray-white', propertyAddress: '45/170 Campbell Parade', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 2150000, saleMethod: 'auction', saleDate: '2024-11-15', bedrooms: 2, bathrooms: 2, carSpaces: 1, daysOnMarket: 21 },
  { agentSlug: 'michael-chen-ray-white', propertyAddress: '12 Francis Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 4800000, saleMethod: 'auction', saleDate: '2024-10-28', bedrooms: 4, bathrooms: 3, carSpaces: 2, daysOnMarket: 28 },
  { agentSlug: 'michael-chen-ray-white', propertyAddress: '8/55 Hall Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 1450000, saleMethod: 'private_treaty', saleDate: '2024-09-20', bedrooms: 1, bathrooms: 1, carSpaces: 1, daysOnMarket: 14 },
  { agentSlug: 'michael-chen-ray-white', propertyAddress: '23 Warners Avenue', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 5200000, saleMethod: 'auction', saleDate: '2024-08-10', bedrooms: 5, bathrooms: 3, carSpaces: 2, daysOnMarket: 35 },
  // Sarah Williams sales
  { agentSlug: 'sarah-williams-ray-white', propertyAddress: '15/88 Roscoe Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 980000, saleMethod: 'private_treaty', saleDate: '2024-11-01', bedrooms: 1, bathrooms: 1, carSpaces: 0, daysOnMarket: 18 },
  { agentSlug: 'sarah-williams-ray-white', propertyAddress: '3/42 Glenayr Avenue', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'unit', salePrice: 1350000, saleMethod: 'auction', saleDate: '2024-10-15', bedrooms: 2, bathrooms: 1, carSpaces: 1, daysOnMarket: 25 },
  // James Thompson sales
  { agentSlug: 'james-thompson-ray-white', propertyAddress: '56 Brighton Boulevard', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 3750000, saleMethod: 'auction', saleDate: '2024-10-20', bedrooms: 4, bathrooms: 2, carSpaces: 2, daysOnMarket: 32 },
  // Emma Davidson sales
  { agentSlug: 'emma-davidson-mcgrath-bondi', propertyAddress: '5 Wallis Parade', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 6500000, saleMethod: 'auction', saleDate: '2024-11-20', bedrooms: 5, bathrooms: 4, carSpaces: 2, daysOnMarket: 30 },
  { agentSlug: 'emma-davidson-mcgrath-bondi', propertyAddress: '22/160 Campbell Parade', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 2850000, saleMethod: 'auction', saleDate: '2024-10-05', bedrooms: 3, bathrooms: 2, carSpaces: 2, daysOnMarket: 22 },
  { agentSlug: 'emma-davidson-mcgrath-bondi', propertyAddress: '18 Lamrock Avenue', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 3900000, saleMethod: 'private_treaty', saleDate: '2024-09-12', bedrooms: 3, bathrooms: 2, carSpaces: 1, daysOnMarket: 42 },
  // David Park sales
  { agentSlug: 'david-park-mcgrath-bondi', propertyAddress: '9/95 Ramsgate Avenue', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 1950000, saleMethod: 'auction', saleDate: '2024-11-02', bedrooms: 2, bathrooms: 2, carSpaces: 1, daysOnMarket: 24 },
  // Sophie Anderson sales
  { agentSlug: 'sophie-anderson-belle-property', propertyAddress: '7 O\'Brien Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 4200000, saleMethod: 'auction', saleDate: '2024-11-08', bedrooms: 4, bathrooms: 2, carSpaces: 2, daysOnMarket: 26 },
  { agentSlug: 'sophie-anderson-belle-property', propertyAddress: '10/72 Curlewis Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', propertyType: 'apartment', salePrice: 1680000, saleMethod: 'private_treaty', saleDate: '2024-10-22', bedrooms: 2, bathrooms: 1, carSpaces: 1, daysOnMarket: 19 },
  // Tom Richards sales
  { agentSlug: 'tom-richards-belle-property', propertyAddress: '31 Hastings Parade', suburb: 'North Bondi', state: 'NSW', postcode: '2026', propertyType: 'house', salePrice: 5100000, saleMethod: 'auction', saleDate: '2024-10-30', bedrooms: 4, bathrooms: 3, carSpaces: 2, daysOnMarket: 29 },
];

// Sample reviews (slugs match generated format)
const sampleReviews = [
  // Michael Chen reviews
  { agentSlug: 'michael-chen-ray-white', reviewerName: 'Jennifer L.', reviewDate: '2024-11-20', reviewerType: 'seller', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 5, reviewText: 'Michael was exceptional from start to finish. His knowledge of the Bondi market is unmatched and he achieved a price well above our expectations. Highly recommend!', sourcePlatform: 'ratemyagent' },
  { agentSlug: 'michael-chen-ray-white', reviewerName: 'Robert K.', reviewDate: '2024-10-15', reviewerType: 'buyer', overallRating: 5, knowledgeRating: 5, communicationRating: 4, negotiationRating: 5, reviewText: 'Very professional and knowledgeable. Michael made the buying process smooth and was always available to answer our questions.', sourcePlatform: 'google' },
  { agentSlug: 'michael-chen-ray-white', reviewerName: 'Lisa M.', reviewDate: '2024-09-28', reviewerType: 'seller', overallRating: 4, knowledgeRating: 5, communicationRating: 4, negotiationRating: 4, reviewText: 'Great result on our apartment sale. Michael\'s Chinese language skills were a huge asset given the buyer demographics in Bondi.', sourcePlatform: 'ratemyagent' },
  // Sarah Williams reviews
  { agentSlug: 'sarah-williams-ray-white', reviewerName: 'Chris B.', reviewDate: '2024-11-05', reviewerType: 'buyer', overallRating: 5, knowledgeRating: 4, communicationRating: 5, negotiationRating: 5, reviewText: 'Sarah was fantastic for us as first home buyers. She was patient, explained everything clearly, and found us a great property within our budget.', sourcePlatform: 'ratemyagent' },
  // Emma Davidson reviews
  { agentSlug: 'emma-davidson-mcgrath-bondi', reviewerName: 'Mark S.', reviewDate: '2024-11-25', reviewerType: 'seller', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 5, reviewText: 'Emma is simply the best in the business. Her attention to detail and marketing strategy resulted in multiple offers above asking price. Cannot recommend highly enough!', sourcePlatform: 'ratemyagent' },
  { agentSlug: 'emma-davidson-mcgrath-bondi', reviewerName: 'Angela T.', reviewDate: '2024-10-12', reviewerType: 'buyer', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 4, reviewText: 'Emma helped us find our dream home in Bondi. She was patient, knowledgeable, and always had our best interests at heart.', sourcePlatform: 'google' },
  { agentSlug: 'emma-davidson-mcgrath-bondi', reviewerName: 'Tony R.', reviewDate: '2024-09-18', reviewerType: 'seller', overallRating: 4, knowledgeRating: 5, communicationRating: 4, negotiationRating: 5, reviewText: 'Professional service from start to finish. Emma achieved a great result for our property sale.', sourcePlatform: 'ratemyagent' },
  // David Park reviews
  { agentSlug: 'david-park-mcgrath-bondi', reviewerName: 'Susan K.', reviewDate: '2024-11-08', reviewerType: 'seller', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 5, reviewText: 'David\'s marketing was outstanding. His social media strategy brought in a lot of interested buyers and we sold for above reserve.', sourcePlatform: 'ratemyagent' },
  // Sophie Anderson reviews
  { agentSlug: 'sophie-anderson-belle-property', reviewerName: 'David H.', reviewDate: '2024-11-10', reviewerType: 'seller', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 5, reviewText: 'Sophie\'s styling advice transformed our property presentation. The result was a record price for our street. Truly exceptional service!', sourcePlatform: 'ratemyagent' },
  { agentSlug: 'sophie-anderson-belle-property', reviewerName: 'Karen P.', reviewDate: '2024-10-30', reviewerType: 'seller', overallRating: 4, knowledgeRating: 4, communicationRating: 5, negotiationRating: 4, reviewText: 'Very happy with Sophie\'s work. She kept us informed throughout the entire process and achieved a great outcome.', sourcePlatform: 'agency_website' },
  // Tom Richards reviews
  { agentSlug: 'tom-richards-belle-property', reviewerName: 'James W.', reviewDate: '2024-11-15', reviewerType: 'seller', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 5, reviewText: 'Tom knows Bondi Beach inside out. His local connections and genuine approach made selling our home a breeze. Highly recommended!', sourcePlatform: 'google' },
  { agentSlug: 'tom-richards-belle-property', reviewerName: 'Michelle S.', reviewDate: '2024-10-08', reviewerType: 'buyer', overallRating: 5, knowledgeRating: 5, communicationRating: 5, negotiationRating: 4, reviewText: 'Great experience working with Tom. He really understood what we were looking for and found us the perfect beachside property.', sourcePlatform: 'ratemyagent' },
];

// ---------------------------------------------------------------------------
// Seeding functions
// ---------------------------------------------------------------------------

function generateSlug(...parts: string[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function findSuburbId(suburbName: string): Promise<number | null> {
  const [suburb] = await db
    .select()
    .from(suburbs)
    .where(sql`LOWER(${suburbs.name}) = LOWER(${suburbName})`)
    .limit(1);
  return suburb?.id ?? null;
}

async function seedAgencies() {
  console.log('\nSeeding agencies...');
  for (const agency of sampleAgencies) {
    const existing = await db
      .select()
      .from(agencies)
      .where(eq(agencies.slug, agency.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Updating: ${agency.name}`);
      await db.update(agencies).set({
        ...agency,
        updatedAt: new Date(),
      }).where(eq(agencies.slug, agency.slug));
    } else {
      console.log(`  Creating: ${agency.name}`);
      await db.insert(agencies).values(agency);
    }
  }
}

async function seedAgents() {
  console.log('\nSeeding agents...');
  const agencyMap = new Map<string, number>();

  // Build agency ID map
  for (const agency of sampleAgencies) {
    const [row] = await db.select().from(agencies).where(eq(agencies.slug, agency.slug)).limit(1);
    if (row) agencyMap.set(agency.slug, row.id);
  }

  for (const agent of sampleAgents) {
    const agencyId = agencyMap.get(agent.agencySlug);
    if (!agencyId) {
      console.log(`  Skipping ${agent.firstName} ${agent.lastName} - agency not found`);
      continue;
    }

    const agentSlug = generateSlug(agent.firstName, agent.lastName, agent.agencySlug.split('-').slice(0, 2).join('-'));

    const agentData = {
      slug: agentSlug,
      firstName: agent.firstName,
      lastName: agent.lastName,
      fullName: `${agent.firstName} ${agent.lastName}`,
      email: agent.email,
      phone: agent.phone,
      mobilePhone: agent.mobilePhone,
      photoUrl: agent.photoUrl,
      licenseNumber: agent.licenseNumber,
      licenseStatus: agent.licenseStatus,
      licenseState: agent.licenseState,
      agencyId,
      bio: agent.bio,
      yearsActive: agent.yearsActive,
      languagesSpoken: JSON.stringify(agent.languagesSpoken),
      specializations: JSON.stringify(agent.specializations),
      suburbsServiced: JSON.stringify(agent.suburbsServiced),
      dataQualityScore: 85,
    };

    const existing = await db.select().from(agents).where(eq(agents.slug, agentSlug)).limit(1);

    let agentId: number;
    if (existing.length > 0) {
      console.log(`  Updating: ${agent.firstName} ${agent.lastName}`);
      await db.update(agents).set({ ...agentData, updatedAt: new Date() }).where(eq(agents.slug, agentSlug));
      agentId = existing[0].id;
    } else {
      console.log(`  Creating: ${agent.firstName} ${agent.lastName}`);
      const [inserted] = await db.insert(agents).values(agentData).returning();
      agentId = inserted.id;
    }

    // Link to suburbs
    await db.delete(agentSuburbs).where(eq(agentSuburbs.agentId, agentId));
    for (let i = 0; i < agent.suburbsServiced.length; i++) {
      const suburbId = await findSuburbId(agent.suburbsServiced[i]);
      if (suburbId) {
        await db.insert(agentSuburbs).values({
          agentId,
          suburbId,
          isPrimary: i === 0,
        });
      }
    }
  }
}

async function seedSales() {
  console.log('\nSeeding sales...');

  // Build agent ID map
  const agentMap = new Map<string, { id: number; agencyId: number | null }>();
  const allAgents = await db.select().from(agents);
  for (const agent of allAgents) {
    agentMap.set(agent.slug, { id: agent.id, agencyId: agent.agencyId });
  }

  for (const sale of sampleSales) {
    const agentInfo = agentMap.get(sale.agentSlug);
    if (!agentInfo) {
      console.log(`  Skipping sale at ${sale.propertyAddress} - agent not found`);
      continue;
    }

    // Check for existing
    const existing = await db
      .select()
      .from(sales)
      .where(sql`${sales.agentId} = ${agentInfo.id} AND LOWER(${sales.propertyAddress}) = LOWER(${sale.propertyAddress})`)
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Exists: ${sale.propertyAddress}`);
      continue;
    }

    console.log(`  Creating: ${sale.propertyAddress}`);
    await db.insert(sales).values({
      agentId: agentInfo.id,
      agencyId: agentInfo.agencyId,
      propertyAddress: sale.propertyAddress,
      suburb: sale.suburb,
      state: sale.state,
      postcode: sale.postcode,
      propertyType: sale.propertyType,
      salePrice: sale.salePrice,
      saleMethod: sale.saleMethod,
      saleDate: sale.saleDate,
      bedrooms: sale.bedrooms,
      bathrooms: sale.bathrooms,
      carSpaces: sale.carSpaces,
      daysOnMarket: sale.daysOnMarket,
    });
  }
}

async function seedReviews() {
  console.log('\nSeeding reviews...');

  // Build agent ID map
  const agentMap = new Map<string, number>();
  const allAgents = await db.select().from(agents);
  for (const agent of allAgents) {
    agentMap.set(agent.slug, agent.id);
  }

  for (const review of sampleReviews) {
    const agentId = agentMap.get(review.agentSlug);
    if (!agentId) {
      console.log(`  Skipping review - agent not found`);
      continue;
    }

    console.log(`  Creating review for ${review.agentSlug}`);
    await db.insert(reviews).values({
      agentId,
      reviewerName: review.reviewerName,
      reviewDate: review.reviewDate,
      reviewerType: review.reviewerType,
      overallRating: review.overallRating,
      knowledgeRating: review.knowledgeRating,
      communicationRating: review.communicationRating,
      negotiationRating: review.negotiationRating,
      reviewText: review.reviewText,
      sourcePlatform: review.sourcePlatform,
    });
  }
}

async function updateAgentStats() {
  console.log('\nUpdating agent statistics...');

  const allAgents = await db.select().from(agents);

  for (const agent of allAgents) {
    // Get sales stats
    const agentSales = await db.select().from(sales).where(eq(sales.agentId, agent.id));
    const totalSalesCount = agentSales.length;
    const totalSalesVolume = agentSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
    const salePrices = agentSales.filter(s => s.salePrice).map(s => s.salePrice!).sort((a, b) => a - b);
    const medianSalePrice = salePrices.length > 0
      ? salePrices[Math.floor(salePrices.length / 2)]
      : null;

    // Get review stats
    const agentReviews = await db.select().from(reviews).where(eq(reviews.agentId, agent.id));
    const ratingsCount = agentReviews.length;
    const ratingsAverage = ratingsCount > 0
      ? Math.round((agentReviews.reduce((sum, r) => sum + r.overallRating, 0) / ratingsCount) * 10) / 10
      : null;

    await db.update(agents).set({
      totalSalesCount,
      totalSalesVolume,
      medianSalePrice,
      ratingsCount,
      ratingsAverage,
      updatedAt: new Date(),
    }).where(eq(agents.id, agent.id));

    console.log(`  Updated ${agent.fullName}: ${totalSalesCount} sales, ${ratingsCount} reviews`);
  }
}

async function updateAgencyStats() {
  console.log('\nUpdating agency statistics...');

  const allAgencies = await db.select().from(agencies);

  for (const agency of allAgencies) {
    const agencyAgents = await db.select().from(agents).where(eq(agents.agencyId, agency.id));
    const agencySales = await db.select().from(sales).where(eq(sales.agencyId, agency.id));

    await db.update(agencies).set({
      totalAgents: agencyAgents.length,
      totalSalesCount: agencySales.length,
      totalSalesVolume: agencySales.reduce((sum, s) => sum + (s.salePrice || 0), 0),
      updatedAt: new Date(),
    }).where(eq(agencies.id, agency.id));

    console.log(`  Updated ${agency.name}: ${agencyAgents.length} agents, ${agencySales.length} sales`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('========================================');
  console.log('AgentIndex Sample Data Seeder');
  console.log('========================================');

  await seedAgencies();
  await seedAgents();
  await seedSales();
  await seedReviews();
  await updateAgentStats();
  await updateAgencyStats();

  // Print summary
  const agencyCount = (await db.select().from(agencies)).length;
  const agentCount = (await db.select().from(agents)).length;
  const saleCount = (await db.select().from(sales)).length;
  const reviewCount = (await db.select().from(reviews)).length;

  console.log('\n========================================');
  console.log('Seeding Complete');
  console.log('========================================');
  console.log(`Agencies: ${agencyCount}`);
  console.log(`Agents: ${agentCount}`);
  console.log(`Sales: ${saleCount}`);
  console.log(`Reviews: ${reviewCount}`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
