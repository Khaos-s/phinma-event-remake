// UI fixtures only: hosted authorization is covered separately by the rolled-back SQL tests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const owner = '10000000-0000-4000-8000-000000000001';
const organization = { id: '20000000-0000-4000-8000-000000000001', name: 'CITE Council', department: 'College of Information Technology' };
const poster = await readFile('public/images/phinma-students.jpg');
const original = {
  id: '30000000-0000-4000-8000-000000000001', created_by: owner, organization_id: organization.id, organization,
  title: 'Fixture: CITE campus workshop', description: 'Private browser fixture for revision checks.',
  image_path: `${owner}/original.jpg`, starts_at: '2026-12-31T18:30:00Z', ends_at: '2026-12-31T19:30:00Z',
  department: organization.department, course: 'BSIT', target_year: 2, status: 'rejected',
  rejection_reason: 'Please clarify the workshop schedule.', created_at: '2026-10-26T00:00:00Z',
};

async function fixture(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'browser-fixture@example.invalid' };
  const payload = Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const session = { access_token: `e30.${payload}.fixture`, refresh_token: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user };
  await context.addCookies([{ name: 'sb-ulymtioaxraqvoqongrj-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, url: base }]);
  const calls = [];
  let workspaceReads = 0;
  let failRefresh = Boolean(options.failRefresh);
  let rows = [structuredClone(original), { ...original, id: '30000000-0000-4000-8000-000000000002', title: 'Fixture: Published event', status: 'approved', rejection_reason: null }, { ...original, id: '30000000-0000-4000-8000-000000000003', title: 'Fixture: Pending event', status: 'pending', rejection_reason: null }];
  await context.addInitScript(() => {
    window.posterUrls = { created: [], revoked: [] };
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = value => { const url = create(value); window.posterUrls.created.push(url); return url; };
    URL.revokeObjectURL = value => { window.posterUrls.revoked.push(value); revoke(value); };
  });
  await context.route('https://*.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    if (path === '/auth/v1/user') return json(user);
    if (path === '/rest/v1/role_assignments') return json(options.role === 'member' ? null : { role: options.role || 'cite_organizer', organization_id: options.role === 'event_admin' ? null : organization.id });
    if (path === '/rest/v1/organizations') return json(organization);
    if (path === '/rest/v1/rpc/workspace_events') {
      workspaceReads++;
      if (failRefresh && workspaceReads > 1) { failRefresh = false; return json({ message: 'Fixture: refresh unavailable', code: '' }, 503); }
      return json(rows);
    }
    if (path === '/rest/v1/rpc/resubmit_event') {
      const data = request.postDataJSON(); calls.push({ action: 'resubmit', data });
      if (options.failSave) return json({ message: 'Fixture: event is no longer rejected', code: '42501' }, 403);
      rows[0] = { ...rows[0], title: data.revised_title, image_path: data.revised_image_path, status: 'pending', rejection_reason: null };
      if (options.uncertainSave) return json({ message: 'Fixture: gateway timeout', code: '' }, 504);
      return route.fulfill({ status: 204 });
    }
    if (path === '/rest/v1/events' && request.method() === 'POST') {
      const data = request.postDataJSON(); calls.push({ action: 'insert', data });
      rows.push({ ...original, ...data, id: '30000000-0000-4000-8000-000000000004', status: 'pending', rejection_reason: null });
      return route.fulfill({ status: 201 });
    }
    if (path.startsWith('/storage/v1/object/sign/') && request.method() === 'POST') return json({ signedURL: `/object/sign/event-images/${owner}/fixture.jpg?token=fixture` });
    if (path.startsWith('/storage/v1/object/sign/')) return route.fulfill({ contentType: 'image/jpeg', body: poster });
    if (path === '/storage/v1/object/event-images' && request.method() === 'DELETE') {
      calls.push({ action: 'remove', paths: request.postDataJSON().prefixes });
      return options.failCleanup ? json({ message: 'Fixture: cleanup unavailable' }, 500) : json([]);
    }
    if (path.startsWith('/storage/v1/object/event-images/') && request.method() === 'POST') {
      calls.push({ action: 'upload', path: decodeURIComponent(path.split('/event-images/')[1]) });
      return json({ Key: path.split('/object/')[1] });
    }
    throw new Error(`Unexpected fixture request: ${request.method()} ${path}`);
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}${options.role === 'event_admin' ? '/admin' : options.role === 'member' ? '/account' : '/organizer'}`);
  if (options.role) await page.getByRole('heading', { name: options.role === 'event_admin' ? 'Manage events' : 'University profile', exact: true }).waitFor();
  else await page.getByRole('button', { name: 'Edit and resubmit' }).waitFor();
  return { page, context, calls, errors };
}

async function edit(page) {
  await page.getByRole('button', { name: 'Edit and resubmit' }).click();
  assert.equal(await page.locator('#title').inputValue(), original.title);
  assert.equal(await page.locator('#starts_at').inputValue(), '2027-01-01T02:30');
  assert.equal(await page.locator('#ends_at').inputValue(), '2027-01-01T03:30');
  assert.equal(await page.locator('#target_year').inputValue(), '2');
  assert.equal(await page.locator('#image').getAttribute('required'), null);
  await page.locator('#title').fill('Fixture: Revised workshop');
}

async function preview(page, calls) {
  const writes = calls.length;
  await page.getByRole('button', { name: 'Next: preview event', exact: true }).click();
  await page.getByRole('region', { name: 'Private event preview', exact: true }).waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'editor-title');
  assert.equal(await page.locator('.revision-form').isVisible(), false);
  assert.equal(await page.getByRole('heading', { name: 'Preview your event', exact: true }).evaluate(element => element === document.activeElement), true);
  assert.equal(calls.length, writes, 'Advancing to preview must not upload or write');
}

(async () => {
  await mkdir('.taste-skill/qa', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const options of [{}, { replacement: true }, { replacement: true, failSave: true }, { replacement: true, uncertainSave: true }, { replacement: true, uncertainSave: true, failRefresh: true }, { replacement: true, failCleanup: true }]) {
      const { page, context, calls, errors } = await fixture(browser, options);
      assert.equal(await page.getByRole('button', { name: 'Edit and resubmit' }).count(), 1);
      await page.getByText('Published · editing is locked', { exact: true }).waitFor();
      await edit(page);
      if (options.replacement) {
        await page.locator('#image').setInputFiles({ name: 'replacement.jpg', mimeType: 'image/jpeg', buffer: poster });
        await page.getByAltText('Selected event poster preview').waitFor();
      }
      assert.equal(await page.getByRole('button', { name: 'Resubmit for review', exact: true }).count(), 0, 'Details cannot submit directly');
      await preview(page, calls);
      await page.getByRole('button', { name: 'Resubmit for review' }).click();
      if (options.failSave || options.uncertainSave) {
        await page.getByRole('alert').filter({ hasText: options.failSave ? 'event is no longer rejected' : 'submission result could not be confirmed' }).waitFor();
        assert.deepEqual(calls.map(call => call.action), options.failSave ? ['upload', 'resubmit', 'remove'] : ['upload', 'resubmit']);
        if (options.failSave) assert.deepEqual(calls[2].paths, [calls[0].path]);
        assert.equal(await page.locator('#title').inputValue(), 'Fixture: Revised workshop');
        assert.equal(await page.getByRole('region', { name: 'Private event preview', exact: true }).isVisible(), true);
        assert.equal(await page.getByRole('button', { name: 'Back to details', exact: true }).isEnabled(), true);
        const writes = calls.length;
        await page.getByRole('button', { name: 'Back to details', exact: true }).click();
        assert.equal(await page.locator('#image').evaluate(input => input.files[0].name), 'replacement.jpg');
        await preview(page, calls);
        assert.equal(calls.length, writes, 'Returning to preview after an error must not retry the save');
        if (options.uncertainSave) {
          await page.getByRole('button', { name: 'Refresh submissions' }).click();
          if (options.failRefresh) {
            await page.getByRole('alert').filter({ hasText: 'Your submissions could not be loaded' }).waitFor();
            assert.equal(await page.getByRole('region', { name: 'Private event preview', exact: true }).isVisible(), true);
            assert.equal(await page.locator('#title').inputValue(), 'Fixture: Revised workshop');
            assert.equal(await page.locator('#image').evaluate(input => input.files[0].name), 'replacement.jpg');
            await page.getByRole('button', { name: 'Refresh submissions' }).click();
          }
          const refreshedRow = page.locator('.organizer-submission-row').filter({ hasText: 'Fixture: Revised workshop' });
          await refreshedRow.getByText('Pending administrator review · private until approved', { exact: true }).waitFor();
          assert.equal(await page.locator('.organizer-submissions').isVisible(), true);
          assert.equal(await page.getByRole('region', { name: 'Private event preview', exact: true }).isVisible(), true);
          assert.equal(await page.locator('#title').inputValue(), 'Fixture: Revised workshop');
          assert.equal(await page.locator('#image').evaluate(input => input.files[0].name), 'replacement.jpg');
          assert.equal(await page.evaluate(() => window.posterUrls.revoked.length), 0);
          await page.waitForFunction(() => document.activeElement?.id === 'submissions-title');
          assert.equal(await page.locator('#submissions-title').evaluate(element => element === document.activeElement), true);
          assert.equal(calls.length, writes, 'Refreshing history must not retry or discard the draft');
          await page.getByRole('button', { name: 'Cancel revision' }).click();
          await page.locator('.organizer-submissions').getByRole('heading', { name: 'Fixture: Revised workshop' }).waitFor();
          assert.equal(await page.getByRole('button', { name: 'Edit and resubmit' }).count(), 0);
        }
      } else {
        await page.getByRole('status').filter({ hasText: 'Resubmitted — pending administrator review' }).waitFor();
        await page.getByRole('heading', { name: 'Fixture: Revised workshop' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Edit and resubmit' }).count(), 0);
        if (options.replacement) {
          assert.deepEqual(calls.map(call => call.action), ['upload', 'resubmit', 'remove']);
          assert.deepEqual(calls[2].paths, [original.image_path]);
          assert.notEqual(calls[1].data.revised_image_path, original.image_path);
          assert.equal(await page.evaluate(() => window.posterUrls.revoked.length), 1);
        } else {
          assert.deepEqual(calls.map(call => call.action), ['resubmit']);
          assert.equal(calls[0].data.revised_image_path, original.image_path);
        }
        if (options.failCleanup) await page.getByRole('alert').filter({ hasText: 'Your revision was submitted' }).waitFor();
      }
      const save = calls.find(call => call.action === 'resubmit').data;
      assert.equal(save.revised_starts_at, '2026-12-31T18:30:00.000Z');
      assert.equal(save.revised_target_year, 2);
      assert.deepEqual(errors, []);
      console.log('PASS organizer fixture:', JSON.stringify(options));
      await context.close();
    }
    const { page, context, calls } = await fixture(browser);
    await edit(page);
    await page.locator('#image').setInputFiles({ name: 'replacement.jpg', mimeType: 'image/jpeg', buffer: poster });
    await page.getByRole('button', { name: 'Cancel revision' }).click();
    assert.equal(await page.locator('#title').count(), 0);
    assert.equal(await page.evaluate(() => window.posterUrls.revoked.length), 1);
    assert.equal(calls.length, 0);
    await edit(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await page.locator('main#main-content').evaluate(element => getComputedStyle(element).animationName), 'page-enter');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Organizer overflows at ${width}`);
      assert.equal(await page.locator('.revision-form').evaluate(form => [...form.querySelectorAll('input, select, textarea')].every(control => control.getBoundingClientRect().right <= form.getBoundingClientRect().right + 1)), true, `Form controls overflow their panel at ${width}`);
      await page.screenshot({ path: `.taste-skill/qa/organizer-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog', { name: 'Workspace navigation' }).waitFor();
    const navigation = page.getByRole('navigation', { name: 'Workspace navigation', exact: true });
    assert.equal(await navigation.getByRole('link', { name: 'My events', exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(await navigation.getByRole('link', { name: 'Browse events', exact: true }).getAttribute('href'), '/events');
    await page.getByRole('button', { name: 'Sign out', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.taste-skill/qa/workspace-navigation-mobile.png' });
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.getByRole('button', { name: 'Open navigation' }).evaluate(element => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.page-heading')).animationName), 'none');
    await context.close();
    console.log('PASS cancellation, object URL cleanup, desktop/tablet/phone layout, navigation and reduced motion');
    const creation = await fixture(browser);
    await creation.page.getByRole('button', { name: 'Create event', exact: true }).click();
    await creation.page.locator('#title').fill('Fixture: New event');
    await creation.page.locator('#description').fill('Browser fixture for the existing submission path.');
    await creation.page.locator('#starts_at').fill('2027-01-01T09:00');
    await creation.page.locator('#ends_at').fill('2027-01-01T10:00');
    await creation.page.getByRole('button', { name: 'Next: preview event', exact: true }).click();
    assert.equal(await creation.page.locator('.organizer-confirm-step').count(), 0, 'Creation needs a poster before preview');
    assert.equal(creation.calls.length, 0);
    await creation.page.locator('#image').setInputFiles({ name: 'new.jpg', mimeType: 'image/jpeg', buffer: poster });
    const creationPoster = await creation.page.getByAltText('Selected event poster preview').getAttribute('src');
    await creation.page.locator('#title').press('Enter');
    await creation.page.getByRole('region', { name: 'Private event preview', exact: true }).waitFor();
    assert.equal(creation.calls.length, 0, 'Enter in the details form may only advance to preview');
    await creation.page.getByRole('button', { name: 'Back to details', exact: true }).click();
    assert.equal(await creation.page.locator('#title').inputValue(), 'Fixture: New event');
    assert.equal(await creation.page.locator('#image').evaluate(input => input.files[0].name), 'new.jpg');
    assert.equal(await creation.page.getByAltText('Selected event poster preview').getAttribute('src'), creationPoster);
    assert.equal(await creation.page.evaluate(() => window.posterUrls.revoked.length), 0);
    await preview(creation.page, creation.calls);
    await creation.page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
    await creation.page.getByRole('status').filter({ hasText: 'Submitted — pending administrator review' }).waitFor();
    assert.deepEqual(creation.calls.map(call => call.action), ['upload', 'insert']);
    assert.equal(creation.calls[1].data.organization_id, organization.id);
    assert.equal(creation.calls[1].data.created_by, owner);
    await creation.context.close();
    for (const role of ['event_admin', 'member']) {
      const workspace = await fixture(browser, { role });
      for (const width of [1440, 390]) {
        await workspace.page.setViewportSize({ width, height: 900 });
        assert.equal(await workspace.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${role} overflows at ${width}`);
        await workspace.page.screenshot({ path: `.taste-skill/qa/${role}-refresh-${width}.png`, fullPage: true });
      }
      assert.deepEqual(workspace.errors, []);
      await workspace.context.close();
    }
    console.log('PASS existing event creation and administrator/member desktop/phone layouts');
    const previewWorkspace = await fixture(browser);
    const previewPage = previewWorkspace.page;
    assert.equal(await previewPage.getByRole('link', { name: 'My events', exact: true }).count(), 1);
    assert.equal(await previewPage.getByRole('link', { name: 'My submissions', exact: true }).count(), 0);
    assert.equal(await previewPage.locator('#title').count(), 0);
    const statusFilters = previewPage.getByRole('group', { name: 'My event status' });
    for (const status of ['Pending', 'Published', 'Rejected']) {
      await statusFilters.getByRole('button', { name: status, exact: true }).click();
      assert.equal(await previewPage.locator('.organizer-submission-row').count(), 1);
      assert.equal(await previewPage.getByRole('button', { name: 'Edit and resubmit' }).count(), status === 'Rejected' ? 1 : 0);
    }
    await statusFilters.getByRole('button', { name: 'All', exact: true }).click();
    const previewTrigger = previewPage.locator('.organizer-submission-row').first().getByRole('button', { name: 'Preview event', exact: true });
    await previewTrigger.click();
    const boardPreview = previewPage.getByRole('dialog', { name: 'Event board preview' });
    await boardPreview.waitFor();
    assert.equal((await boardPreview.innerText()).includes(original.rejection_reason), false);
    assert.equal(await boardPreview.locator('.event-card .status-upcoming').count(), 1);
    assert.equal(await boardPreview.locator('.event-image').evaluate(element => getComputedStyle(element).aspectRatio), '4 / 3');
    assert.equal(await boardPreview.locator('.event-image img').evaluate(element => getComputedStyle(element).objectFit), 'contain');
    assert.equal(await boardPreview.getByRole('link', { name: 'View published event' }).count(), 0);
    await boardPreview.getByRole('button', { name: 'Close board preview' }).focus();
    await previewPage.keyboard.press('Shift+Tab');
    assert.equal(await boardPreview.getByRole('button', { name: 'Back to workspace' }).evaluate(element => element === document.activeElement), true);
    await previewPage.keyboard.press('Tab');
    assert.equal(await boardPreview.getByRole('button', { name: 'Close board preview' }).evaluate(element => element === document.activeElement), true);
    await boardPreview.getByRole('button', { name: `Preview ${original.title}` }).click();
    assert.equal(await boardPreview.getByRole('button', { name: 'Event details', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await boardPreview.getByRole('button', { name: 'Share', exact: true }).count(), 0);
    assert.equal(await boardPreview.getByRole('button', { name: 'Add to calendar', exact: true }).count(), 0);
    await boardPreview.getByRole('button', { name: `View full poster for ${original.title}` }).click();
    await previewPage.locator('dialog.poster-lightbox[open]').waitFor();
    await previewPage.keyboard.press('Escape');
    assert.equal(await boardPreview.evaluate(dialog => dialog.open), true);
    await previewPage.keyboard.press('Escape');
    assert.equal(await previewTrigger.evaluate(element => element === document.activeElement), true);
    assert.equal(await previewPage.evaluate(() => document.body.style.overflow), '');
    await edit(previewPage);
    await previewPage.locator('#description').fill('A revised description used only in this private preview.');
    await previewPage.locator('#image').setInputFiles({ name: 'preview-only.jpg', mimeType: 'image/jpeg', buffer: poster });
    const localPoster = await previewPage.getByAltText('Selected event poster preview').getAttribute('src');
    assert.match(localPoster, /^blob:/);
    for (const theme of ['light', 'dark']) {
      await previewPage.emulateMedia({ colorScheme: theme });
      for (const width of [1440, 960, 390, 320]) {
        await previewPage.setViewportSize({ width, height: 1000 });
        assert.equal(await previewPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Editor ${theme} overflow ${width}`);
        if (width !== 960) await previewPage.evaluate(() => window.scrollTo(0, 0));
        await previewPage.screenshot({ path: `.taste-skill/qa/organizer-editor-${theme}-${width}.png`, fullPage: true });
      }
    }
    await previewPage.setViewportSize({ width: 1280, height: 1000 });
    await previewPage.locator('#ends_at').fill('2027-01-01T01:00');
    await previewPage.getByRole('button', { name: 'Next: preview event', exact: true }).click();
    await previewPage.getByRole('alert').filter({ hasText: 'valid end time after the start time' }).waitFor();
    assert.equal(await previewPage.locator('.organizer-confirm-step').count(), 0);
    assert.equal(previewWorkspace.calls.length, 0);
    await previewPage.locator('#ends_at').fill('2027-01-01T03:30');
    await preview(previewPage, previewWorkspace.calls);
    const fullPreview = previewPage.getByRole('region', { name: 'Private event preview', exact: true });
    await fullPreview.getByRole('heading', { name: 'Fixture: Revised workshop' }).waitFor();
    assert.equal((await fullPreview.innerText()).includes(original.rejection_reason), false);
    assert.equal(await fullPreview.locator('.status-rejected, .status-approved').count(), 0);
    assert.equal(await fullPreview.getByRole('button', { name: 'Share', exact: true }).count(), 0);
    assert.equal(await fullPreview.getByRole('button', { name: 'Add to calendar', exact: true }).count(), 0);
    assert.equal(await fullPreview.locator('.poster-open img').getAttribute('src'), localPoster);
    assert.equal(new URL(previewPage.url()).pathname, '/organizer');
    assert.equal(new URL(previewPage.url()).search, '');
    await fullPreview.getByRole('button', { name: 'View full poster for Fixture: Revised workshop' }).click();
    await previewPage.locator('dialog.poster-lightbox[open]').waitFor();
    await previewPage.keyboard.press('Escape');
    assert.equal(await fullPreview.isVisible(), true);
    await previewPage.getByRole('button', { name: 'Refresh submissions', exact: true }).click();
    await previewPage.locator('.organizer-submission-row').filter({ hasText: 'Fixture: Published event' }).getByRole('button', { name: 'Preview event', exact: true }).click();
    const historyPreview = previewPage.getByRole('dialog', { name: 'Event board preview', exact: true });
    await historyPreview.getByRole('button', { name: 'Event details', exact: true }).click();
    const posterLabels = await previewPage.locator('dialog.poster-lightbox').evaluateAll(dialogs => dialogs.map(dialog => dialog.getAttribute('aria-labelledby')));
    assert.equal(new Set(posterLabels).size, posterLabels.length, 'Coexisting draft/history posters need distinct dialog labels');
    await historyPreview.getByRole('button', { name: 'View full poster for Fixture: Published event', exact: true }).click();
    await previewPage.getByRole('dialog', { name: 'Fixture: Published event — poster', exact: true }).waitFor();
    await previewPage.keyboard.press('Escape');
    assert.equal(await historyPreview.isVisible(), true);
    await historyPreview.getByRole('button', { name: 'Close board preview', exact: true }).click();
    assert.equal(await fullPreview.isVisible(), true);
    for (const width of [1280, 390]) {
      await previewPage.setViewportSize({ width, height: 1000 });
      assert.equal(await previewPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await previewPage.evaluate(() => window.scrollTo(0, 0));
      await previewPage.screenshot({ path: `.taste-skill/qa/organizer-confirm-preview-${width}.png`, fullPage: true });
    }
    await previewPage.getByRole('button', { name: 'Back to details', exact: true }).click();
    assert.equal(await previewPage.locator('#title').inputValue(), 'Fixture: Revised workshop');
    assert.equal(await previewPage.locator('#description').inputValue(), 'A revised description used only in this private preview.');
    assert.equal(await previewPage.locator('#image').evaluate(input => input.files[0].name), 'preview-only.jpg');
    assert.equal(await previewPage.getByAltText('Selected event poster preview').getAttribute('src'), localPoster);
    assert.equal(await previewPage.evaluate(() => window.posterUrls.revoked.length), 0);
    await preview(previewPage, previewWorkspace.calls);
    // Revalidate even a form altered while its details screen is hidden.
    await previewPage.locator('#title').evaluate(input => { input.value = ''; });
    await previewPage.getByRole('button', { name: 'Resubmit for review', exact: true }).click();
    await previewPage.getByRole('alert').filter({ hasText: 'event name of 1–200 characters' }).waitFor();
    assert.equal(await previewPage.locator('.revision-form').isVisible(), true);
    assert.equal(previewWorkspace.calls.length, 0);
    await previewPage.locator('#title').fill('Fixture: Revised workshop');
    await preview(previewPage, previewWorkspace.calls);
    await previewPage.getByRole('button', { name: 'Cancel revision' }).click();
    assert.equal(await previewPage.locator('#title').count(), 0);
    assert.equal(await previewPage.evaluate(url => window.posterUrls.revoked.includes(url), localPoster), true);
    assert.equal(await previewPage.evaluate(() => window.posterUrls.revoked.length), 1);
    assert.equal(previewWorkspace.calls.length, 0, 'Preview must not upload or publish');
    for (const theme of ['light', 'dark']) {
      await previewPage.emulateMedia({ colorScheme: theme });
      for (const width of [1440, 390, 320]) {
        await previewPage.setViewportSize({ width, height: 1000 });
        assert.equal(await previewPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `My events ${theme} overflow ${width}`);
        await previewPage.evaluate(() => window.scrollTo(0, 0));
        await previewPage.screenshot({ path: `.taste-skill/qa/organizer-list-${theme}-${width}.png`, fullPage: true });
      }
    }
    await previewPage.getByRole('button', { name: 'Create event', exact: true }).click();
    assert.equal(await previewPage.locator('#title').inputValue(), '');
    assert.equal(await previewPage.locator('.organizer-confirm-step').count(), 0);
    await previewPage.getByRole('button', { name: 'Cancel creation' }).click();
    assert.deepEqual(previewWorkspace.errors, []);
    await previewWorkspace.context.close();
    console.log('PASS unified organizer navigation, status filters, saved card/details modal, two-step private preview, Back/file retention, final revalidation, no preview writes, focus, cancellation and light/dark layouts');
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    for (const route of ['/', '/events', '/login']) {
      await publicPage.goto(`${base}${route}`);
      if (route !== '/login') await publicPage.locator('.event-result-count').filter({ hasNotText: 'Loading' }).waitFor();
      for (const width of [1440, 768, 390, 320]) {
        await publicPage.setViewportSize({ width, height: 900 });
        await publicPage.evaluate(() => window.scrollTo(0, 0));
        assert.equal(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} overflows at ${width}`);
        await publicPage.screenshot({ path: `.taste-skill/qa/${route === '/' ? 'home' : route.slice(1)}-${width}.png`, fullPage: true });
      }
      if (route === '/events') {
        const toggle = publicPage.getByRole('button', { name: 'Show filters' });
        await toggle.click();
        await publicPage.locator('#year-filter').selectOption('2');
        await publicPage.getByRole('button', { name: 'Hide filters' }).click();
        await publicPage.getByRole('button', { name: 'Show filters' }).click();
        assert.equal(await publicPage.locator('#year-filter').inputValue(), '2');
      }
    }
    await publicContext.close();
    console.log('PASS real public home/directory/login at four widths and phone filter persistence');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
