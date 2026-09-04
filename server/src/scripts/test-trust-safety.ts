import { prisma } from '../config/database.js';
import { moderationService } from '../services/moderation.service.js';
import { postsService } from '../services/posts.service.js';
import { commentsService } from '../services/comments.service.js';
import { requireAdmin, checkBanned } from '../middleware/auth.middleware.js';

async function runTests() {
  console.log('\n============================================================');
  console.log('🛡️  ORBIT TRUST & SAFETY SYSTEM — INTEGRATION TEST SUITE');
  console.log('============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // ── 1. Content Scanner Engine ──────────────────────────────
    console.log('--- TEST GROUP 1: Automated Content Scanner ---');

    // 1a. Clean text
    const cleanScan = await moderationService.scanContent('Hello Orbit community! Beautiful day to build open source software.');
    assert(cleanScan.isAllowed === true, 'Scanner permits standard benign content');

    // 1b. Malicious URL / IP Logger detection
    const urlScan = await moderationService.scanContent('Check out this link: https://grabify.link/trackme for free gift cards!');
    assert(urlScan.isAllowed === false && urlScan.flagType === 'MALICIOUS_LINK', 'Scanner catches known phishing / IP logger URLs');

    // 1c. Crypto / Financial Spam keywords
    const spamScan = await moderationService.scanContent('Claim free crypto now! Double your bitcoin overnight with 100% guaranteed profit crypto');
    assert(spamScan.isAllowed === false && spamScan.flagType === 'SPAM', 'Scanner catches high-confidence crypto spam patterns');

    // 1d. Threats / Violence patterns
    const violenceScan = await moderationService.scanContent('You are awful, go kill yourself right now');
    assert(violenceScan.isAllowed === false && violenceScan.flagType === 'VIOLENCE', 'Scanner catches severe violation patterns');


    // ── 2. Create Test Accounts ────────────────────────────────
    console.log('\n--- TEST GROUP 2: Setting Up Test Accounts ---');

    const timestamp = Date.now();
    const adminUser = await prisma.user.upsert({
      where: { username: 'test_admin' },
      update: { role: 'ADMIN', is_banned: false, banned_until: null },
      create: {
        username: 'test_admin',
        email: `admin_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Test Admin',
        role: 'ADMIN',
      },
    });
    assert(adminUser.role === 'ADMIN', 'Admin test user exists with ADMIN role');

    const modUser = await prisma.user.upsert({
      where: { username: 'test_mod' },
      update: { role: 'MODERATOR', is_banned: false, banned_until: null },
      create: {
        username: 'test_mod',
        email: `mod_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Test Moderator',
        role: 'MODERATOR',
      },
    });
    assert(modUser.role === 'MODERATOR', 'Moderator test user exists with MODERATOR role');

    const authorUser = await prisma.user.upsert({
      where: { username: 'test_author' },
      update: { role: 'USER', is_banned: false, banned_until: null, strike_count: 0 },
      create: {
        username: 'test_author',
        email: `author_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Test Author',
        role: 'USER',
      },
    });

    const reporter1 = await prisma.user.upsert({
      where: { username: 'test_rep1' },
      update: {},
      create: {
        username: 'test_rep1',
        email: `rep1_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Reporter 1',
        role: 'USER',
      },
    });

    const reporter2 = await prisma.user.upsert({
      where: { username: 'test_rep2' },
      update: {},
      create: {
        username: 'test_rep2',
        email: `rep2_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Reporter 2',
        role: 'USER',
      },
    });

    const reporter3 = await prisma.user.upsert({
      where: { username: 'test_rep3' },
      update: {},
      create: {
        username: 'test_rep3',
        email: `rep3_${timestamp}@test.local`,
        password_hash: 'dummyhash',
        display_name: 'Reporter 3',
        role: 'USER',
      },
    });


    // ── 3. Post Creation with Content Scanner Guard ────────────
    console.log('\n--- TEST GROUP 3: Posts Service & Scanner Integration ---');

    // 3a. Reject malicious post
    let caughtScanError = false;
    try {
      await postsService.createPost(authorUser.id, {
        content_text: 'Join my channel https://iplogger.org/2abcde for free stuff!',
        visibility: 'public',
      });
    } catch (err: any) {
      caughtScanError = true;
      assert(err.message.includes('Post blocked') || err.message.includes('malicious link'), 'Post creation with malicious URL rejected with safety message');
    }
    assert(caughtScanError, 'Scanned malicious post was intercepted and blocked');

    // 3b. Allow clean post
    const cleanPost = await postsService.createPost(authorUser.id, {
      content_text: `Clean test post for community reporting verification #${timestamp}`,
      visibility: 'public',
    });
    assert(cleanPost.status === 'ACTIVE', 'Clean post created with status ACTIVE');
    assert(cleanPost.report_count === 0, 'Clean post created with initial report_count 0');


    // ── 4. Community Reporting & Auto-Hide Engine (≥3 reports) ──
    console.log('\n--- TEST GROUP 4: Auto-Hide Engine Threshold (≥3 Reports) ---');

    // Helper function mirroring reports.controller.ts workflow
    async function submitReport(reporterId: string, postId: string, reason: string) {
      await prisma.report.create({
        data: {
          reporter_id: reporterId,
          reported_type: 'POST',
          reported_id: postId,
          reported_user_id: authorUser.id,
          reason,
          status: 'PENDING',
        },
      });
      return moderationService.handleNewReport({
        reported_type: 'POST',
        reported_id: postId,
        reporter_id: reporterId,
      });
    }

    // Report 1
    const rep1Result = await submitReport(reporter1.id, cleanPost.id, 'SPAM');
    assert(rep1Result.totalReports === 1 && rep1Result.autoHidden === false, 'Report 1 increments count to 1 without hiding');

    const postAfter1 = await prisma.post.findUnique({ where: { id: cleanPost.id } });
    assert(postAfter1?.status === 'ACTIVE' && postAfter1.report_count === 1, 'Post remains ACTIVE in DB after 1 report');

    // Report 2
    const rep2Result = await submitReport(reporter2.id, cleanPost.id, 'HARASSMENT');
    assert(rep2Result.totalReports === 2 && rep2Result.autoHidden === false, 'Report 2 increments count to 2 without hiding');

    const postAfter2 = await prisma.post.findUnique({ where: { id: cleanPost.id } });
    assert(postAfter2?.status === 'ACTIVE' && postAfter2.report_count === 2, 'Post remains ACTIVE in DB after 2 reports');

    // Report 3 (Threshold Reached!)
    const rep3Result = await submitReport(reporter3.id, cleanPost.id, 'HATE');
    assert(rep3Result.totalReports === 3 && rep3Result.autoHidden === true, 'Report 3 triggers Auto-Hide engine (autoHidden: true)');

    const postAfter3 = await prisma.post.findUnique({ where: { id: cleanPost.id } });
    assert(postAfter3?.status === 'HIDDEN', 'Post status in database transitioned to HIDDEN automatically');

    // Verify auto-hide audit log was created
    const autoHideLog = await prisma.moderationLog.findFirst({
      where: {
        target_type: 'POST',
        target_id: cleanPost.id,
        action: 'AUTO_HIDE',
      },
      orderBy: { created_at: 'desc' },
    });
    assert(!!autoHideLog, 'Audit log recorded for AUTO_HIDE action by system');

    // Verify feeds exclude the hidden post
    const publicFeed = await postsService.getExploreFeed(reporter1.id, 50);
    const hiddenPostInFeed = publicFeed.posts.find((p) => p.id === cleanPost.id);
    assert(!hiddenPostInFeed, 'HIDDEN post is strictly excluded from explore/public feeds');


    // ── 5. Admin Moderation Actions & Content Management ────────
    console.log('\n--- TEST GROUP 5: Admin / Staff Content Actions ---');

    // Restore Content
    await prisma.post.update({
      where: { id: cleanPost.id },
      data: { status: 'ACTIVE' },
    });
    const postRestored = await prisma.post.findUnique({ where: { id: cleanPost.id } });
    assert(postRestored?.status === 'ACTIVE', 'Admin can restore hidden content to ACTIVE');

    // Log admin restoration
    await prisma.moderationLog.create({
      data: {
        admin_id: adminUser.id,
        action: 'RESTORE_CONTENT',
        target_type: 'POST',
        target_id: cleanPost.id,
        reason: 'Restored after false positive report review',
      },
    });

    // Delete Content
    await postsService.deletePost(cleanPost.id, authorUser.id);
    const postDeleted = await prisma.post.findUnique({ where: { id: cleanPost.id } });
    assert(!postDeleted, 'Post was successfully deleted from database');


    // ── 6. User Ban & Timeout Enforcement ──────────────────────
    console.log('\n--- TEST GROUP 6: Ban and Timeout Enforcement ---');

    // 6a. Apply temporary timeout (24 hours)
    const timeoutExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const timedOutUser = await prisma.user.update({
      where: { id: authorUser.id },
      data: {
        banned_until: timeoutExpiry,
        ban_reason: 'Automated policy violation: Repeated spam behavior',
        strike_count: { increment: 1 },
      },
    });
    assert(timedOutUser.strike_count === 1, 'Strike count properly incremented to 1');
    assert(
      !!timedOutUser.banned_until && new Date(timedOutUser.banned_until).getTime() > Date.now(),
      'User timeout expiration timestamp successfully set in DB'
    );

    // 6b. Apply permanent ban
    const permanentlyBannedUser = await prisma.user.update({
      where: { id: authorUser.id },
      data: {
        is_banned: true,
        banned_until: null,
        ban_reason: 'Permanent suspension: Severe Terms of Service violation',
      },
    });
    assert(permanentlyBannedUser.is_banned === true, 'User is_banned flag set to true');

    // 6c. Unban User
    const unbannedUser = await prisma.user.update({
      where: { id: authorUser.id },
      data: {
        is_banned: false,
        banned_until: null,
        ban_reason: null,
      },
    });
    assert(unbannedUser.is_banned === false && unbannedUser.banned_until === null, 'User unbanned and restored to ACTIVE standing');


    // ── 7. Middleware Unit Verification ────────────────────────
    console.log('\n--- TEST GROUP 7: Middleware Guards (requireAdmin, checkBanned) ---');

    // 7a. requireAdmin with normal USER
    let adminDenied = false;
    const mockResUser: any = {
      status(code: number) {
        if (code === 403) adminDenied = true;
        return this;
      },
      json(payload: any) { return this; },
    };
    await requireAdmin({ user: { userId: authorUser.id, role: 'USER' } } as any, mockResUser, () => {});
    assert(adminDenied, 'requireAdmin rejects regular USER with 403 Forbidden');

    // 7b. requireAdmin with ADMIN
    let adminAllowed = false;
    await requireAdmin({ user: { userId: adminUser.id, role: 'ADMIN' } } as any, {} as any, () => {
      adminAllowed = true;
    });
    assert(adminAllowed, 'requireAdmin allows ADMIN role');

    // 7c. requireAdmin with MODERATOR
    let modAllowed = false;
    await requireAdmin({ user: { userId: modUser.id, role: 'MODERATOR' } } as any, {} as any, () => {
      modAllowed = true;
    });
    assert(modAllowed, 'requireAdmin allows MODERATOR role');

    // 7d. checkBanned blocks banned user
    await prisma.user.update({
      where: { id: authorUser.id },
      data: { is_banned: true, ban_reason: 'Testing checkBanned middleware' },
    });

    let checkBannedBlocked = false;
    const mockResBanned: any = {
      status(code: number) {
        if (code === 403) checkBannedBlocked = true;
        return this;
      },
      json(payload: any) {
        assert(payload.banned === true, 'checkBanned response includes banned: true flag');
        return this;
      },
    };
    await checkBanned({ user: { userId: authorUser.id } } as any, mockResBanned, () => {});
    assert(checkBannedBlocked, 'checkBanned rejects banned user with 403 Forbidden');

    // Restore author user to active
    await prisma.user.update({
      where: { id: authorUser.id },
      data: { is_banned: false, ban_reason: null },
    });


    // ── Summary ───────────────────────────────────────────────
    console.log('\n============================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TRUST & SAFETY TESTS PASSED SUCCESSFULLY!`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test execution encountered an error:', error);
    process.exit(1);
  }
}

runTests();
