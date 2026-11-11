/**
 * InterviewSurge Ops Control Center
 *
 * Demo dashboard with two views (Overview, Client Queues). All data is
 * generated locally by `seedApplications()`; nothing is sent to a server.
 *
 * Sections
 *   1. Constants & static data
 *   2. State
 *   3. Helpers (formatting, DOM, icons, toasts)
 *   4. Data (seeding + filtering)
 *   5. Views (overview, queues, client panel)
 *   6. Sidebar behaviour
 *   7. Event handling
 *   8. Init
 */
(() => {
  'use strict';

  /* ======================================================================
   * 1. Constants & static data
   * ==================================================================== */

  const PAGE_SIZE = 7;
  const DESKTOP_MIN_WIDTH = 900;
  const TOAST_DURATION_MS = 2800;
  const RECENT_DAY_THRESHOLD = 22; // "Last 3 days" = day index >= 22

  const CLIENTS = [
    { id: 'sk', name: 'Saranya Krishnan', roles: ['Sales Operations Manager', 'Revenue Operations Director'], failed: 2, applied: 1, submitting: 0, pending: 11 },
    { id: 'mc', name: 'Michael Chen', roles: ['Staff Software Engineer', 'Technical Product Manager'], failed: 0, applied: 0, submitting: 1, pending: 5 },
    { id: 'er', name: 'Emily Rodriguez', roles: ['Senior Product Designer', 'Frontend Engineer'], failed: 0, applied: 0, submitting: 1, pending: 4 },
    { id: 'dk', name: 'David Kojo', roles: ['Growth Marketing Lead', 'Marketing Data Analyst'], failed: 0, applied: 0, submitting: 0, pending: 4 },
    { id: 'sa', name: 'Sophia Al-Jamil', roles: ['AI/ML Research Scientist', 'Platform/DevOps Engineer'], failed: 0, applied: 0, submitting: 0, pending: 4 },
  ];

  const COMPANIES = ['Stripe', 'Salesforce', 'Snowflake', 'Datadog', 'GitLab', 'ServiceNow', 'Box', 'Google', 'Amazon', 'Meta', 'Microsoft', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Netflix', 'Apple', 'NVIDIA', 'Atlassian', 'Shopify'];
  const LOCATIONS = ['San Francisco, CA (HQ)', 'Chicago, IL', 'Bozeman, MT', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Redwood City, CA'];
  const TAGS = ['Series B+ Growth', 'Cross-functional Role', 'Enterprise Customers', 'Scale-up Team', 'High-ownership Seat', 'Remote-friendly Culture'];
  const WORK_MODES = ['Remote', 'Hybrid', 'Remote', 'Hybrid', 'Remote'];
  const TITLE_TEMPLATES = ['{role}', 'Senior {role}', '{role} - GTM', 'Lead {role}', 'Principal {role}', '{role} - Pipeline Ops'];
  const DECISIONS = ['ACCEPTED', 'IN QUEUE', 'ACCEPTED', 'DECLINED', 'IN QUEUE', 'ACCEPTED', 'IN QUEUE'];

  const ASSIGNEES = { sk: 'Alex', mc: 'Michael', er: 'Alex', dk: 'Jordan', sa: 'Alex' };
  const CLIENT_SUBTITLES = {
    sk: 'Sales & RevOps',
    mc: 'Staff SWE \u2022 Tech Infra',
    er: 'Product Design / FE',
    dk: 'Data Platform Lead',
    sa: 'Growth Mktg / AI Ops',
  };

  const STATUS_LABEL = { pending: 'Pending', submitting: 'Submitting', applied: 'Applied', failed: 'Failed' };
  const PROGRESS_OPTIONS = ['NOT APPLIED', 'APPLIED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
  const PROGRESS_FILTER_OPTIONS = [
    ['all', 'Apply: All'],
    ['NOT APPLIED', 'Apply: Not applied'],
    ['APPLIED', 'Apply: Applied'],
    ['INTERVIEW', 'Apply: Interview'],
    ['ACCEPTED', 'Apply: Accepted'],
    ['REJECTED', 'Apply: Rejected'],
  ];

  const ICON_PATHS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2.5.7 4 2.7 4 5.5"/>',
    pin: '<path d="M12 17v5M9 3h6l-1 6 4 4v2H6v-2l4-4z"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sync: '<path d="M20 11a8 8 0 00-14-4M4 5v4h4M4 13a8 8 0 0014 4M20 19v-4h-4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    out: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>',
  };

  /* ======================================================================
   * 2. State
   * ==================================================================== */

  const createFilters = (clientId = 'all') => ({
    clientId,
    search: '',
    clientSearch: '',
    personaIndex: 0,
    date: 'all', // 'all' | 'recent' | 'YYYY-MM-DD'
    progress: 'all',
    page: 1,
    signature: '', // detects filter changes so we can reset to page 1
  });

  const state = {
    applications: [],
    view: 'overview',
    filters: createFilters(),
    sidebarPinned: window.innerWidth >= DESKTOP_MIN_WIDTH,
    drawerOpen: false,
  };

  /* ======================================================================
   * 3. Helpers
   * ==================================================================== */

  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, '0');

  const initials = (name) => name.split(' ').map((word) => word[0]).join('');
  const findClient = (id) => CLIENTS.find((client) => client.id === id);
  const findApplication = (id) => state.applications.find((app) => app.id === Number(id));

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  /** Day indexes above 31 roll into November, otherwise they are October. */
  const dayToIso = (day) => (day > 31 ? `2026-11-${pad2(day - 31)}` : `2026-10-${pad2(day)}`);
  const dayToLabel = (day) => (day > 31 ? `Nov ${day - 31}` : `Oct ${day}`);

  const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name]}</svg>`;

  const optionsHtml = (pairs, selected) =>
    pairs.map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    $('toasts').appendChild(toast);
    setTimeout(() => toast.remove(), TOAST_DURATION_MS);
  }

  /** Keeps the caret at the end of a text input after the DOM was re-rendered. */
  function restoreInputFocus(id) {
    const input = $(id);
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /* ======================================================================
   * 4. Data
   * ==================================================================== */

  /** Adds the fields shown in the queue table to a freshly seeded application. */
  function enrich(app) {
    const k = app.id;
    app.day = 24 - ((k * 7) % 12);
    app.title = TITLE_TEMPLATES[k % 6].replace('{role}', app.role);
    app.location = LOCATIONS[k % 7];
    app.workMode = WORK_MODES[k % 5];
    app.tag = TAGS[(k * 3) % 6];
    app.decision = DECISIONS[(k * 3 + 1) % 7];
    app.progress = app.status === 'applied' ? 'APPLIED' : 'NOT APPLIED';
    return app;
  }

  function seedApplications() {
    const applications = [];
    let id = 0;

    CLIENTS.forEach((client) => {
      ['failed', 'applied', 'submitting', 'pending'].forEach((status) => {
        for (let i = 0; i < client[status]; i += 1) {
          const k = id++;
          applications.push(enrich({
            id: k,
            clientId: client.id,
            company: COMPANIES[(k * 3 + client.id.charCodeAt(0)) % COMPANIES.length],
            role: client.roles[k % 2],
            match: 70 + ((k * 7 + client.id.charCodeAt(1)) % 29),
            status,
            appliedToday: status === 'applied',
          }));
        }
      });
    });

    return applications;
  }

  const countByStatus = (status, clientId) =>
    state.applications.filter((app) => app.status === status && (!clientId || app.clientId === clientId)).length;

  /** Rows of the active client + persona after search/date/progress filters, newest first. */
  function getFilteredJobs() {
    const { clientId, personaIndex, search, date, progress } = state.filters;
    const client = findClient(clientId);
    const role = client.roles[personaIndex];
    const query = search.trim().toLowerCase();

    const matchesDate = (app) =>
      date === 'all' || (date === 'recent' ? app.day >= RECENT_DAY_THRESHOLD : dayToIso(app.day) === date);
    const matchesQuery = (app) =>
      !query || `${app.company} ${app.title} ${app.location} ${app.tag}`.toLowerCase().includes(query);

    return state.applications
      .filter((app) =>
        app.clientId === client.id &&
        app.role === role &&
        matchesDate(app) &&
        (progress === 'all' || app.progress === progress) &&
        matchesQuery(app))
      .sort((a, b) => b.day - a.day || a.id - b.id);
  }

  /** Distinct run dates available for the active client + persona (newest first). */
  function getAvailableDates() {
    const { clientId, personaIndex } = state.filters;
    const role = findClient(clientId).roles[personaIndex];
    const days = new Set(
      state.applications.filter((app) => app.clientId === clientId && app.role === role).map((app) => app.day),
    );
    return [...days].sort((a, b) => b - a).map(dayToIso);
  }

  /* ======================================================================
   * 5. Views
   * ==================================================================== */

  const KPI_ICONS = {
    'Awaiting submission': ['clock', ''],
    'Currently submitting': ['sync', ''],
    'Applied today': ['check', 'ok'],
    'Blocked / failed': ['warn', 'bad'],
  };

  function kpiCard(label, value, description, extra = '') {
    const [iconName, tone] = KPI_ICONS[label];
    return `
      <div class="card kpi">
        <div class="kh"><div class="lab">${label}</div><div class="kic ${tone}">${icon(iconName)}</div></div>
        <div class="n">${value}${extra}</div>
        <div class="d">${description}</div>
      </div>`;
  }

  function renderPageHeader() {
    return `
      <div class="head">
        <button class="mb" type="button" data-action="sidebar" data-mode="menu" aria-label="Toggle navigation">${icon('menu')}</button>
        <div>
          <h1>Operational Control Center</h1>
          <p>Manage client application pipelines, sync submissions, and monitor execution state</p>
        </div>
      </div>`;
  }

  function renderOverview() {
    const clientRows = CLIENTS.map((client) => {
      const submitting = countByStatus('submitting', client.id);
      return `
        <button class="row" type="button" data-action="open-client" data-id="${client.id}" title="Open queue for ${client.name}">
          <div class="av">${initials(client.name)}</div>
          <div class="who"><div class="nm">${client.name}</div><div class="rl">${client.roles.join(' \u2022 ')}</div></div>
          <div class="bd">
            <span class="b">${countByStatus('pending', client.id)} pending</span>
            ${submitting ? `<span class="b warn">${submitting} submitting</span>` : ''}
            <span class="b ok">${countByStatus('applied', client.id)} applied</span>
            <span class="b bad">${countByStatus('failed', client.id)} failed</span>
          </div>
          <span class="chev">${icon('chev')}</span>
        </button>`;
    }).join('');

    const trend = `<span class="tr">${icon('trend')}+12% vs last wk</span>`;

    return `
      <div class="kpis">
        ${kpiCard('Awaiting submission', countByStatus('pending'), 'Approved by client, pending ops apply', trend)}
        ${kpiCard('Currently submitting', countByStatus('submitting'), 'In progress by ops team members')}
        ${kpiCard('Applied today', state.applications.filter((app) => app.appliedToday).length, 'Proof uploaded and verified today')}
        ${kpiCard('Blocked / failed', countByStatus('failed'), 'Requires intervention or updated credentials')}
      </div>
      <div class="card sec">
        <div class="sech">
          <h2>Active Client Workspaces <span class="tag">${CLIENTS.length} Active</span></h2>
          <button class="linkb" type="button" data-action="go-queues">View all queues ${icon('arrow')}</button>
        </div>
        <div class="rows">${clientRows}</div>
      </div>`;
  }

  function renderJobRow(app, index) {
    return `
      <tr>
        <td>${pad2(index)}</td>
        <td>${dayToLabel(app.day)}</td>
        <td><div class="company"><strong>${app.company}</strong></div></td>
        <td class="jt"><b>${app.title}</b><small>${app.location} / ${app.workMode} \u2022 ${app.tag}</small></td>
        <td><button class="ib" type="button" data-action="cv" data-id="${app.id}" title="Open tailored CV" aria-label="Open tailored CV">${icon('ext')}</button></td>
        <td><button class="vp" type="button" data-action="post" data-id="${app.id}">${icon('ext')}View post</button></td>
        <td><div class="pf"><button class="ib sm" type="button" data-action="proof" data-id="${app.id}" title="View proof screenshot" aria-label="View proof screenshot">${icon('cam')}</button></div></td>
        <td>
          <select class="pg" data-progress-id="${app.id}" data-v="${app.progress}" aria-label="Apply status for ${app.company}">
            ${optionsHtml(PROGRESS_OPTIONS.map((p) => [p, p]), app.progress)}
          </select>
        </td>
      </tr>`;
  }

  function renderPagination(page, pages) {
    const numbered = Array.from({ length: pages }, (_, i) =>
      `<button type="button" class="${i + 1 === page ? 'on' : ''}" data-action="page" data-page="${i + 1}">${i + 1}</button>`).join('');
    return `
      <div class="pgn">
        <button type="button" data-action="page" data-page="${page - 1}" ${page < 2 ? 'disabled' : ''}>Prev</button>
        ${numbered}
        <button type="button" data-action="page" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button>
      </div>`;
  }

  function renderQueues() {
    const f = state.filters;
    if (f.clientId === 'all') f.clientId = 'sk';

    const client = findClient(f.clientId);
    const assignee = ASSIGNEES[client.id];

    // Any filter change sends the user back to the first page.
    const signature = [f.clientId, f.personaIndex, f.search, f.date, f.progress].join('|');
    if (f.signature !== signature) {
      f.signature = signature;
      f.page = 1;
    }

    const jobs = getFilteredJobs();
    const pages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
    f.page = Math.min(f.page, pages);
    const offset = (f.page - 1) * PAGE_SIZE;
    const visible = jobs.slice(offset, offset + PAGE_SIZE);

    const personaTabs = client.roles.map((role, i) => {
      const active = i === f.personaIndex;
      const total = state.applications.filter((app) => app.clientId === client.id && app.role === role).length;
      return `<button class="ptab ${active ? 'on' : ''}" type="button" data-action="persona" data-index="${i}">${active ? icon('check') : ''}${role}<small>${total} jobs</small></button>`;
    }).join('');

    const dateOptions = [['all', 'All dates'], ...getAvailableDates().map((d) => [d, d])];

    const table = visible.length
      ? `<div class="tw"><table>
          <thead><tr><th>#</th><th>Date</th><th>Company</th><th>Job title &amp; location</th><th>Instant CV</th><th>Original post</th><th>Proof</th><th>Apply</th></tr></thead>
          <tbody>${visible.map((app, i) => renderJobRow(app, offset + i + 1)).join('')}</tbody>
        </table></div>`
      : '<div class="empty">No jobs match these filters. Clear the search or choose another status.</div>';

    return `
      <div class="card ch">
        <div class="cht">
          <button class="mb mb2" type="button" data-action="sidebar" data-mode="menu" aria-label="Toggle navigation">${icon('menu')}</button>
          <div class="cht-title"><h2>${client.name}</h2></div>
          <div class="asg"><span>Assigned to</span><span class="as"><i class="${assignee === 'Michael' ? 'lt' : ''}">${assignee[0]}</i>${assignee}</span></div>
        </div>
        <div class="per"><span class="l">Active persona:</span>${personaTabs}</div>
      </div>
      <div class="card sec">
        <div class="tb">
          <input id="job-search" type="search" placeholder="Search company, title, keywords..." value="${escapeHtml(f.search)}" aria-label="Search jobs">
          <select id="progress-filter" aria-label="Apply">${optionsHtml(PROGRESS_FILTER_OPTIONS, f.progress)}</select>
          <span class="spacer"></span>
          <label class="dl"><select id="date-filter" aria-label="Pipeline run date">${optionsHtml(dateOptions, f.date)}</select></label>
          <button class="btn${f.date === 'recent' ? ' p' : ''}" type="button" data-action="date-shortcut" data-value="recent">Last 3 days</button>
          ${f.date !== 'all' ? '<button class="btn" type="button" data-action="date-shortcut" data-value="all">Clear</button>' : ''}
          <button class="btn" type="button" data-action="export">Export</button>
        </div>
        ${table}
        <div class="ft">
          <span>Showing ${visible.length} of ${jobs.length} queued applications \u2022 Columns reorderable</span>
          ${renderPagination(f.page, pages)}
        </div>
      </div>`;
  }

  /** Client list shown in the sidebar while the Client Queues view is active. */
  function renderClientPanel(restoreFocus = false) {
    const panel = $('client-panel');
    if (state.view !== 'queues') {
      panel.innerHTML = '';
      return;
    }

    const f = state.filters;
    const query = f.clientSearch.toLowerCase();
    const items = CLIENTS.filter((client) => client.name.toLowerCase().includes(query)).map((client) => {
      const active = client.id === f.clientId;
      const total = state.applications.filter((app) => app.clientId === client.id).length;
      return `
        <button class="cr ${active ? 'on' : ''}" type="button" data-action="open-client" data-id="${client.id}">
          <span class="av2">${initials(client.name)}</span>
          <span class="cn"><b>${client.name}${active ? '<i class="gd"></i>' : ''}</b><small>${CLIENT_SUBTITLES[client.id]}</small></span>
          <span class="jb">${active ? total + icon('chev') : `${total} jobs`}</span>
        </button>`;
    }).join('');

    panel.innerHTML = `<div class="qp"><input id="client-search" placeholder="Search clients..." value="${escapeHtml(f.clientSearch)}" aria-label="Search clients">${items}</div>`;
    if (restoreFocus) restoreInputFocus('client-search');
  }

  function render(restoreSearchFocus = false) {
    $('app').innerHTML = state.view === 'queues' ? renderQueues() : renderPageHeader() + renderOverview();

    $('nav-overview').classList.toggle('on', state.view === 'overview');
    $('nav-queues').classList.toggle('on', state.view === 'queues');
    $('nav-queues').classList.toggle('lt', state.view === 'queues');
    $('nav-pending-count').textContent = countByStatus('pending');

    renderClientPanel();
    if (restoreSearchFocus) restoreInputFocus('job-search');
  }

  /* ======================================================================
   * 6. Sidebar behaviour
   * ==================================================================== */

  function syncSidebar() {
    const { sidebarPinned: pinned, drawerOpen: open } = state;
    const visible = pinned || open;

    $('sidebar').classList.toggle('show', visible);
    $('sidebar').classList.toggle('float', visible && !pinned);
    $('shell').classList.toggle('pinned', pinned);
    $('backdrop').classList.toggle('on', open && !pinned);
    $('pin-button').classList.toggle('active', pinned);
    $('sidebar-mode').textContent = pinned ? 'Pinned' : open ? 'Drawer open' : 'Floating';
  }

  function handleSidebarAction(mode) {
    if (mode === 'pin') {
      state.sidebarPinned = !state.sidebarPinned;
      state.drawerOpen = !state.sidebarPinned;
    } else if (mode === 'close') {
      state.sidebarPinned = false;
      state.drawerOpen = false;
    } else if (mode === 'menu') {
      if (state.sidebarPinned) {
        state.sidebarPinned = false;
        state.drawerOpen = true;
      } else {
        state.drawerOpen = !state.drawerOpen;
      }
    }
    syncSidebar();
  }

  /* ======================================================================
   * 7. Event handling
   * ==================================================================== */

  function route() {
    state.view = location.hash === '#queues' ? 'queues' : 'overview';
    if (!state.sidebarPinned && state.drawerOpen) state.drawerOpen = false;
    syncSidebar();
    render();
  }

  /** Switches to the queues view, forcing a re-render if the hash is already `#queues`. */
  function openQueues() {
    if (location.hash === '#queues') route();
    else location.hash = 'queues';
  }

  function exportCsv() {
    const header = 'Date,Company,Title,Location,Mode,Match,Status,Your decision,My progress';
    const jobs = getFilteredJobs();
    const lines = jobs.map((app) => [
      dayToLabel(app.day), app.company, `"${app.title}"`, `"${app.location}"`, app.workMode,
      `${app.match}%`, STATUS_LABEL[app.status], app.decision, app.progress,
    ].join(','));
    const csv = [header, ...lines].join('\n');
    const blocked = () => showToast('Clipboard is blocked in this view');

    try {
      navigator.clipboard.writeText(csv).then(() => showToast(`Copied ${jobs.length} rows as CSV`), blocked);
    } catch (_) {
      blocked();
    }
  }

  const clickActions = {
    'open-client'(el) {
      state.filters = createFilters(el.dataset.id);
      showToast(`Opening queue for ${findClient(el.dataset.id).name}`);
      openQueues();
    },
    'go-queues'() {
      state.filters = createFilters('all');
      openQueues();
    },
    sidebar(el) {
      handleSidebarAction(el.dataset.mode);
    },
    page(el) {
      state.filters.page = Number(el.dataset.page);
      render();
    },
    persona(el) {
      state.filters.personaIndex = Number(el.dataset.index);
      render();
    },
    cv(el) {
      showToast(`Opening tailored CV for ${findApplication(el.dataset.id).company}`);
    },
    post(el) {
      showToast(`Opening original posting at ${findApplication(el.dataset.id).company}`);
    },
    proof(el) {
      showToast(`Opening proof screenshot for ${findApplication(el.dataset.id).company}`);
    },
    'date-shortcut'(el) {
      const { value } = el.dataset;
      state.filters.date = value === 'recent' && state.filters.date === 'recent' ? 'all' : value;
      render();
    },
    export: exportCsv,
  };

  function onClick(event) {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled) return;
    clickActions[el.dataset.action]?.(el);
  }

  function onInput(event) {
    const { id, value } = event.target;
    if (id === 'job-search') {
      state.filters.search = value;
      render(true);
    } else if (id === 'client-search') {
      state.filters.clientSearch = value;
      renderClientPanel(true);
    }
  }

  function onChange(event) {
    const { target } = event;

    if (target.id === 'progress-filter') {
      state.filters.progress = target.value;
      render();
    } else if (target.id === 'date-filter') {
      state.filters.date = target.value;
      render();
    } else if (target.dataset.progressId !== undefined) {
      const app = findApplication(target.dataset.progressId);
      if (!app) return;
      app.progress = target.value;
      target.dataset.v = target.value; // drives the colour of the select via CSS
      showToast(`Progress for ${app.company} set to ${target.value}`);
    }
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && state.drawerOpen && !state.sidebarPinned) {
      state.drawerOpen = false;
      syncSidebar();
    }
  }

  function onResize() {
    if (window.innerWidth < DESKTOP_MIN_WIDTH && state.sidebarPinned) {
      state.sidebarPinned = false;
      state.drawerOpen = false;
      syncSidebar();
    }
  }

  /* ======================================================================
   * 8. Init
   * ==================================================================== */

  function init() {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });

    state.applications = seedApplications();

    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', route);

    route();
  }

  init();
})();
