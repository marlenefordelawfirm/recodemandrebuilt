(function(){
  const MOCK_MODE = true; // All actions are mocked locally

  // Initial data (from live JSON)
  const initial = {
    host_email: 'Marlene@fordelaw.org',
    zoom_link: 'https://us06web.zoom.us/j/9661741676?pwd=clZEeUlkL04zRFRqeTYyWjNqeVpMZz09',
    booking_link: 'https://newyork.zoomwebinars.net/book',
    city: 'New York',
    domain_name: 'https://newyork.zoomwebinars.net',
    timezone: 'America/New_York',
    host_name: 'Marlene Forde',
    canva_template: 'https://www.canva.com/design/DAGVQu5PAKA/05wQ4p-xzPv_IiQKYi9tlQ/edit?utm_content=DAGVQu5PAKA&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    ads_manager: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=933243471669854&business_id=470457455676375&nav_entry_point=ads_ecosystem_navigation_menu&nav_source=ads_manager#',
    webinar_date: '2025-10-30',
    webinar_time: '19:00'
  };

  const TZ = [
    { label: 'Hawaii-Aleutian (no DST)', value:'Pacific/Honolulu' },
    { label: 'Alaska Time', value:'America/Juneau' },
    { label: 'Pacific Time', value:'America/Los_Angeles' },
    { label: 'Mountain Time', value:'America/Denver' },
    { label: 'Mountain Time (no DST)', value:'America/Phoenix' },
    { label: 'Central Time', value:'America/Chicago' },
    { label: 'Eastern Time', value:'America/New_York' },
    { label: 'Newfoundland Time', value:'America/St_Johns' },
    { label: 'Atlantic Time', value:'America/Glace_Bay' },
  ];

  const STORE_KEY = 'reco-demand-portal-local';

  function loadState(){
    try { return { ...initial, ...(JSON.parse(localStorage.getItem(STORE_KEY) || '{}')) } } catch { return { ...initial }; }
  }
  function saveState(patch){
    const next = { ...loadState(), ...patch };
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
  }

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const toast = (msg) => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('toast--show');
    setTimeout(() => el.classList.remove('toast--show'), 1400);
  };

  function populate(){
    const state = loadState();
    // Date/time
    $('#webinar_date').value = state.webinar_date;
    $('#webinar_time').value = state.webinar_time;
    // Timezone options
    const tzSel = $('#timezone');
    tzSel.innerHTML = TZ.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
    tzSel.value = state.timezone;

    // Details
    $('#city').value = state.city;
    $('#zoom_link').value = state.zoom_link;
    $('#host_name').value = state.host_name;
    $('#host_email').value = state.host_email;
    $('#domain_name').value = state.domain_name;
  }

  function bind(){
    // Per-field save buttons
    $$('#detailsForm [data-save]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-save');
        const value = $('#' + key).value.trim();
        saveState({ [key]: value });
        $('#detailsStatus').textContent = `Saved ${key.replace('_',' ')}.`;
        toast('Saved');
      });
    });

    // Save all
    $('#saveAll').addEventListener('click', () => {
      const patch = {
        city: $('#city').value.trim(),
        zoom_link: $('#zoom_link').value.trim(),
        host_name: $('#host_name').value.trim(),
        host_email: $('#host_email').value.trim(),
        domain_name: $('#domain_name').value.trim(),
      };
      saveState(patch);
      $('#detailsStatus').textContent = 'All details saved.';
      toast('All details saved');
    });

    // Date/time submit
    $('#dateTimeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const patch = {
        webinar_date: $('#webinar_date').value,
        webinar_time: $('#webinar_time').value,
        timezone: $('#timezone').value,
      };
      saveState(patch);
      $('#dateTimeStatus').textContent = 'Webinar date & time saved.';
      toast('Date & Time saved');
    });

    // Links
    const open = (href, mockPage) => {
      if (MOCK_MODE) {
        window.open(mockPage + '?target=' + encodeURIComponent(href), '_blank');
      } else {
        window.open(href, '_blank', 'noopener');
      }
    };

    $('#launch_zoom').addEventListener('click', () => open(loadState().zoom_link, 'mocks/zoom.html'));
    $('#open_booking').addEventListener('click', () => open(loadState().booking_link, 'mocks/booking.html'));
    $('#go_canva').addEventListener('click', () => open(loadState().canva_template, 'mocks/canva.html'));
    $('#go_ads').addEventListener('click', () => open(loadState().ads_manager, 'mocks/ads.html'));

    $('#copy_booking').addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(loadState().booking_link);
        toast('Booking link copied');
      } catch {
        toast('Copy failed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => { populate(); bind(); });
})();
