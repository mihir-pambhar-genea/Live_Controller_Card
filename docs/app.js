(function () {
  'use strict';

  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var Recharts = window.Recharts;

  var useState = React.useState;
  var useEffect = React.useEffect;
  var useMemo = React.useMemo;
  var useRef = React.useRef;
  var createRoot = ReactDOM.createRoot;

  function clsx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]) out.push(arguments[i]);
    }
    return out.join(' ');
  }

  function ensureBasicPrefix(token) {
    if (!token) return '';
    var t = String(token).trim();
    return t.toLowerCase().indexOf('basic ') === 0 ? t : 'Basic ' + t;
  }

  function prettyJSON(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
  }

  function Button(props) {
    var className = props.className || '';
    var variant = props.variant || 'primary';
    var base = 'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[.98] disabled:opacity-50';
    var variants = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow',
      ghost: 'hover:bg-zinc-100',
      outline: 'border border-zinc-300 hover:bg-zinc-100',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow',
      subtle: 'bg-zinc-100 hover:bg-zinc-200'
    };
    var cn = clsx(base, variants[variant], className);
    var p = Object.assign({}, props);
    delete p.variant;
    delete p.className;
    return React.createElement('button', Object.assign({ className: cn }, p), props.children);
  }

  function Input(props) {
    var cn = clsx(
      'w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500',
      props.className || ''
    );
    var p = Object.assign({}, props, { className: cn });
    return React.createElement('input', p);
  }

  function Card(props) {
    return React.createElement('div', { className: clsx('rounded-3xl border border-zinc-200 bg-white shadow-sm', props.className || '') }, props.children);
  }
  function CardHeader(props) {
    return React.createElement('div', { className: 'flex items-start justify-between gap-2 p-4' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'text-base font-semibold' }, props.title),
        props.sub ? React.createElement('p', { className: 'mt-1 text-xs text-zinc-500' }, props.sub) : null
      ),
      React.createElement('div', { className: 'flex items-center gap-2' }, props.action)
    );
  }
  function CardContent(props) {
    return React.createElement('div', { className: 'p-4 pt-0' }, props.children);
  }
  function SmallLabel(props) {
    return React.createElement('span', { className: 'text-xs text-zinc-500' }, props.children);
  }
  function Badge(props) {
    var variant = props.variant || 'default';
    var styles = {
      'default': 'bg-zinc-100 text-zinc-800',
      'green': 'bg-emerald-100 text-emerald-800',
      'red': 'bg-rose-100 text-rose-800',
      'yellow': 'bg-amber-100 text-amber-800'
    };
    return React.createElement('span', { className: clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[variant]) }, props.children);
  }

  function UtilizationDonut(props) {
    var capacity = Math.max(0, Number(props.capacity || 0));
    var used = Math.min(Math.max(0, Number(props.used || 0)), capacity || Number(props.used || 0));
    var free = Math.max(0, capacity - used);

    var data = React.useMemo(function () {
      return [{ name: 'Used', value: used }, { name: 'Free', value: free }];
    }, [used, free]);

    var pct = capacity > 0 ? Math.round((used / capacity) * 100) : 0;
    var COLORS = ['#4f46e5', '#e5e7eb'];

    return React.createElement('div', { className: 'relative h-40 w-full' },
      React.createElement(Recharts.ResponsiveContainer, { width: '100%', height: '100%' },
        React.createElement(Recharts.PieChart, null,
          React.createElement(Recharts.Tooltip, { formatter: function (v, n) { return [v, n]; } }),
          React.createElement(Recharts.Pie, {
            data: data, innerRadius: 55, outerRadius: 75, paddingAngle: 2, dataKey: 'value', startAngle: 90, endAngle: -270
          },
            data.map(function (_, i) { return React.createElement(Recharts.Cell, { key: 'cell-' + i, fill: COLORS[i % COLORS.length] }); })
          )
        )
      ),
      React.createElement('div', { className: 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center' },
        React.createElement('div', { className: 'text-xl font-semibold' }, String(pct) + '%'),
        React.createElement('div', { className: 'text-[10px] text-zinc-500' },
          (used || 0).toLocaleString(), ' / ', (capacity || 0).toLocaleString()
        )
      )
    );
  }

  function SCPCard(props) {
    var scp = props.scp;
    var token = props.token;
    var intervalMs = props.intervalMs;
    var onRemove = props.onRemove;

    var _a = useState(null), data = _a[0], setData = _a[1];
    var _b = useState(''), error = _b[0], setError = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(false), paused = _d[0], setPaused = _d[1];
    var _e = useState(false), openJSON = _e[0], setOpenJSON = _e[1];
    var timerRef = useRef(null);

    var headers = useMemo(function () {
      return { 'Authorization': ensureBasicPrefix(token), 'Content-Type': 'application/json' };
    }, [token]);

    var url = 'https://remote-ops-mercury-api.sequr.io/v1/' + encodeURIComponent(String(scp)) + '/status/id';

    var fetchOnce = async function () {
      if (!token) { setError('Missing Basic token'); return; }
      setLoading(true);
      try {
        var res = await fetch(url, { headers: headers });
        if (!res.ok) {
          var text = await res.text();
          throw new Error('HTTP ' + res.status + ' - ' + (text || res.statusText));
        }
        var json = await res.json();
        setData(json);
        setError('');
      } catch (e) {
        setError(e && e.message ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    useEffect(function () {
      if (paused) return;
      fetchOnce();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(fetchOnce, intervalMs);
      return function () { if (timerRef.current) clearInterval(timerRef.current); };
    }, [url, headers.Authorization, intervalMs, paused]);

    var d = (data && data.data) || {};
    var derived = d.derived || {};
    var fw = derived.firmware_version || ((d.sft_rev_major != null && d.sft_rev_minor != null) ? String(d.sft_rev_major) + '.' + String(d.sft_rev_minor).slice(0,2) + '.x' : '-');
    var model = derived.model || '-';
    var mac = derived.mac || d.mac_addr || '-';
    var scpNumber = (derived.scp_number != null ? derived.scp_number : (d.scp_number != null ? d.scp_number : scp));
    var capacity = Number(derived.cards_capacity != null ? derived.cards_capacity : (d.db_max != null ? d.db_max : 0)) || 0;
    var total = Number(derived.total_cards != null ? derived.total_cards : (d.db_active != null ? d.db_active : 0)) || 0;

    var badge = error ? React.createElement(Badge, { variant: 'red' }, 'Error')
                      : (loading ? React.createElement(Badge, { variant: 'yellow' }, 'Loading...')
                                 : React.createElement(Badge, { variant: 'green' }, 'Live'));

    return React.createElement(Card, { className: 'relative overflow-hidden' },
      React.createElement(CardHeader, {
        title: React.createElement('span', { className: 'flex items-center gap-2' },
          'SCP ', React.createElement('span', { className: 'font-mono text-indigo-600' }, scpNumber)),
        sub: React.createElement('div', { className: 'flex items-center gap-2' },
          badge, React.createElement(SmallLabel, null, 'Polling every ' + Math.round(intervalMs / 1000) + 's')),
        action: React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement(Button, { variant: 'subtle', onClick: fetchOnce }, 'Refresh'),
          React.createElement(Button, { variant: 'subtle', onClick: function(){ setPaused(function(p){ return !p; }); } }, paused ? 'Resume' : 'Pause'),
          React.createElement(Button, { variant: 'danger', onClick: onRemove }, 'Remove'))
      }),
      React.createElement(CardContent, null,
        React.createElement('div', { className: 'grid grid-cols-1 gap-4 md:grid-cols-2' },
          React.createElement('div', null, React.createElement(UtilizationDonut, { capacity: capacity, used: total })),
          React.createElement('div', { className: 'flex flex-col justify-center gap-2' },
            React.createElement('div', { className: 'grid grid-cols-[115px_1fr] items-center gap-x-3 gap-y-1 text-sm' },
              React.createElement('div', { className: 'text-zinc-500' }, 'Firmware'),
              React.createElement('div', { className: 'font-medium' }, fw),
              React.createElement('div', { className: 'text-zinc-500' }, 'Model'),
              React.createElement('div', { className: 'font-medium' }, model),
              React.createElement('div', { className: 'text-zinc-500' }, 'MAC'),
              React.createElement('div', { className: 'font-medium font-mono' }, mac),
              React.createElement('div', { className: 'text-zinc-500' }, 'Capacity'),
              React.createElement('div', { className: 'font-medium' }, capacity.toLocaleString()),
              React.createElement('div', { className: 'text-zinc-500' }, 'Total Cards'),
              React.createElement('div', { className: 'font-medium' }, total.toLocaleString())
            ),
            React.createElement('div', { className: 'mt-3 flex items-center gap-2' },
              React.createElement(Button, { variant: 'outline', onClick: function(){ setOpenJSON(true); } }, 'Full JSON'),
              error ? React.createElement('span', { className: 'text-xs text-rose-600' }, error) : null)
          )
        )
      ),
      openJSON && React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
        onClick: function(){ setOpenJSON(false); }
      },
        React.createElement('div', {
          className: 'max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-xl',
          onClick: function(e){ e.stopPropagation(); }
        },
          React.createElement('div', { className: 'flex items-center justify-between border-b p-4' },
            React.createElement('span', { className: 'text-sm font-semibold' }, 'Full response (SCP ' + scpNumber + ')'),
            React.createElement(Button, { variant: 'ghost', onClick: function(){ setOpenJSON(false); } }, 'Close')
          ),
          React.createElement('div', { className: 'max-h-[70vh] overflow-auto p-4' },
            React.createElement('pre', { className: 'whitespace-pre-wrap break-words text-xs leading-relaxed' }, prettyJSON(data || { error: error || 'No data yet' }))
          )
        )
      )
    );
  }

  function App() {
    var _a = useState(''), token = _a[0], setToken = _a[1];
    var _b = useState(''), scpInput = _b[0], setScpInput = _b[1];
    var _c = useState([]), scps = _c[0], setScps = _c[1];
    var _d = useState(10), intervalSec = _d[0], setIntervalSec = _d[1];

    useEffect(function () {
      try {
        var saved = JSON.parse(localStorage.getItem('scp-tracker-state') || '{}');
        if (saved.token) setToken(saved.token);
        if (Array.isArray(saved.scps)) setScps(saved.scps);
        if (saved.intervalSec) setIntervalSec(saved.intervalSec);
      } catch (e) {}
    }, []);

    useEffect(function () {
      localStorage.setItem('scp-tracker-state', JSON.stringify({ token: token, scps: scps, intervalSec: intervalSec }));
    }, [token, scps, intervalSec]);

    function addScps() {
      if (!scpInput.trim()) return;
      var parts = scpInput.split(/[\\s,]+/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return (/^\\d+$/.test(s) ? Number(s) : s); });
      var merged = (scps || []).concat(parts);
      var uniq = Array.from(new Set(merged));
      setScps(uniq);
      setScpInput('');
    }

    function removeScp(i) {
      var copy = scps.slice();
      copy.splice(i, 1);
      setScps(copy);
    }

    function clearAll() { setScps([]); }
    var intervalMs = Math.max(2000, Number(intervalSec) * 1000 || 10000);

    return React.createElement('div', { className: 'min-h-screen p-4' },
      React.createElement('div', { className: 'mx-auto max-w-7xl' },
        React.createElement('div', { className: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between' },
          React.createElement('div', null,
            React.createElement('h1', { className: 'text-2xl font-bold tracking-tight' }, 'SCP Live Tracker'),
            React.createElement('p', { className: 'mt-1 text-sm text-zinc-600' }, 'Frontend-only dashboards for multiple Mercury SCPs')
          ),
          React.createElement('div', { className: 'text-xs text-zinc-500' }, 'GET https://remote-ops-mercury-api.sequr.io/v1/{scp}/status/id')
        ),
        React.createElement(Card, { className: 'mt-4' },
          React.createElement(CardHeader, { title: 'Connection Settings', sub: 'Paste your Basic token and add one or more SCP numbers.' }),
          React.createElement(CardContent, null,
            React.createElement('div', { className: 'grid grid-cols-1 gap-3 md:grid-cols-3' },
              React.createElement('div', { className: 'md:col-span-2' },
                React.createElement('label', { className: 'mb-1 block text-xs font-medium' }, 'Authorization (Basic token)'),
                React.createElement(Input, {
                  placeholder: \"Paste token here - either 'Basic xxx' or just the base64 token\",
                  value: token, onChange: function (e) { setToken(e.target.value); }
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'mb-1 block text-xs font-medium' }, 'Polling interval (seconds)'),
                React.createElement(Input, { type: 'number', min: 2, step: 1, value: intervalSec, onChange: function (e) { setIntervalSec(Number(e.target.value)); } })
              )
            ),
            React.createElement('div', { className: 'mt-4 grid grid-cols-1 gap-3 md:grid-cols-3' },
              React.createElement('div', { className: 'md:col-span-2' },
                React.createElement('label', { className: 'mb-1 block text-xs font-medium' }, 'Add SCP number(s)'),
                React.createElement('div', { className: 'flex items-center gap-2' },
                  React.createElement(Input, {
                    placeholder: 'e.g., 6533 or multiple like 6533, 5720, 6001',
                    value: scpInput,
                    onChange: function (e) { setScpInput(e.target.value); },
                    onKeyDown: function (e) { if (e.key === 'Enter') addScps(); }
                  }),
                  React.createElement(Button, { onClick: addScps }, 'Add')
                ),
                React.createElement(SmallLabel, null, 'Tip: You can paste comma or space separated values.')
              ),
              React.createElement('div', { className: 'flex items-end justify-start gap-2' },
                React.createElement(Button, { variant: 'outline', onClick: function(){ location.reload(); } }, 'Reload App'),
                React.createElement(Button, { variant: 'danger', onClick: clearAll }, 'Clear All SCPs')
              )
            ),
            scps.length > 0 ? React.createElement('div', { className: 'mt-3 text-xs text-zinc-500' }, 'Tracking ' + scps.length + ' SCP' + (scps.length > 1 ? 's' : '') + ': ' + scps.join(', ')) : null
          )
        ),
        React.createElement('div', { className: 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' },
          scps.map(function (s, i) {
            return React.createElement(SCPCard, { key: String(s) + '-' + i, scp: s, token: token, intervalMs: intervalMs, onRemove: function(){ removeScp(i); } });
          })
        )
      )
    );
  }

  var root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));

})();