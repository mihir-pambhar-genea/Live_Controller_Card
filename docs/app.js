(function () {
  'use strict';

  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo, useRef = React.useRef;
  var createRoot = ReactDOM.createRoot;

  // =============== utilities ===============
  function clsx(){ for(var a=[],i=0;i<arguments.length;i++) arguments[i]&&a.push(arguments[i]); return a.join(' '); }
  function ensureBasicPrefix(token){ if(!token) return ''; var t=String(token).trim(); return t.toLowerCase().indexOf('basic ')===0?t:'Basic '+t; }
  function prettyJSON(o){ try{return JSON.stringify(o,null,2);}catch(e){return String(o);} }

  // Brand / colors
  var ACCENT = { indigo:'#4f46e5', green:'#22c55e', slate:'#0f172a', gray:'#6b7280', bg1:'#f8fafc', ring:'#a5b4fc' };

  // =============== UI atoms ===============
  function Button(p){
    var map={primary:'bg-indigo-600 hover:bg-indigo-700 text-white shadow',
             ghost:'hover:bg-zinc-100',
             outline:'border border-zinc-300 hover:bg-zinc-100',
             danger:'bg-rose-600 hover:bg-rose-700 text-white shadow',
             subtle:'bg-zinc-100 hover:bg-zinc-200'};
    var c=clsx('inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[.98] disabled:opacity-50',
               map[p.variant||'primary'], p.className||'');
    var x=Object.assign({},p); delete x.variant; delete x.className;
    return React.createElement('button',Object.assign({className:c},x),p.children);
  }
  function Input(p){
    var c=clsx('w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400',
               'focus:outline-none focus:ring-2 focus:ring-indigo-500', p.className||'');
    return React.createElement('input',Object.assign({},p,{className:c}));
  }
  function Card(p){
    return React.createElement('div',{
      className:clsx('rounded-3xl border border-zinc-200 bg-white shadow-sm',p.className||''),
      style:p.style
    },p.children);
  }
  function CardHeader(p){
    return React.createElement('div',{className:'flex items-start justify-between gap-2 p-4'},
      React.createElement('div',null,
        React.createElement('h3',{className:'text-base font-semibold'},p.title),
        p.sub?React.createElement('p',{className:'mt-1 text-xs text-zinc-500'},p.sub):null
      ),
      React.createElement('div',{className:'flex items-center gap-2'},p.action)
    );
  }
  function CardContent(p){ return React.createElement('div',{className:'p-4 pt-0'},p.children); }
  function SmallLabel(p){ return React.createElement('span',{className:'text-xs text-zinc-500'},p.children); }
  function Badge(p){
    var s={default:'bg-zinc-100 text-zinc-800', green:'bg-emerald-100 text-emerald-800', red:'bg-rose-100 text-rose-800', yellow:'bg-amber-100 text-amber-800', indigo:'bg-indigo-100 text-indigo-800'};
    return React.createElement('span',{className:clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',s[p.variant||'default'])},p.children);
  }

  // =============== Recharts loader (optional) ===============
  function lazyLoadRecharts(){
    return new Promise(function(resolve){
      if (window.Recharts) return resolve(window.Recharts);
      var s=document.createElement('script');
      s.src='https://unpkg.com/recharts/umd/Recharts.min.js';
      s.defer=true;
      s.onload=function(){ resolve(window.Recharts); };
      document.head.appendChild(s);
    });
  }

  // Donut chart (with fallback)
  function UtilizationDonut(props){
    var capacity=Math.max(0,Number(props.capacity||0));
    var used=Math.min(Math.max(0,Number(props.used||0)),capacity||Number(props.used||0));
    var free=Math.max(0,capacity-used);
    var pctUsed = capacity>0? (used/capacity*100) : 0;
    var pctFree = 100 - pctUsed;

    // Fallback SVG if Recharts not available
    if(!window.Recharts){
      var r=38, s=9, C=r+s, P=2*Math.PI*r, dash=(pctUsed/100)*P;
      return React.createElement('div',{className:'flex items-center gap-4',style:{minHeight:'170px'}},
        React.createElement('svg',{width:2*C,height:2*C},
          React.createElement('defs',null,
            React.createElement('linearGradient',{id:'g1',x1:'0%',y1:'0%',x2:'100%',y2:'0%'},
              React.createElement('stop',{offset:'0%',stopColor:ACCENT.indigo}),
              React.createElement('stop',{offset:'100%',stopColor:ACCENT.green})
            )
          ),
          React.createElement('circle',{cx:C,cy:C,r:r,fill:'none',stroke:'#e5e7eb',strokeWidth:s}),
          React.createElement('circle',{cx:C,cy:C,r:r,fill:'none',stroke:'url(#g1)',strokeWidth:s,strokeDasharray:P,strokeDashoffset:(P-dash),
            transform:'rotate(-90 '+C+' '+C+')',strokeLinecap:'round'})
        ),
        React.createElement('div',null,
          React.createElement('div',{className:'text-2xl font-semibold'},(pctUsed).toFixed(1)+'% used'),
          React.createElement('div',{className:'text-xs text-zinc-500'}, (used||0).toLocaleString(),' / ',(capacity||0).toLocaleString()),
          React.createElement('div',{className:'text-[10px] text-zinc-500'}, (pctFree).toFixed(3)+'% free (',free.toLocaleString(),' cards)')
        )
      );
    }

    var R=window.Recharts, data=React.useMemo(function(){return[
      {name:'Used',value:used, color:ACCENT.indigo},
      {name:'Free',value:free, color:'#e5e7eb'}
    ];},[used,free]);
    return React.createElement('div',{className:'relative h-44 w-full'},
      React.createElement(R.ResponsiveContainer,{width:'100%',height:'100%'},
        React.createElement(R.PieChart,null,
          React.createElement(R.Tooltip,{formatter:function(v,n){return [v,n];}}),
          React.createElement(R.Pie,{data:data,innerRadius:55,outerRadius:75,paddingAngle:2,dataKey:'value',startAngle:90,endAngle:-270},
            data.map(function(d,i){ return React.createElement(R.Cell,{key:'c'+i,fill:d.color}); })
          )
        )
      ),
      React.createElement('div',{className:'pointer-events-none absolute inset-0 flex flex-col items-center justify-center'},
        React.createElement('div',{className:'text-xl font-semibold'},pctUsed.toFixed(3)+'%'),
        React.createElement('div',{className:'text-[10px] text-zinc-500'},used.toLocaleString(),' used · ',free.toLocaleString(),' free')
      )
    );
  }

  // =============== SCP widget ===============
  function SCPCard(props){
    var scp=props.scp, name=props.name||'', token=props.token, intervalMs=props.intervalMs, onRemove=props.onRemove, onRename=props.onRename, locked=!!props.locked;
    var _a=useState(null),data=_a[0],setData=_a[1];
    var _b=useState(''),error=_b[0],setError=_b[1];
    var _c=useState(false),loading=_c[0],setLoading=_c[1];
    var _d=useState(false),paused=_d[0],setPaused=_d[1];
    var _e=useState(false),openJSON=_e[0],setOpenJSON=_e[1];
    var tRef=useRef(null);
    var headers=useMemo(function(){return {'Authorization':ensureBasicPrefix(token),'Content-Type':'application/json'};},[token]);
    var url='https://remote-ops-mercury-api.sequr.io/v1/'+encodeURIComponent(String(scp))+'/status/id';

    var fetchOnce=async function(){
      if(!token){ setError('Missing Basic token'); return; }
      setLoading(true);
      try{
        var res=await fetch(url,{headers:headers});
        if(!res.ok){ var text=await res.text(); throw new Error('HTTP '+res.status+' - '+(text||res.statusText)); }
        var json=await res.json(); setData(json); setError('');
      }catch(e){ setError(e && e.message ? e.message : 'Unknown error'); }
      finally{ setLoading(false); }
    };

    useEffect(function(){
      if (paused) return;
      fetchOnce();
      if(tRef.current) clearInterval(tRef.current);
      tRef.current=setInterval(fetchOnce,intervalMs);
      return function(){ if(tRef.current) clearInterval(tRef.current); };
    },[url, headers.Authorization, intervalMs, paused]);

    var d=(data&&data.data)||{}, derived=d.derived||{};
    var fw=derived.firmware_version || ((d.sft_rev_major!=null&&d.sft_rev_minor!=null)? String(d.sft_rev_major)+'.'+String(d.sft_rev_minor).slice(0,2)+'.x' : '-');
    var model=derived.model||'-', mac=derived.mac||d.mac_addr||'-';
    var scpNumber=(derived.scp_number!=null?derived.scp_number:(d.scp_number!=null?d.scp_number:scp));
    var capacity=Number(derived.cards_capacity!=null?derived.cards_capacity:(d.db_max!=null?d.db_max:0))||0;
    var total=Number(derived.total_cards!=null?derived.total_cards:(d.db_active!=null?d.db_active:0))||0;
    var available=Math.max(0,capacity-total);
    var badge = error ? React.createElement(Badge,{variant:'red'},'Error')
                      : (loading ? React.createElement(Badge,{variant:'yellow'},'Loading...')
                                : React.createElement(Badge,{variant:'green'},'Live'));

    // header: Name (big), indicator pills; actions right
    return React.createElement(Card,{
      className: 'relative flex flex-col h-full overflow-hidden',
      style:{ resize:'both', overflow:'auto', minWidth:'320px', minHeight:'260px' }
    },
      React.createElement('div',{className:'h-1 w-full',style:{background:'linear-gradient(90deg,'+ACCENT.indigo+','+ACCENT.green+')'}}),
      React.createElement('div',{className:'flex items-start justify-between p-4'},
        React.createElement('div',null,
          React.createElement('div',{className:'flex items-center gap-2'},
            React.createElement('h3',{className:'text-lg font-semibold tracking-tight'}, name || 'Controller'),
            React.createElement(Badge,{variant:'indigo'}, 'Widget')
          ),
          React.createElement('div',{className:'mt-1 flex items-center gap-2'},
            badge, React.createElement(SmallLabel,null,'Polling every '+Math.round(intervalMs/1000)+'s')
          )
        ),
        React.createElement('div',{className:'flex items-center gap-2'},
          React.createElement(Button,{variant:'subtle',onClick:fetchOnce},'Refresh'),
          React.createElement(Button,{variant:'subtle',onClick:function(){setPaused(function(p){return !p;});}}, paused?'Resume':'Pause'),
          !locked && React.createElement(Button,{variant:'danger',onClick:onRemove},'Remove')
        )
      ),

      React.createElement(CardContent,null,
        React.createElement('div',{className:'grid grid-cols-1 gap-4 md:grid-cols-2'},
          React.createElement('div',null,React.createElement(UtilizationDonut,{capacity:capacity,used:total})),
          React.createElement('div',{className:'flex flex-col justify-center gap-2'},
            React.createElement('div',{className:'grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 text-sm'},
              React.createElement('div',{className:'text-zinc-500'},'Firmware'),  React.createElement('div',{className:'font-medium'},fw),
              React.createElement('div',{className:'text-zinc-500'},'Model'),     React.createElement('div',{className:'font-medium'},model),
              React.createElement('div',{className:'text-zinc-500'},'MAC'),       React.createElement('div',{className:'font-medium font-mono'},mac),
              React.createElement('div',{className:'text-zinc-500'},'SCP'),       React.createElement('div',{className:'font-medium font-mono text-indigo-700'},scpNumber),
              React.createElement('div',{className:'text-zinc-500'},'Capacity'),  React.createElement('div',{className:'font-medium'},capacity.toLocaleString()),
              React.createElement('div',{className:'text-zinc-500'},'Total Cards'),React.createElement('div',{className:'font-medium'},total.toLocaleString()),
              React.createElement('div',{className:'text-zinc-500'},'Available'), React.createElement('div',{className:'font-medium text-emerald-700'},available.toLocaleString())
            ),
            React.createElement('div',{className:'mt-3 flex items-center gap-2'},
              React.createElement(Button,{variant:'outline',onClick:function(){setOpenJSON(true);}},'Full JSON'),
              error?React.createElement('span',{className:'text-xs text-rose-600'},error):null
            ),
            onRename && React.createElement('div',{className:'mt-1 flex items-center gap-2'},
              React.createElement(Input,{placeholder:'Widget name (shown to everyone)',value:name,onChange:function(e){onRename(e.target.value);}}),
              React.createElement(SmallLabel,null,'Name syncs via Export/Import config')
            )
          )
        )
      ),

      openJSON && React.createElement('div',{className:'fixed inset-0 z-50 grid place-items-center bg-black/40 p-4',onClick:function(){setOpenJSON(false);}},
        React.createElement('div',{className:'max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-xl',onClick:function(e){e.stopPropagation();}},
          React.createElement('div',{className:'flex items-center justify-between border-b p-4'},
            React.createElement('span',{className:'text-sm font-semibold'},'Full response (SCP '+scpNumber+')'),
            React.createElement(Button,{variant:'ghost',onClick:function(){setOpenJSON(false);}},'Close')
          ),
          React.createElement('div',{className:'max-h-[70vh] overflow-auto p-4'},
            React.createElement('pre',{className:'whitespace-pre-wrap break-words text-xs leading-relaxed'},prettyJSON(data||{error:error||'No data yet'}))
          )
        )
      )
    );
  }

  // =============== Auth screens ===============
  function LoginView(p){
    var _a=useState('admin'), role=_a[0], setRole=_a[1];
    var _b=useState(''), email=_b[0], setEmail=_b[1];
    var _c=useState(''), pass=_c[0], setPass=_c[1];
    var _d=useState(''), err=_d[0], setErr=_d[1];

    var rootEl=document.getElementById('root');
    var logoSrc=(rootEl && rootEl.getAttribute('data-logo-src')) || '';

    function submit(){
      var ok=(role==='admin' && email==='mpambhar@getgenea.com' && pass==='Sequr@1') ||
             (role==='user'  && email==='developer@sequr.io'     && pass==='Welcome@1');
      if(ok) p.onLogin({role:role,email:email});
      else setErr('Invalid credentials');
    }

    return React.createElement('div',{className:'min-h-screen grid place-items-center',style:{background:'linear-gradient(180deg,#eef2ff,#ffffff)'}},
      React.createElement('div',{className:'w-full max-w-md'},
        logoSrc ? React.createElement('div',{className:'flex justify-center mb-6'},
          React.createElement('img',{src:logoSrc,alt:'Genea',className:'h-12 opacity-90'})) : null,
        React.createElement('div',{className:'rounded-3xl border border-zinc-200 bg-white shadow-sm'},
          React.createElement('div',{className:'p-4 border-b'},
            React.createElement('h2',{className:'text-lg font-semibold'},'Sign in'),
            React.createElement('p',{className:'text-xs text-zinc-500'},'Choose Admin or User and log in.')
          ),
          React.createElement('div',{className:'p-4'},
            React.createElement('div',{className:'mb-3 flex gap-2'},
              React.createElement(Button,{variant:role==='admin'?'primary':'subtle',onClick:function(){return setRole('admin');}},'Admin'),
              React.createElement(Button,{variant:role==='user'?'primary':'subtle',onClick:function(){return setRole('user');}},'User')
            ),
            React.createElement('label',{className:'block text-xs font-medium mb-1'},'Email'),
            React.createElement(Input,{value:email,onChange:function(e){setEmail(e.target.value);},placeholder:'you@example.com'}),
            React.createElement('label',{className:'block text-xs font-medium mt-3 mb-1'},'Password'),
            React.createElement(Input,{type:'password',value:pass,onChange:function(e){setPass(e.target.value);},placeholder:'••••••••'}),
            err && React.createElement('div',{className:'mt-3 text-xs text-rose-600'},err),
            React.createElement('div',{className:'mt-4 flex justify-end'},
              React.createElement(Button,{onClick:submit},'Sign in')
            )
          )
        )
      )
    );
  }

  // =============== Projects ===============
  function ProjectsView(p){
    return React.createElement('div',{className:'min-h-screen p-6',style:{background:'linear-gradient(180deg,#ffffff,#f8fafc)'}},
      React.createElement('div',{className:'mx-auto max-w-5xl'},
        React.createElement('div',{className:'flex items-center justify-between'},
          React.createElement('h1',{className:'text-2xl font-bold'},'Projects'),
          React.createElement('div',{className:'text-sm text-zinc-500'}, p.role==='admin'?'Admin Dashboard':'User Dashboard')
        ),
        React.createElement('button',{onClick:function(){return p.onOpen('scp');},className:'mt-4 w-full text-left'},
          React.createElement('div',{className:'rounded-3xl border border-zinc-200 bg-white shadow-sm hover:shadow focus:outline-none focus:ring-2',style:{borderColor:ACCENT.ring}},
            React.createElement('div',{className:'h-1 w-full',style:{background:'linear-gradient(90deg,'+ACCENT.indigo+','+ACCENT.green+')'}}),
            React.createElement('div',{className:'p-4'},
              React.createElement('h3',{className:'text-base font-semibold'},'Live Controller Card Count'),
              React.createElement('p',{className:'mt-1 text-xs text-zinc-500'},'Live view of cards usage per SCP.')
            )
          )
        ),
        React.createElement('div',{className:'mt-6'},
          React.createElement(Button,{variant:'outline',onClick:p.onLogout},'Log out')
        )
      )
    );
  }

  // =============== Dashboard ===============
  function Dashboard(p){
    var STORAGE_KEY='scp-tracker-state-v2';
    var _a=useState(''), token=_a[0], setToken=_a[1];
    var _b=useState(10), intervalSec=_b[0], setIntervalSec=_b[1];
    var intervalMs=Math.max(2000,Number(intervalSec)*1000||10000);
    var _c=useState([]), widgets=_c[0], setWidgets=_c[1];
    var _d=useState(''), scpInput=_d[0], setScpInput=_d[1];
    var _e=useState(''), nameInput=_e[0], setNameInput=_e[1];

    useEffect(function(){
      try{ var s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
        if(s.token) setToken(s.token);
        if(typeof s.intervalSec==='number') setIntervalSec(s.intervalSec);
        if(Array.isArray(s.widgets)) setWidgets(s.widgets);
      }catch(e){}
      lazyLoadRecharts(); // try to load charts ASAP
    },[]);
    useEffect(function(){ localStorage.setItem(STORAGE_KEY,JSON.stringify({token:token,intervalSec:intervalSec,widgets:widgets})); },[token,intervalSec,widgets]);

    function addWidgets(locked){
      if(!scpInput.trim()) return;
      var parts=scpInput.split(/[\s,]+/).map(function(s){return s.trim();}).filter(Boolean).map(function(s){return(/^\d+$/.test(s)?Number(s):s);});
      var newOnes=parts.map(function(v){return{scp:v,name:nameInput.trim(),locked:!!locked};});
      setWidgets(dedupe((widgets||[]).concat(newOnes))); setScpInput(''); setNameInput('');
    }
    function dedupe(arr){ var seen={}; return arr.filter(function(w){var k=String(w.scp).trim(); if(seen[k]) return false; seen[k]=true; return true;}); }
    function removeAt(i){ var c=widgets.slice(); c.splice(i,1); setWidgets(c); }
    function renameAt(i,v){ var c=widgets.slice(); c[i]=Object.assign({},c[i],{name:v}); setWidgets(c); }
    function exportConfig(withToken){ var d={intervalSec:intervalSec,widgets:widgets}; if(withToken) d.token=token;
      var b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='scp-dashboard-config.json'; a.click(); URL.revokeObjectURL(a.href); }
    function importConfig(file){ if(!file) return; var r=new FileReader(); r.onload=function(){ try{ var j=JSON.parse(r.result||'{}');
      if(j.token) setToken(j.token); if(typeof j.intervalSec==='number') setIntervalSec(j.intervalSec); if(Array.isArray(j.widgets)) setWidgets(j.widgets); alert('Config imported.'); }catch(e){ alert('Failed to import: '+(e&&e.message)); } }; r.readAsText(file); }

    return React.createElement('div',{className:'min-h-screen p-4',style:{background:'linear-gradient(180deg,#ffffff,'+ACCENT.bg1+')'}},
      React.createElement('div',{className:'mx-auto max-w-7xl'},
        React.createElement('div',{className:'flex items-center justify-between'},
          React.createElement('h1',{className:'text-2xl font-bold'},'Live Controller Card Count'),
          React.createElement('div',{className:'text-xs text-zinc-500'}, p.role==='admin'?'Admin Dashboard':'User Dashboard')
        ),

        // Admin panel (token, interval, locked add, import/export)
        p.role==='admin' && React.createElement(Card,{className:'mt-4'},
          React.createElement('div',{className:'h-1 w-full',style:{background:'linear-gradient(90deg,'+ACCENT.indigo+','+ACCENT.green+')'}}),
          React.createElement(CardHeader,{title:'Admin Settings',sub:'Set token, polling, add/lock widgets for all users.'}),
          React.createElement(CardContent,null,
            React.createElement('div',{className:'grid grid-cols-1 gap-3 md:grid-cols-3'},
              React.createElement('div',{className:'md:col-span-2'},
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Authorization (Basic token)'),
                React.createElement(Input,{placeholder:"Paste token here - either 'Basic xxx' or just the base64 token",value:token,onChange:function(e){setToken(e.target.value);}})
              ),
              React.createElement('div',null,
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Polling interval (seconds)'),
                React.createElement(Input,{type:'number',min:2,step:1,value:intervalSec,onChange:function(e){setIntervalSec(Number(e.target.value));}})
              )
            ),
            React.createElement('div',{className:'mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'},
              React.createElement('div',{className:'md:col-span-2'},
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Add widget(s) by SCP number'),
                React.createElement('div',{className:'flex items-center gap-2'},
                  React.createElement(Input,{placeholder:'e.g., 6533 or multiple like 6533, 5720, 6001',value:scpInput,onChange:function(e){setScpInput(e.target.value);},onKeyDown:function(e){if(e.key==='Enter') addWidgets(true);}}),
                  React.createElement(Button,{onClick:function(){addWidgets(true);}},'Add (locked for users)')
                ),
                React.createElement(SmallLabel,null,'Tip: comma or space separated values.')
              ),
              React.createElement('div',null,
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Widget name (optional)'),
                React.createElement(Input,{placeholder:'e.g., HQ Lobby Controller',value:nameInput,onChange:function(e){setNameInput(e.target.value);}})
              )
            ),
            React.createElement('div',{className:'mt-4 flex flex-wrap items-center gap-2'},
              React.createElement(Button,{variant:'outline',onClick:function(){exportConfig(true);}},'Export config (with token)'),
              React.createElement(Button,{variant:'outline',onClick:function(){exportConfig(false);}},'Export config (no token)'),
              React.createElement('label',{className:'inline-flex items-center gap-2 text-sm cursor-pointer'},
                React.createElement('input',{type:'file',accept:'.json,application/json',className:'hidden',onChange:function(e){importConfig((e.target.files||[])[0]);}}),
                React.createElement('span',{className:'rounded-2xl border px-4 py-2 hover:bg-zinc-100'},'Import config')
              ),
              React.createElement(Button,{variant:'outline',onClick:p.onBack},'Back to Projects')
            )
          )
        ),

        // User add panel
        p.role!=='admin' && React.createElement(Card,{className:'mt-4'},
          React.createElement('div',{className:'h-1 w-full',style:{background:'linear-gradient(90deg,'+ACCENT.indigo+','+ACCENT.green+')'}}),
          React.createElement(CardHeader,{title:'User Settings',sub:'Add your own widgets (admin widgets are locked).'}),
          React.createElement(CardContent,null,
            React.createElement('div',{className:'grid grid-cols-1 gap-3 md:grid-cols-3'},
              React.createElement('div',{className:'md:col-span-2'},
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Add widget(s) by SCP number'),
                React.createElement('div',{className:'flex items-center gap-2'},
                  React.createElement(Input,{placeholder:'e.g., 6533 or multiple like 6533, 5720, 6001',value:scpInput,onChange:function(e){setScpInput(e.target.value);},onKeyDown:function(e){if(e.key==='Enter') addWidgets(false);}}),
                  React.createElement(Button,{onClick:function(){addWidgets(false);}},'Add')
                ),
                React.createElement(SmallLabel,null,'Widgets you add are removable; admin widgets are not.')
              ),
              React.createElement('div',null,
                React.createElement('label',{className:'mb-1 block text-xs font-medium'},'Widget name (optional)'),
                React.createElement(Input,{placeholder:'e.g., East Gate',value:nameInput,onChange:function(e){setNameInput(e.target.value);}})
              ),
              React.createElement('div',null,
                React.createElement(Button,{variant:'outline',onClick:p.onBack},'Back to Projects')
              )
            )
          )
        ),

        // Grid of widgets (auto-height rows so resized cards don't overlap)
        React.createElement(
          'div',
          {
            className:
              'mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ' +
              '[grid-auto-rows:minmax(300px,auto)] items-stretch',
          },
          (widgets || []).map(function (w, i) {
            return React.createElement(
              'div',
              { key: String(w.scp) + '-' + i, className: 'flex flex-col' },
              React.createElement(SCPCard, {
                scp: w.scp,
                name: w.name || '',
                locked: !!w.locked,
                token: token,
                intervalMs: intervalMs,
                onRemove: function () {
                  if (w.locked && p.role !== 'admin') return; // users can't remove admin-locked widgets
                  removeAt(i);
                },
                onRename: p.role === 'admin' ? function (v) { renameAt(i, v); } : null,
              })
            );
          })
        ),

        // Footer actions
        React.createElement('div',{className:'mt-6 flex items-center gap-2'},
          React.createElement(Button,{variant:'outline',onClick:function(){location.reload();}},'Reload App'),
          React.createElement(Button,{variant:'danger',onClick:function(){setWidgets([]);}},'Clear All Widgets'),
          React.createElement('div',{className:'grow'}),
          React.createElement(Button,{variant:'outline',onClick:p.onLogout},'Log out')
        )
      )
    );
  }

  // =============== Root (routing) ===============
  function App(){
    var AUTH_KEY='scp-auth';
    var _a=useState(null), auth=_a[0], setAuth=_a[1];
    var _b=useState('login'), view=_b[0], setView=_b[1];

    useEffect(function(){
      try{ var s=JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); if(s && s.role){ setAuth(s); setView('projects'); } }catch(e){}
    },[]);
    function handleLogin(info){ setAuth(info); localStorage.setItem(AUTH_KEY,JSON.stringify(info)); setView('projects'); }
    function logout(){ setAuth(null); localStorage.removeItem(AUTH_KEY); setView('login'); }

    if(view==='login')    return React.createElement(LoginView,{onLogin:handleLogin});
    if(view==='projects') return React.createElement(ProjectsView,{role:auth&&auth.role,onOpen:function(){setView('dashboard');},onLogout:logout});
    return React.createElement(Dashboard,{role:auth&&auth.role,onBack:function(){setView('projects');},onLogout:logout});
  }

  var root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));

})();