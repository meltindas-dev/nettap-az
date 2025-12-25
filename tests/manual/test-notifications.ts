/**
 * Manual test script for notification flow
 * Run with: tsx tests/manual/test-notifications.ts
 */

import { LeadService } from '@/services/lead.service';
import { RepositoryContainer } from '@/repositories';
import { LeadSource, LeadStatus } from '@/domain';

async function testNotificationFlow() {
  console.log('🧪 Testing Notification Flow\n');
  console.log('=' .repeat(50));

  const leadService = new LeadService();

  // Reset repositories
  RepositoryContainer.reset();

  // Get test data
  const cityRepo = RepositoryContainer.getCityRepository();
  const districtRepo = RepositoryContainer.getDistrictRepository();
  const tariffRepo = RepositoryContainer.getTariffRepository();
  const ispRepo = RepositoryContainer.getISPRepository();

  const cities = await cityRepo.findAll();
  const districts = await districtRepo.findByCityId(cities[0].id);
  const tariffs = await tariffRepo.findByFilter({});
  const isps = await ispRepo.findAll();

  console.log('\n📍 Test Data:');
  console.log(`  - City: ${cities[0].name}`);
  console.log(`  - District: ${districts[0].name}`);
  console.log(`  - Tariff: ${tariffs[0].name}`);
  console.log(`  - ISP: ${isps[0].name}`);

  // Test 1: Create Lead (triggers SMS + Email)
  console.log('\n\n1️⃣ CREATE LEAD - Testing SMS + Email Notifications');
  console.log('-'.repeat(50));

  const lead = await leadService.createLead({
    fullName: 'Test User',
    phone: '+994501234567',
    email: 'test@example.com',
    cityId: cities[0].id,
    districtId: districts[0].id,
    tariffId: tariffs[0].id,
    source: LeadSource.COMPARISON,
  });

  console.log(`✅ Lead created: ${lead.id}`);
  console.log(`   Status: ${lead.status}`);
  
  // Wait for async notifications to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Assign to ISP (triggers SMS)
  console.log('\n\n2️⃣ ASSIGN TO ISP - Testing SMS Notification');
  console.log('-'.repeat(50));

  const assigned = await leadService.assignLeadToIsp(lead.id, isps[0].id);
  console.log(`✅ Lead assigned to ISP: ${isps[0].name}`);
  console.log(`   Assigned ISP ID: ${assigned.assignedIspId}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Update Status (triggers SMS)
  console.log('\n\n3️⃣ UPDATE STATUS - Testing SMS Notification');
  console.log('-'.repeat(50));

  const contacted = await leadService.updateLeadStatus(lead.id, {
    status: LeadStatus.CONTACTED,
  });
  console.log(`✅ Status updated: ${contacted.status}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  const qualified = await leadService.updateLeadStatus(lead.id, {
    status: LeadStatus.QUALIFIED,
  });
  console.log(`✅ Status updated: ${qualified.status}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  const inProgress = await leadService.updateLeadStatus(lead.id, {
    status: LeadStatus.IN_PROGRESS,
  });
  console.log(`✅ Status updated: ${inProgress.status}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  const converted = await leadService.updateLeadStatus(lead.id, {
    status: LeadStatus.CONVERTED,
  });
  console.log(`✅ Status updated: ${converted.status}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n\n' + '='.repeat(50));
  console.log('✨ Notification Flow Test Complete!');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log('  ✓ Lead creation notification (SMS + Email)');
  console.log('  ✓ ISP assignment notification (SMS)');
  console.log('  ✓ Status update notifications (SMS x4)');
  console.log('\n💡 Check the logs above for 📱 SMS and 📧 Email notifications');
}

// Run the test
testNotificationFlow()
  .then(() => {
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
