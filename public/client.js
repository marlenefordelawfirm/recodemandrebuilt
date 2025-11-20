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
  let syncTimezoneDisplay = () => {};
  let timezoneTicker = null;
  const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const DISPLAY_DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
  const TIME_24H_REGEX = /^(\d{2}):(\d{2})$/;
  const HOUR_OPTIONS = [
    { label: '12 AM', value: '00' }, { label: '01 AM', value: '01' }, { label: '02 AM', value: '02' },
    { label: '03 AM', value: '03' }, { label: '04 AM', value: '04' }, { label: '05 AM', value: '05' },
    { label: '06 AM', value: '06' }, { label: '07 AM', value: '07' }, { label: '08 AM', value: '08' },
    { label: '09 AM', value: '09' }, { label: '10 AM', value: '10' }, { label: '11 AM', value: '11' },
    { label: '12 PM', value: '12' }, { label: '01 PM', value: '13' }, { label: '02 PM', value: '14' },
    { label: '03 PM', value: '15' }, { label: '04 PM', value: '16' }, { label: '05 PM', value: '17' },
    { label: '06 PM', value: '18' }, { label: '07 PM', value: '19' }, { label: '08 PM', value: '20' },
    { label: '09 PM', value: '21' }, { label: '10 PM', value: '22' }, { label: '11 PM', value: '23' }
  ];
  const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  init();

  async function init() {
    injectStyles();
    mapFieldMetadata();
    await hydrateState();
    applyStateToInputs();
    timezoneSelect = setupTimezoneSelect();
    applyStateToInputs();
    setupDatePicker();
    setupTimePicker();
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
      if (!input) return;
      if (key === 'webinar_date') {
        input.value = formatDisplayFromIso(state.webinar_date) || '';
      } else if (key === 'webinar_time') {
        input.value = formatDisplayTime(state.webinar_time) || '';
      } else {
        input.value = state[key] ?? '';
      }
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

  function formatDisplayFromIso(iso) {
    if (!iso || typeof iso !== 'string' || !ISO_REGEX.test(iso)) return iso || '';
    const [year, month, day] = iso.split('-');
    return `${month}-${day}-${year}`;
  }

  function parseDisplayToIso(value) {
    if (!value) return '';
    const match = value.match(DISPLAY_DATE_REGEX);
    if (!match) return value;
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  function formatDisplayTime(value) {
    const match = value && value.match(TIME_24H_REGEX);
    if (!match) return value || '';
    const hour = match[1];
    const minute = match[2];
    const option = HOUR_OPTIONS.find((opt) => opt.value === hour);
    if (!option) return value;
    const [labelHour, labelPeriod] = option.label.split(' ');
    return `${labelHour}:${minute} ${labelPeriod}`;
  }

  function parseDisplayTime(value) {
    if (!value) return '';
    const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return value;
    let hour = parseInt(match[1], 10) % 12;
    const minute = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  function formatTimezoneTime(zone) {
    if (!zone) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: zone
      }).format(new Date());
    } catch (error) {
      console.warn('Failed to format timezone', zone, error);
      return '';
    }
  }


  function injectStyles() {
    if (document.getElementById('mock-toast-style')) return;
    const style = document.createElement('style');
    style.id = 'mock-toast-style';
    style.textContent = `
      .local-toast{position:fixed;left:50%;top:16px;transform:translateX(-50%) translateY(-20px);background:#111;color:#fff;padding:10px 14px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .15s ease,transform .2s ease;box-shadow:0 10px 20px rgba(0,0,0,.12);z-index:99999;font-weight:600}
      .local-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      .local-calendar{position:absolute;background:#fff;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 18px 45px rgba(15,23,42,.2);padding:12px;width:280px;z-index:9999}
      .local-calendar__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
      .local-calendar__header button{border:none;background:#f3f4f6;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;color:#111;display:flex;align-items:center;justify-content:center}
      .local-calendar__header button:hover{background:#e5e7eb}
      .local-calendar__heading{font-weight:600;font-size:15px}
      .local-calendar__weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:12px;text-align:center;color:#6b7280;margin-bottom:4px}
      .local-calendar__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
      .local-calendar__day{border:none;border-radius:6px;padding:8px 0;font-size:13px;background:#fff;color:#111;cursor:pointer}
      .local-calendar__day.prev,.local-calendar__day.next{color:#9ca3af}
      .local-calendar__day.current{background:#2563eb;color:#fff}
      .local-calendar__day:hover{background:#e5f0ff}
      .local-calendar__footer{display:flex;justify-content:flex-end;margin-top:6px}
      .local-calendar__clear{border:none;background:none;color:#2563eb;font-size:12px;cursor:pointer}
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

  // Global picker registry to manage closing pickers
  const pickerRegistry = {
    closers: [],
    register(closeFunction) {
      this.closers.push(closeFunction);
    },
    closeAll() {
      this.closers.forEach(fn => fn());
    }
  };

  function setupTimezoneSelect() {
    // Find the original Element UI select container
    const originalSelect = document.querySelector('.el-select.el-select--large');
    if (!originalSelect) {
      console.warn('[timezone] Original select not found');
      return null;
    }

    // Find the parent container
    const parentContainer = originalSelect.closest('.flex.flex-col.gap-1.w-full');
    if (!parentContainer) {
      console.warn('[timezone] Parent container not found');
      return null;
    }

    // Completely hide the original Element UI select and its dropdown
    originalSelect.style.display = 'none';
    const elSelectPopper = document.querySelector('.el-select__popper');
    if (elSelectPopper) {
      elSelectPopper.style.display = 'none';
      elSelectPopper.style.visibility = 'hidden';
      elSelectPopper.style.pointerEvents = 'none';
    }

    // Create custom input that looks like Element UI's date/time pickers
    const customWrapper = document.createElement('div');
    customWrapper.className = 'el-input el-input--large el-input--suffix';
    customWrapper.style.cssText = 'width: 100%;';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'el-input__wrapper';
    inputWrapper.tabIndex = -1;
    inputWrapper.style.cssText = `
      background-color: var(--el-fill-color-blank);
      border: 1px solid var(--el-border-color, rgba(0, 0, 0, 0.38));
      border-radius: 4px;
      padding: 1px 11px;
      transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
      cursor: pointer;
      position: relative;
      height: 40px;
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
    `;

    const displayInput = document.createElement('input');
    displayInput.className = 'el-input__inner';
    displayInput.type = 'text';
    displayInput.readOnly = true;
    displayInput.placeholder = 'Select Timezone';
    displayInput.style.cssText = `
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--el-font-size-base);
      color: var(--el-text-color-regular);
      width: 100%;
      cursor: pointer;
      padding: 0;
      margin: 0;
      line-height: 1;
      flex-grow: 1;
    `;

    // Add suffix icon (dropdown arrow)
    const suffixIcon = document.createElement('span');
    suffixIcon.className = 'el-input__suffix';
    suffixIcon.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-placeholder);
      pointer-events: none;
    `;

    const suffixInner = document.createElement('span');
    suffixInner.className = 'el-input__suffix-inner';
    suffixInner.innerHTML = `
      <i class="el-icon el-input__icon" style="font-size: 14px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1em" height="1em">
          <path fill="currentColor" d="M831.872 340.864 512 652.672 192.128 340.864a30.59 30.59 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.59 30.59 0 0 0-42.752 0z"></path>
        </svg>
      </i>
    `;

    suffixIcon.appendChild(suffixInner);

    inputWrapper.appendChild(displayInput);
    inputWrapper.appendChild(suffixIcon);
    customWrapper.appendChild(inputWrapper);

    // Insert custom wrapper after the original select
    originalSelect.parentNode.insertBefore(customWrapper, originalSelect.nextSibling);

    // Create the dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'local-tz-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      display: none;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      min-width: 310px;
      z-index: 9999;
      max-height: 274px;
      overflow-y: auto;
      font-family: inherit;
      font-size: 14px;
    `;

    const dropdownList = document.createElement('ul');
    dropdownList.style.cssText = `
      list-style: none;
      margin: 0;
      padding: 4px 0;
    `;

    timezoneOptions.forEach((opt) => {
      const item = document.createElement('li');
      item.className = 'local-tz-option';
      item.dataset.value = opt.value;
      item.style.cssText = `
        padding: 0 20px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        line-height: 34px;
        height: 34px;
        transition: background-color 0.2s;
        color: var(--el-text-color-regular);
      `;

      const labelSpan = document.createElement('span');
      labelSpan.textContent = opt.label;
      labelSpan.style.cssText = 'flex: 1; text-align: left; font-family: inherit;';

      const timeSpan = document.createElement('span');
      timeSpan.dataset.tzTime = '';
      timeSpan.style.cssText = 'color: var(--el-text-color-secondary); margin-left: 12px; font-size: 13px; font-family: inherit;';

      item.appendChild(labelSpan);
      item.appendChild(timeSpan);
      dropdownList.appendChild(item);
    });

    dropdown.appendChild(dropdownList);
    document.body.appendChild(dropdown);

    // Hidden input to store the value
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.className = 'local-tz-value';

    // State management
    const dropdownState = { open: false };

    const updateTimes = () => {
      dropdown.querySelectorAll('[data-tz-time]').forEach((span) => {
        const item = span.closest('li');
        const zone = item.dataset.value;
        span.textContent = formatTimezoneTime(zone);
      });
    };

    const updateDisplay = () => {
      const selectedValue = hiddenInput.value;
      const label = findTimezoneLabel(selectedValue) || 'Select Timezone';
      displayInput.value = label;

      dropdown.querySelectorAll('.local-tz-option').forEach((item) => {
        if (item.dataset.value === selectedValue) {
          item.style.backgroundColor = '#e8f0ff';
          item.style.color = '#2563eb';
        } else {
          item.style.backgroundColor = '';
          item.style.color = '';
        }
      });
    };

    const positionDropdown = () => {
      const rect = customWrapper.getBoundingClientRect();
      dropdown.style.left = `${rect.left + window.scrollX}px`;
      dropdown.style.top = `${rect.bottom + window.scrollY + 6}px`;
      dropdown.style.minWidth = `${rect.width}px`;
    };

    const toggleDropdown = (open) => {
      if (open) {
        // Close all other pickers before opening this one
        pickerRegistry.closeAll();
      }
      dropdownState.open = open;
      dropdown.style.display = open ? 'block' : 'none';
      if (open) {
        positionDropdown();
        updateTimes();
        updateDisplay();
        inputWrapper.style.borderColor = 'var(--el-border-color-hover)';
      } else {
        inputWrapper.style.borderColor = '';
      }
    };

    // Register this dropdown's close function
    pickerRegistry.register(() => {
      if (dropdownState.open) {
        toggleDropdown(false);
      }
    });

    // Event handlers
    customWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(!dropdownState.open);
    });

    inputWrapper.addEventListener('mouseenter', () => {
      if (!dropdownState.open) {
        inputWrapper.style.borderColor = 'var(--el-border-color-hover)';
      }
    });

    inputWrapper.addEventListener('mouseleave', () => {
      if (!dropdownState.open) {
        inputWrapper.style.borderColor = '';
      }
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.local-tz-option');
      if (item) {
        hiddenInput.value = item.dataset.value;
        state.timezone = item.dataset.value;
        updateDisplay();
        toggleDropdown(false);
      }
    });

    document.addEventListener('click', (e) => {
      if (!customWrapper.contains(e.target) && !dropdown.contains(e.target)) {
        toggleDropdown(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownState.open) {
        toggleDropdown(false);
      }
    });

    window.addEventListener('resize', () => dropdownState.open && positionDropdown());
    window.addEventListener('scroll', () => dropdownState.open && positionDropdown(), true);

    // Hover effects
    dropdown.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.local-tz-option');
      if (item && item.dataset.value !== hiddenInput.value) {
        item.style.backgroundColor = '#f3f4f6';
      }
    });

    dropdown.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.local-tz-option');
      if (item && item.dataset.value !== hiddenInput.value) {
        item.style.backgroundColor = '';
      }
    });

    // Initialize with current timezone
    const initialValue = state.timezone || timezoneOptions[0]?.value || '';
    hiddenInput.value = initialValue;
    state.timezone = initialValue;
    updateDisplay();
    updateTimes();

    // Update times every minute
    if (timezoneTicker) clearInterval(timezoneTicker);
    timezoneTicker = setInterval(updateTimes, 60000);

    syncTimezoneDisplay = () => {
      hiddenInput.value = state.timezone || hiddenInput.value;
      updateDisplay();
      updateTimes();
    };

    return hiddenInput;
  }

  function setupDatePicker() {
    const editor = document.querySelector('.el-date-editor.el-date-editor--date');
    if (!editor) return;
    const existingPopper = document.getElementById('el-popper-container-529');
    if (existingPopper) existingPopper.remove();

    const input = editor.querySelector('input.el-input__inner');
    if (!input) return;
    input.setAttribute('readonly', 'readonly');
    input.value = formatDisplayFromIso(state.webinar_date) || '';

    const suffixInner = editor.querySelector('.el-input__suffix-inner');
    let clearIcon = suffixInner && suffixInner.querySelector('.local-date-clear');
    if (!clearIcon && suffixInner) {
      clearIcon = document.createElement('i');
      clearIcon.className = 'el-icon el-input__icon el-input__clear local-date-clear';
      clearIcon.setAttribute('role', 'button');
      clearIcon.setAttribute('aria-label', 'Clear date');
      suffixInner.appendChild(clearIcon);
    }

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const pickerState = {
      selected: parseIsoDate(state.webinar_date),
      month: null,
      open: false
    };
    const today = new Date();
    pickerState.month = pickerState.selected
      ? new Date(pickerState.selected.getFullYear(), pickerState.selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);

    const picker = document.createElement('div');
    picker.className = 'local-calendar';
    picker.style.display = 'none';
    picker.innerHTML = `
      <div class="local-calendar__header">
        <button type="button" data-nav="-1" aria-label="Previous month">‹</button>
        <div class="local-calendar__heading">
          <span data-label="month"></span>
          <span data-label="year"></span>
        </div>
        <button type="button" data-nav="1" aria-label="Next month">›</button>
      </div>
      <div class="local-calendar__weekdays">${WEEKDAYS.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="local-calendar__grid"></div>
      <div class="local-calendar__footer">
        <button type="button" class="local-calendar__clear">Clear</button>
      </div>
    `;
    document.body.appendChild(picker);

    const monthLabel = picker.querySelector('[data-label="month"]');
    const yearLabel = picker.querySelector('[data-label="year"]');
    const grid = picker.querySelector('.local-calendar__grid');
    const clearBtn = picker.querySelector('.local-calendar__clear');

    const applyInput = (date) => {
      if (date) {
        const iso = formatIso(date);
        state.webinar_date = iso;
        input.value = formatDisplayFromIso(iso);
        if (clearIcon) clearIcon.style.display = '';
      } else {
        state.webinar_date = '';
        input.value = '';
        if (clearIcon) clearIcon.style.display = 'none';
      }
    };
    applyInput(pickerState.selected);
    if (clearIcon && !input.value) clearIcon.style.display = 'none';

    const buildGrid = () => {
      grid.innerHTML = '';
      monthLabel.textContent = MONTHS[pickerState.month.getMonth()];
      yearLabel.textContent = pickerState.month.getFullYear();
      const start = new Date(pickerState.month);
      start.setDate(1);
      const offset = start.getDay();
      start.setDate(start.getDate() - offset);

      for (let i = 0; i < 42; i++) {
        const cellDate = new Date(start);
        cellDate.setDate(start.getDate() + i);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = cellDate.getDate();
        btn.className = 'local-calendar__day';
        if (cellDate.getMonth() !== pickerState.month.getMonth()) {
          btn.classList.add(cellDate < pickerState.month ? 'prev' : 'next');
        }
        const iso = formatIso(cellDate);
        if (pickerState.selected && formatIso(pickerState.selected) === iso) {
          btn.classList.add('current');
        }
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          pickerState.selected = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
          pickerState.month = new Date(pickerState.selected.getFullYear(), pickerState.selected.getMonth(), 1);
          applyInput(pickerState.selected);
          buildGrid();
          hidePicker();
        });
        grid.appendChild(btn);
      }
    };

    const positionPicker = () => {
      const rect = editor.getBoundingClientRect();
      picker.style.left = `${rect.left + window.scrollX}px`;
      picker.style.top = `${rect.bottom + window.scrollY + 6}px`;
    };

    const showPicker = () => {
      if (pickerState.open) return;
      // Close all other pickers before opening this one
      pickerRegistry.closeAll();
      buildGrid();
      positionPicker();
      picker.style.display = 'block';
      pickerState.open = true;
    };

    const hidePicker = () => {
      if (!pickerState.open) return;
      picker.style.display = 'none';
      pickerState.open = false;
    };

    // Register this picker's close function
    pickerRegistry.register(() => {
      if (pickerState.open) {
        hidePicker();
      }
    });

    picker.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const dir = Number(btn.getAttribute('data-nav'));
        pickerState.month = new Date(pickerState.month.getFullYear(), pickerState.month.getMonth() + dir, 1);
        buildGrid();
      });
    });

    clearBtn.addEventListener('click', (event) => {
      event.preventDefault();
      pickerState.selected = null;
      applyInput(null);
      buildGrid();
      hidePicker();
    });

    if (clearIcon) {
      clearIcon.addEventListener('click', (event) => {
        event.preventDefault();
        pickerState.selected = null;
        applyInput(null);
        buildGrid();
      });
    }

    editor.addEventListener('click', () => showPicker());
    input.addEventListener('focus', () => showPicker());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hidePicker();
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showPicker();
      }
    });

    document.addEventListener('click', (event) => {
      if (!editor.contains(event.target) && !picker.contains(event.target)) hidePicker();
    });
    window.addEventListener('resize', () => pickerState.open && positionPicker());
    window.addEventListener('scroll', () => pickerState.open && positionPicker(), true);

    function parseIsoDate(iso) {
      if (!iso || !ISO_REGEX.test(iso)) return null;
      const [year, month, day] = iso.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    function formatIso(date) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
  }

  function setupTimePicker() {
    const editor = document.querySelector('.el-date-editor.el-date-editor--time');
    if (!editor) return;

    // Remove existing popups/tooltips to avoid conflicts
    editor.querySelectorAll('.el-tooltip, .el-time-panel').forEach((el) => el.remove());

    const input = editor.querySelector('input.el-input__inner');
    if (!input) return;
    input.setAttribute('readonly', 'readonly');
    input.value = formatDisplayTime(state.webinar_time) || '';

    // Create the picker container
    const picker = document.createElement('div');
    picker.className = 'local-time-picker';
    // Use fixed positioning to ensure it floats above everything
    picker.style.cssText = `
      display: none;
      position: absolute;
      z-index: 9999;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      width: 320px;
      padding: 12px;
    `;
    const baseFont = window.getComputedStyle(input).fontFamily || window.getComputedStyle(editor).fontFamily || 'inherit';
    picker.style.fontFamily = baseFont;

    // Build columns
    const hours = [
      { label: '12 AM', value: '00' }, { label: '01 AM', value: '01' }, { label: '02 AM', value: '02' },
      { label: '03 AM', value: '03' }, { label: '04 AM', value: '04' }, { label: '05 AM', value: '05' },
      { label: '06 AM', value: '06' }, { label: '07 AM', value: '07' }, { label: '08 AM', value: '08' },
      { label: '09 AM', value: '09' }, { label: '10 AM', value: '10' }, { label: '11 AM', value: '11' },
      { label: '12 PM', value: '12' }, { label: '01 PM', value: '13' }, { label: '02 PM', value: '14' },
      { label: '03 PM', value: '15' }, { label: '04 PM', value: '16' }, { label: '05 PM', value: '17' },
      { label: '06 PM', value: '18' }, { label: '07 PM', value: '19' }, { label: '08 PM', value: '20' },
      { label: '09 PM', value: '21' }, { label: '10 PM', value: '22' }, { label: '11 PM', value: '23' }
    ];
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    let html = '<div class="local-time-picker__columns" style="display: flex; gap: 8px; margin-bottom: 10px;">';

    // Hours Column
    html += '<div class="local-time-picker__col" data-type="hour" style="flex: 1; max-height: 200px; overflow-y: auto; scrollbar-width: thin;">';
    hours.forEach(h => {
      html += `<div class="local-time-picker__option" data-value="${h.value}" style="padding: 6px 0; cursor: pointer; border-radius: 4px; text-align: center; font-size: 14px; color: #333; font-family: inherit;">${h.label}</div>`;
    });
    html += '</div>';

    // Minutes Column
    html += '<div class="local-time-picker__col" data-type="minute" style="flex: 1; max-height: 200px; overflow-y: auto; scrollbar-width: thin;">';
    minutes.forEach(m => {
      html += `<div class="local-time-picker__option" data-value="${m}" style="padding: 6px 0; cursor: pointer; border-radius: 4px; text-align: center; font-size: 14px; color: #333; font-family: inherit;">${m}</div>`;
    });
    html += '</div>';

    html += '</div>'; // End columns

    // Actions
    html += `
      <div class="local-time-picker__actions" style="display: flex; gap: 8px;">
        <button type="button" data-action="clear" style="flex: 1; padding: 8px 0; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;">Clear</button>
        <button type="button" data-action="save" style="flex: 1; padding: 8px 0; border: none; background: #2563eb; color: white; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;">Set Time</button>
      </div>
    `;

    picker.innerHTML = html;
    document.body.appendChild(picker);

    // State
    let isOpen = false;
    const selection = { hour: null, minute: null };

    const getCommittedParts = () => {
      const fromState = state.webinar_time || parseDisplayTime(input.value.trim());
      if (fromState && TIME_24H_REGEX.test(fromState)) {
        return parseTimeParts(fromState);
      }
      return { hour: '00', minute: '00' };
    };

    const commitSelection = () => {
      const { hour: currentHour, minute: currentMinute } = getCommittedParts();
      const nextHour = selection.hour ?? currentHour;
      const nextMinute = selection.minute ?? currentMinute;
      selection.hour = nextHour;
      selection.minute = nextMinute;
      state.webinar_time = formatPartsToTime({ hour: nextHour, minute: nextMinute });
      input.value = formatDisplayTime(state.webinar_time);
    };

    // Helpers
    const updateSelection = (syncFromState = false) => {
      if (syncFromState) {
        const fromState = state.webinar_time || parseDisplayTime(input.value.trim());
        if (fromState && TIME_24H_REGEX.test(fromState)) {
          const current = parseTimeParts(fromState);
          selection.hour = current.hour;
          selection.minute = current.minute;
        } else {
          selection.hour = null;
          selection.minute = null;
        }
      }

      picker.querySelectorAll('.local-time-picker__option').forEach(el => {
        el.style.backgroundColor = 'transparent';
        el.style.color = '#333';
        el.classList.remove('is-active');

        const colType = el.parentElement.dataset.type;
        if (colType === 'hour' && selection.hour !== null && el.dataset.value === selection.hour) {
          el.classList.add('is-active');
          el.style.backgroundColor = '#e8f0ff';
          el.style.color = '#2563eb';
        }
        if (colType === 'minute' && selection.minute !== null && el.dataset.value === selection.minute) {
          el.classList.add('is-active');
          el.style.backgroundColor = '#e8f0ff';
          el.style.color = '#2563eb';
        }
      });

      scrollToActive();
    };

    const scrollToActive = () => {
      picker.querySelectorAll('.local-time-picker__col').forEach(col => {
        const active = col.querySelector('.is-active');
        if (active) {
          col.scrollTop = active.offsetTop - col.clientHeight / 2 + active.clientHeight / 2;
        }
      });
    };

    const positionPicker = () => {
      const rect = editor.getBoundingClientRect();
      // Position directly below the input field
      picker.style.left = `${rect.left + window.scrollX}px`;
      picker.style.top = `${rect.bottom + window.scrollY + 6}px`;
    };

    const show = () => {
      if (isOpen) return;
      // Close all other pickers before opening this one
      pickerRegistry.closeAll();
      isOpen = true;
      picker.style.display = 'block';
      updateSelection(true);
      positionPicker();
    };

    const hide = () => {
      if (!isOpen) return;
      isOpen = false;
      picker.style.display = 'none';
    };

    // Register this picker's close function
    pickerRegistry.register(() => {
      if (isOpen) {
        hide();
      }
    });

    // Events
    picker.addEventListener('click', (e) => {
      // Handle option selection
      const option = e.target.closest('.local-time-picker__option');
      if (option) {
        e.stopPropagation(); // Prevent bubbling issues
        const col = option.parentElement;
        const type = col.dataset.type;

        if (type && option.dataset.value) {
          selection[type] = option.dataset.value;
          updateSelection(); // Refresh styles immediately
        }
        return;
      }

      // Handle buttons
      const btn = e.target.closest('button');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();

        if (btn.dataset.action === 'save') {
          commitSelection();
          updateSelection(true);
          hide();
        } else if (btn.dataset.action === 'clear') {
          state.webinar_time = '';
          input.value = '';
          selection.hour = null;
          selection.minute = null;
          updateSelection();
          hide();
        }
      }
    });

    // Prevent clicks inside the picker from closing it
    picker.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    editor.addEventListener('click', (e) => {
      e.stopPropagation();
      show();
    });

    document.addEventListener('click', (e) => {
      if (!editor.contains(e.target) && !picker.contains(e.target)) hide();
    });

    window.addEventListener('resize', () => isOpen && positionPicker());
    window.addEventListener('scroll', () => isOpen && positionPicker(), true);
  }

  function parseTimeParts(value) {
    const match = value && value.match(TIME_24H_REGEX);
    if (!match) return { hour: '00', minute: '00' };
    return { hour: match[1], minute: match[2] };
  }

  function formatPartsToTime(parts) {
    const hour = parts.hour || '00';
    const minute = parts.minute || '00';
    return `${hour}:${minute}`;
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
    if (key === 'webinar_date') {
      return state.webinar_date || parseDisplayToIso(document.querySelector(FIELD_SELECTORS.webinar_date)?.value.trim());
    }
    if (key === 'webinar_time') {
      return state.webinar_time || parseDisplayTime(document.querySelector(FIELD_SELECTORS.webinar_time)?.value.trim());
    }
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
