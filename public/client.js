(function () {
  const API_ENDPOINT = '/api/custom-values';
  const KNOWN_KEYS = [
    'webinar_date',
    'webinar_time',
    'timezone',
    'city',
    'zoom_link',
    'host_name',
    'host_email',
    'domain_name',
    'booking_link',
    'canva_template',
    'ads_manager'
  ];
  const DEFAULT_VALUES = {
    webinar_date: '2025-10-30',
    webinar_time: '19:00',
    timezone: 'America/New_York',
    city: 'New York',
    zoom_link: 'https://us06web.zoom.us/j/9661741676?pwd=clZEeUlkL04zRFRqeTYyWjNqeVpMZz09',
    host_name: 'Marlene Forde',
    host_email: 'Marlene@fordelaw.org',
    domain_name: 'https://newyork.zoomwebinars.net',
    booking_link: 'https://newyork.zoomwebinars.net/book',
    canva_template: 'https://www.canva.com/design/DAGVQu5PAKA/05wQ4p-xzPv_IiQKYi9tlQ/edit?utm_content=DAGVQu5PAKA&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    ads_manager: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=933243471669854&business_id=470457455676375&nav_entry_point=ads_ecosystem_navigation_menu&nav_source=ads_manager#'
  };
  const FIELD_SELECTORS = {
    webinar_date: 'input[placeholder="Select Webinar Date"]',
    webinar_time: 'input[placeholder="Select Webinar Time"]',
    city: '#input-v-4',
    zoom_link: '#input-v-7',
    host_name: '#input-v-10',
    host_email: '#input-v-13',
    domain_name: '#input-v-16'
  };
  const DETAIL_FIELD_KEYS = ['city', 'zoom_link', 'host_name', 'host_email', 'domain_name'];
  const DATE_FIELD_KEYS = ['webinar_date', 'webinar_time', 'timezone'];

  const pageProps = getPageProps();
  const timezoneOptions = pageProps?.props?.timezones || [];
  const state = { ...DEFAULT_VALUES };
  let timezoneSelect;

  init();

  async function init() {
    injectStyles();
    mapFieldMetadata();
    await hydrateState();
    applyStateToInputs();
    timezoneSelect = setupTimezoneSelect();
    applyStateToInputs();
    setupDatePicker();
    wireActions();
  }

  function mapFieldMetadata() {
    Object.entries(FIELD_SELECTORS).forEach(([key, selector]) => {
      const input = document.querySelector(selector);
      if (!input) return;
      input.dataset.field = key;
      const root = input.closest('.v-input, .el-input, .v-field') || input.parentElement;
      const button = root?.querySelector('button');
      if (button) {
        button.dataset.field = key;
      }
    });
  }

  async function hydrateState() {
    try {
      const res = await fetch(API_ENDPOINT, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch remote values');
      const json = await res.json();
      applyServerValues(json.values);
    } catch (error) {
      console.warn('[mock] Falling back to default values', error);
    }
  }

  function applyServerValues(values) {
    if (!values || typeof values !== 'object') return;
    KNOWN_KEYS.forEach((key) => {
      if (values[key] !== undefined && values[key] !== null) {
        state[key] = values[key];
      }
    });
  }

  function applyStateToInputs() {
    Object.entries(FIELD_SELECTORS).forEach(([key, selector]) => {
      const input = document.querySelector(selector);
      if (input) input.value = state[key] ?? '';
    });
    if (timezoneSelect) {
      timezoneSelect.value = state.timezone || timezoneSelect.value;
    } else {
      const tzDisplay = document.querySelector('.el-select__selection-text');
      if (tzDisplay) tzDisplay.textContent = findTimezoneLabel(state.timezone) || state.timezone || '';
    }
  }

  function findTimezoneLabel(value) {
    return timezoneOptions.find((tz) => tz.value === value)?.label || '';
  }

  function injectStyles() {
    if (document.getElementById('mock-toast-style')) return;
    const style = document.createElement('style');
    style.id = 'mock-toast-style';
    style.textContent = `
      .local-toast{position:fixed;left:50%;top:16px;transform:translateX(-50%) translateY(-20px);background:#111;color:#fff;padding:10px 14px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .15s ease,transform .2s ease;box-shadow:0 10px 20px rgba(0,0,0,.12);z-index:99999;font-weight:600}
      .local-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      .local-tz-select{width:100%;padding:10px;border-radius:6px;border:1px solid #d1d5db;font-size:14px;background-color:#fff}
    `;
    document.head.appendChild(style);
    const toast = document.createElement('div');
    toast.id = 'local-toast';
    toast.className = 'local-toast';
    document.body.appendChild(toast);
  }

  function toast(message) {
    const t = document.getElementById('local-toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => t.classList.remove('show'), 1500);
  }

  function setupTimezoneSelect() {
    const wrapper = document.querySelector('.el-select__wrapper');
    if (!wrapper) return null;
    wrapper.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'local-tz-select';
    timezoneOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    select.value = state.timezone || timezoneOptions[0]?.value || '';
    state.timezone = select.value;
    select.addEventListener('change', () => {
      state.timezone = select.value;
    });
    wrapper.appendChild(select);
    return select;
  }

  function setupDatePicker() {
    const editor = document.querySelector('.el-date-editor.el-date-editor--date');
    if (!editor) return;
    const existingPopper = document.getElementById('el-popper-container-529');
    if (existingPopper) existingPopper.remove();
    const input = editor.querySelector('input.el-input__inner');
    if (!input) return;
    input.value = state.webinar_date || '';
    input.setAttribute('readonly', 'readonly');

    const suffixInner = editor.querySelector('.el-input__suffix-inner');
    let clearIcon = suffixInner && suffixInner.querySelector('.local-date-clear');
    if (!clearIcon && suffixInner) {
      clearIcon = document.createElement('i');
      clearIcon.className = 'el-icon el-icon-circle-close el-input__icon el-input__clear local-date-clear';
      clearIcon.setAttribute('role', 'button');
      clearIcon.setAttribute('aria-label', 'Clear date');
      clearIcon.tabIndex = 0;
      suffixInner.appendChild(clearIcon);
    }

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const parseISO = (value) => {
      if (!value) return null;
      const parts = value.split('-').map(Number);
      if (parts.length !== 3) return null;
      const [y, m, d] = parts;
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    };
    const fmtISO = (date) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const pickerState = {
      selected: parseISO(state.webinar_date) || null,
      month: null,
      open: false
    };
    const today = new Date();
    pickerState.month = pickerState.selected
      ? new Date(pickerState.selected.getFullYear(), pickerState.selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);

    const applyInput = (date) => {
      if (date) {
        const iso = fmtISO(date);
        input.value = iso;
        state.webinar_date = iso;
        if (clearIcon) clearIcon.style.display = '';
      } else {
        input.value = '';
        state.webinar_date = '';
        if (clearIcon) clearIcon.style.display = 'none';
      }
    };

    applyInput(pickerState.selected);

    const picker = document.createElement('div');
    picker.className = 'el-popper is-pure is-light el-picker__popper local-date-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-hidden', 'true');
    picker.style.display = 'none';

    const svgLeft = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.59 30.59 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.59 30.59 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0"></path></svg>';
    const svgRight = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"></path></svg>';

    picker.innerHTML = `
      <div class="el-picker-panel el-date-picker" tabindex="-1">
        <div class="el-picker-panel__body-wrapper">
          <div class="el-picker-panel__body">
            <div class="el-date-picker__header">
              <span class="el-date-picker__prev-btn">
                <button type="button" class="el-picker-panel__icon-btn arrow-left" data-nav="prev">${svgLeft}</button>
              </span>
              <span class="el-date-picker__header-label" data-role="year" aria-live="polite" tabindex="0"></span>
              <span class="el-date-picker__header-label" data-role="month" aria-live="polite" tabindex="0"></span>
              <span class="el-date-picker__next-btn">
                <button type="button" class="el-picker-panel__icon-btn arrow-right" data-nav="next">${svgRight}</button>
              </span>
            </div>
            <div class="el-picker-panel__content">
              <table class="el-date-table" cellspacing="0" cellpadding="0" role="grid" aria-label="Use the arrow keys and enter to select the day of the month">
                <thead><tr>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<th scope="col" aria-label="${d}">${d}</th>`).join('')}</tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(picker);

    const tbody = picker.querySelector('tbody');
    const yearLabel = picker.querySelector('[data-role="year"]');
    const monthLabel = picker.querySelector('[data-role="month"]');

    const monthStart = () => new Date(pickerState.month.getFullYear(), pickerState.month.getMonth(), 1);
    const nextMonthStart = () => new Date(pickerState.month.getFullYear(), pickerState.month.getMonth() + 1, 1);

    const render = () => {
      yearLabel.textContent = pickerState.month.getFullYear();
      monthLabel.textContent = MONTHS[pickerState.month.getMonth()];
      tbody.innerHTML = '';
      const monthFirst = monthStart();
      const nextFirst = nextMonthStart();
      const start = new Date(monthFirst);
      start.setDate(1 - start.getDay());

      for (let week = 0; week < 6; week++) {
        const tr = document.createElement('tr');
        for (let day = 0; day < 7; day++) {
          const cellDate = new Date(start);
          cellDate.setDate(start.getDate() + week * 7 + day);
          const td = document.createElement('td');
          let cls;
          if (cellDate < monthFirst) cls = 'prev-month';
          else if (cellDate >= nextFirst) cls = 'next-month';
          else cls = 'available';
          td.className = cls;
          const cell = document.createElement('div');
          cell.className = 'el-date-table-cell';
          const span = document.createElement('span');
          span.className = 'el-date-table-cell__text';
          span.textContent = String(cellDate.getDate());
          cell.appendChild(span);
          td.appendChild(cell);

          const iso = fmtISO(cellDate);
          td.setAttribute('data-date', iso);
          td.setAttribute('aria-selected', pickerState.selected && fmtISO(pickerState.selected) === iso ? 'true' : 'false');
          td.tabIndex = -1;
          if (td.getAttribute('aria-selected') === 'true') td.classList.add('current');

          td.addEventListener('click', (event) => {
            event.preventDefault();
            selectDate(cellDate);
          });
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    };

    const position = () => {
      const rect = editor.getBoundingClientRect();
      picker.style.left = `${rect.left + window.scrollX}px`;
      picker.style.top = `${rect.bottom + window.scrollY + 4}px`;
      picker.style.minWidth = `${rect.width}px`;
    };

    const show = () => {
      if (pickerState.open) return;
      render();
      position();
      picker.style.display = 'block';
      picker.setAttribute('aria-hidden', 'false');
      pickerState.open = true;
      input.setAttribute('aria-expanded', 'true');
    };

    const hide = () => {
      if (!pickerState.open) return;
      picker.style.display = 'none';
      picker.setAttribute('aria-hidden', 'true');
      pickerState.open = false;
      input.setAttribute('aria-expanded', 'false');
    };

    const selectDate = (date) => {
      pickerState.selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      pickerState.month = new Date(pickerState.selected.getFullYear(), pickerState.selected.getMonth(), 1);
      applyInput(pickerState.selected);
      render();
      hide();
    };

    const changeMonth = (direction) => {
      pickerState.month = new Date(pickerState.month.getFullYear(), pickerState.month.getMonth() + direction, 1);
      render();
    };

    picker.addEventListener('click', (event) => event.stopPropagation());
    picker.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const dir = btn.getAttribute('data-nav') === 'next' ? 1 : -1;
        changeMonth(dir);
      });
    });

    const clearDate = () => {
      pickerState.selected = null;
      applyInput(null);
      render();
    };

    if (clearIcon) {
      clearIcon.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearDate();
        hide();
        input.focus();
      });
      clearIcon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          clearDate();
          hide();
        }
      });
      if (!input.value) clearIcon.style.display = 'none';
    }

    editor.addEventListener('click', () => show());
    input.addEventListener('focus', () => show());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hide();
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        show();
      }
    });

    document.addEventListener('click', (event) => {
      if (!editor.contains(event.target) && !picker.contains(event.target)) hide();
    });
    window.addEventListener('resize', () => pickerState.open && position());
    window.addEventListener('scroll', () => pickerState.open && position(), true);
  }

  function wireActions() {
    document.querySelectorAll('button[data-field]').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        const field = btn.dataset.field;
        const value = getFieldValue(field);
        await persistValues({ [field]: value }, 'Saved');
      });
    });

    const saveAll = findButton('save all');
    if (saveAll) {
      saveAll.addEventListener('click', async (event) => {
        event.preventDefault();
        const payload = {};
        DETAIL_FIELD_KEYS.forEach((key) => (payload[key] = getFieldValue(key)));
        await persistValues(payload, 'All details saved');
      });
    }

    const dateBtn = findButton('set webinar date & time');
    if (dateBtn) {
      dateBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const payload = {};
        DATE_FIELD_KEYS.forEach((key) => (payload[key] = getFieldValue(key)));
        await persistValues(payload, 'Webinar date & time saved');
      });
    }

    setupLinkButtons();
  }

  function setupLinkButtons() {
    const launchZoom = findButton('launch zoom webinar');
    if (launchZoom) {
      launchZoom.addEventListener('click', (event) => {
        event.preventDefault();
        openMock(state.zoom_link, 'zoom');
      });
    }

    const openBooking = findButton('open booking link');
    if (openBooking) {
      openBooking.addEventListener('click', (event) => {
        event.preventDefault();
        openMock(state.booking_link, 'booking');
      });
    }

    const copyBooking = findButton('copy booking link');
    if (copyBooking) {
      copyBooking.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(state.booking_link || '');
          toast('Booking link copied');
        } catch {
          toast('Copy failed');
        }
      });
    }

    const goCanva = findButton('go to canva template');
    if (goCanva) {
      goCanva.addEventListener('click', (event) => {
        event.preventDefault();
        openMock(state.canva_template, 'canva');
      });
    }

    const goAds = findButton('go to ads manager');
    if (goAds) {
      goAds.addEventListener('click', (event) => {
        event.preventDefault();
        openMock(state.ads_manager, 'ads');
      });
    }
  }

  function getFieldValue(key) {
    if (key === 'timezone') {
      return timezoneSelect?.value || state.timezone || '';
    }
    const selector = FIELD_SELECTORS[key];
    const input = selector && document.querySelector(selector);
    return input ? input.value.trim() : state[key] || '';
  }

  async function persistValues(patch, successMessage) {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: patch })
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      applyServerValues(data.values || patch);
      applyStateToInputs();
      toast(successMessage || 'Saved');
    } catch (error) {
      console.error('[mock] Failed to save values', error);
      toast('Save failed');
    }
  }

  function findButtonsByText(text) {
    const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const target = norm(text);
    return Array.from(document.querySelectorAll('button, a[role="button"], .v-btn'))
      .filter((el) => norm(el.textContent || '') === target);
  }

  function findButton(text) {
    return findButtonsByText(text)[0] || null;
  }

  function openMock(target, page) {
    const href = target || '#';
    const url = `mocks/${page}.html?target=${encodeURIComponent(href)}`;
    window.open(url, '_blank', 'noopener');
  }

  function getPageProps() {
    const app = document.getElementById('app');
    if (!app || !app.dataset.page) return {};
    try {
      return JSON.parse(app.dataset.page);
    } catch (error) {
      console.warn('Failed to parse page props', error);
      return {};
    }
  }
})();
