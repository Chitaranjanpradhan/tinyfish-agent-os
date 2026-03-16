// TinyFish Agent OS — popup.js (no inline handlers)

const TINYFISH_SSE = "https://agent.tinyfish.ai/v1/automation/run-sse";
// API key moved to config.js - import it in manifest.json

const AGENTS = [
  {
    id: "travel", icon: "✈️", label: "Travel", color: "#3b82f6",
    fields: [
      { key: "from", label: "From", placeholder: "Delhi" },
      { key: "to", label: "To", placeholder: "Mumbai" },
      { key: "dates", label: "Date", placeholder: "2026-04-10" },
      { key: "travelers", label: "Travelers", placeholder: "1 adult" },
    ],
    getSites(f) {
      return [
        { url: `https://www.makemytrip.com/flight/search?itinerary=${cc(f.from)}-${cc(f.to)}-${fd(f.dates)}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`, label: "MakeMyTrip" },
        { url: `https://www.ixigo.com/search/result/flight?from=${cc(f.from)}&to=${cc(f.to)}&date=${fdi(f.dates)}&adults=1&children=0&infants=0&class=e`, label: "ixigo" },
        // { url: `https://www.goibibo.com/flights/results/?ver=2&s_city=${cc(f.from)}&d_city=${cc(f.to)}&s_date=${fdg(f.dates)}&adults=1&children=0&infants=0&class=e`, label: "Goibibo" },
      ];
    },
    buildGoal(f, site) {
      return `Extract first 8 visible flights with INR prices. Do NOT scroll, sort, or wait for more results. Return JSON immediately: {"site":"${site.label}","flights":[{"airline":"","flight_no":"","departure":"","arrival":"","duration":"","stops":0,"price_inr":""}],"cheapest_price":""}`;
    },
  },
  {
    id: "sdr", icon: "🎯", label: "SDR", color: "#06b6d4",
    fields: [
      { key: "company", label: "Company URL", placeholder: "infosys.com" },
      { key: "role", label: "Target Role", placeholder: "CTO, VP Engineering..." },
      { key: "product", label: "Your Product", placeholder: "We help with..." },
    ],
    getSites(f) {
      const base = fu(f.company);
      return [
        { url: base, label: "Company Site" },
        { url: base.replace(/\/$/, "") + "/about", label: "Leadership" },
        { url: `https://www.crunchbase.com/organization/${ed(f.company)}`, label: "Crunchbase" },
      ];
    },
    buildGoal(f, site) {
      if (site.label === "Company Site") return `Research ${f.company}. Return ONLY JSON: {"name":"str","industry":"str","size":"str","tech_signals":["str"],"recent_news":["str"]}`;
      if (site.label === "Leadership") return `Find executives matching "${f.role || "VP Director Head CTO CEO"}" on this page. Check /about /leadership /team. Return ONLY JSON: {"executives":[{"name":"str","title":"str"}],"employee_count":"str"}`;
      return `Find this company on Crunchbase. Return ONLY JSON: {"total_funding":"str","last_round":"str","investors":["str"]}`;
    },
  },
  {
    id: "jobs", icon: "👥", label: "Jobs", color: "#f43f5e",
    fields: [
      { key: "company", label: "Company", placeholder: "microsoft.com" },
      { key: "role", label: "Role", placeholder: "Software Engineer" },
      { key: "location", label: "Location", placeholder: "India, Remote..." },
    ],
    getSites(f) {
      return [
        { url: fu(f.company), label: "Careers" },
        { url: `https://www.naukri.com/${ed(f.company)}-jobs${f.location ? "-in-" + f.location.toLowerCase().replace(/\s+/g,"-") : ""}`, label: "Naukri" },
      ];
    },
    buildGoal(f, site) {
      if (site.label === "Careers") return `Find careers page at ${f.company}. Navigate to ATS if present (Greenhouse/Lever/Ashby). Extract ${f.role||"all"} jobs${f.location?" in "+f.location:""}. Return ONLY JSON: {"careers_url":"str","ats_platform":"str","jobs":[{"title":"str","department":"str","location":"str","level":"str","apply_url":"str"}]}`;
      return `Search Naukri for ${f.role||"all"} jobs at ${ed(f.company)}${f.location?" in "+f.location:""}. Return ONLY JSON: {"jobs":[{"title":"str","location":"str","salary":"str","experience":"str","apply_url":"str"}]}`;
    },
  },
  {
    id: "compliance", icon: "🛡️", label: "Monitor", color: "#f59e0b",
    fields: [
      { key: "url", label: "Page to Monitor", placeholder: "stripe.com/pricing" },
      { key: "compare1", label: "Competitor (optional)", placeholder: "paypal.com/pricing" },
      { key: "focus", label: "What to Watch", placeholder: "pricing, fees, terms..." },
    ],
    getSites(f) {
      return [
        { url: fu(f.url), label: "Your Page" },
        ...(f.compare1 ? [{ url: fu(f.compare1), label: "Competitor" }] : []),
      ];
    },
    buildGoal(f) {
      return `Extract all content relevant to: ${f.focus||"pricing, terms, policies"}. Return ONLY JSON: {"page_title":"str","key_items":[{"category":"str","item":"str","value":"str"}],"executive_summary":"str"}`;
    },
  },
  {
    id: "custom", icon: "⚡", label: "Custom", color: "#64748b",
    fields: [
      { key: "url", label: "Target URL", placeholder: "https://any-website.com" },
      { key: "goal", label: "What to do", placeholder: "Extract all product prices...", textarea: true },
    ],
    getSites(f) { return [{ url: fu(f.url), label: "Target" }]; },
    buildGoal(f) { return f.goal || "Extract all visible data and return as JSON"; },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────
const IATA = {"delhi":"DEL","new delhi":"DEL","mumbai":"BOM","bombay":"BOM","bangalore":"BLR","bengaluru":"BLR","chennai":"MAA","kolkata":"CCU","hyderabad":"HYD","pune":"PNQ","goa":"GOI","jaipur":"JAI","kochi":"COK"};
function cc(city) { return IATA[(city||"").toLowerCase()] || (city||"DEL").toUpperCase().slice(0,3); }
function fd(d) { if(!d) return "01/04/2026"; const dt=new Date(d); return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`; }
function fdi(d) { if(!d) return "01042026"; const dt=new Date(d); return `${String(dt.getDate()).padStart(2,"0")}${String(dt.getMonth()+1).padStart(2,"0")}${dt.getFullYear()}`; }
function fdg(d) { if(!d) return "20260401"; const dt=new Date(d); return `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,"0")}${String(dt.getDate()).padStart(2,"0")}`; }
function fu(url) { if(!url) return "https://example.com"; url=url.trim(); if(url.startsWith("http")) return url; return url.includes(".")?`https://${url}`:`https://${url}.com`; }
function ed(url) { return (url||"").replace(/https?:\/\//,"").replace("www.","").split(".")[0].toLowerCase(); }

// ─── State ────────────────────────────────────────────────────────────
let activeAgent = AGENTS[0];
let fields = {};
let running = false;
let allFlights = [];
let selectedFlightIdx = 0;

// ─── Init ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || "";
    const el = document.getElementById("currentUrl");
    if (el) el.textContent = url.replace(/https?:\/\//,"").slice(0,28);
  });

  renderTabs();
  renderForm();

  // Wire up run button — no inline handler
  document.getElementById("runBtn").addEventListener("click", runAgent);
  document.getElementById("bookBtn").addEventListener("click", bookFlight);
});

// ─── Render tabs ──────────────────────────────────────────────────────
function renderTabs() {
  const container = document.getElementById("agentTabs");
  container.innerHTML = "";
  AGENTS.forEach((a, i) => {
    const btn = document.createElement("button");
    btn.className = "agent-btn" + (a.id === activeAgent.id ? " active" : "");
    btn.style.setProperty("--c", a.color);
    btn.textContent = `${a.icon} ${a.label}`;
    if (a.id === activeAgent.id) {
      btn.style.color = a.color;
      btn.style.borderColor = a.color;
      btn.style.background = a.color + "18";
    }
    btn.addEventListener("click", () => selectAgent(i));
    container.appendChild(btn);
  });
}

function selectAgent(i) {
  activeAgent = AGENTS[i];
  fields = {};
  allFlights = [];
  renderTabs();
  renderForm();
  clearLog();
  clearResult();
  const btn = document.getElementById("runBtn");
  btn.style.background = activeAgent.color;
  btn.textContent = "▶ Launch Agent";
  btn.disabled = false;
}

// ─── Render form ──────────────────────────────────────────────────────
function renderForm() {
  const container = document.getElementById("formArea");
  container.innerHTML = "";
  activeAgent.fields.forEach(f => {
    const div = document.createElement("div");
    div.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = f.label;
    div.appendChild(lbl);
    let input;
    if (f.textarea) {
      input = document.createElement("textarea");
      input.placeholder = f.placeholder || "";
      input.value = fields[f.key] || "";
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = f.placeholder || "";
      input.value = fields[f.key] || "";
    }
    input.addEventListener("input", () => { fields[f.key] = input.value; });
    div.appendChild(input);
    container.appendChild(div);
  });
}

// ─── Run agent ────────────────────────────────────────────────────────
async function runAgent() {
  if (running) return;
  const firstField = activeAgent.fields[0];
  if (!fields[firstField.key]) {
    addLog(`⚠ Please fill in: ${firstField.label}`, "error");
    return;
  }

  running = true;
  allFlights = [];
  clearLog();
  clearResult();

  const btn = document.getElementById("runBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Running...";
  btn.style.background = "#1e293b";
  setStatus("Running...");

  const sites = activeAgent.getSites(fields);
  addLog(`▶ ${activeAgent.label} — ${sites.length} sites`, "nav");
  addLog(`⚡ Running in parallel...`, "action");

  try {
    const results = await Promise.all(sites.map(async (site) => {
      addLog(`🌐 [${site.label}] ${site.url.slice(0,50)}`, "nav");
      const goal = activeAgent.buildGoal(fields, site);
      try {
        const result = await callTinyFish(site.url, goal);
        addLog(`✓ [${site.label}] Done`, "complete");
        return { site: site.label, data: result };
      } catch (err) {
        addLog(`✗ [${site.label}] ${err.message.slice(0,80)}`, "error");
        return { site: site.label, data: null };
      }
    }));

    const ok = results.filter(r => r.data).length;
    addLog(`✅ Complete — ${ok}/${sites.length} succeeded`, "complete");
    setStatus(`Done · ${ok} sites`);
    renderResults(results);

  } catch (err) {
    addLog(`✗ ${err.message}`, "error");
    setStatus("Error");
  }

  running = false;
  btn.disabled = false;
  btn.textContent = "▶ Launch Agent";
  btn.style.background = activeAgent.color;
}

// ─── TinyFish API call ────────────────────────────────────────────────
async function callTinyFish(url, goal) {
  const API_KEY = CONFIG.TINYFISH_API_KEY; // Get from config
  const res = await fetch(TINYFISH_SSE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ url, goal, browser_profile: "stealth" }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${err.slice(0,100)}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        const msg = evt.message || evt.action || evt.thought || evt.description;
        if (msg) addLog(`→ ${msg.slice(0,70)}`, "action");
        if (evt.type === "COMPLETE" || evt.status === "COMPLETED") {
          let r = evt.resultJson ?? evt.result ?? evt.data ?? null;
          if (typeof r === "string") { try { r = JSON.parse(r); } catch {} }
          return r;
        }
        if (evt.type === "ERROR" || evt.status === "FAILED") throw new Error(msg || "Agent failed");
      } catch (e) { if (e.message !== "Agent failed" && !e.message.includes("JSON")) continue; else throw e; }
    }
  }
  return null;
}

// ─── Render results ───────────────────────────────────────────────────
function renderResults(results) {
  if (activeAgent.id === "travel") renderTravel(results);
  else if (activeAgent.id === "sdr") renderSDR(results);
  else if (activeAgent.id === "jobs") renderJobs(results);
  else renderGeneric(results);
}

function renderTravel(results) {
  const container = document.getElementById("resultArea");
  container.style.display = "block";

  // Debug: Log what each site returned
  results.forEach(r => {
    const count = r.data?.flights?.length || 0;
    addLog(`[${r.site}] returned ${count} flights`, count > 0 ? "complete" : "error");
  });

  const raw = results.flatMap(r => (r.data?.flights || []).map(f => ({ ...f, source: r.site })));

  // Normalize price — add ₹ if missing
  raw.forEach(f => {
    if (f.price_inr && !String(f.price_inr).startsWith("₹")) {
      f.price_inr = "₹" + f.price_inr;
    }
    f._priceNum = parseInt((f.price_inr||"").replace(/[^0-9]/g,"")) || 999999;
  });

  // Sort by price
  raw.sort((a, b) => a._priceNum - b._priceNum);

  // Deduplicate — same flight_no + departure = same flight, keep cheapest
  const seen = new Set();
  allFlights = raw.filter(f => {
    const key = `${(f.flight_no||f.airline||"").replace(/\s+/g,"").toLowerCase()}-${(f.departure||"").replace(/\s+/g,"")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!allFlights.length) {
    container.textContent = "No flights found. Try again.";
    return;
  }

  const totalRaw = raw.length;
  container.innerHTML = `<div style="font-size:10px;color:#3b82f6;font-weight:700;margin-bottom:6px">✈️ ${allFlights.length} Flights (${totalRaw - allFlights.length} duplicates removed) — Click to select</div>`;

  allFlights.slice(0, 8).forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "flight-card" + (i === 0 ? " sel" : "");
    div.innerHTML = `
      <div class="fc-top">
        <span class="fc-airline">${i===0?'<span style="font-size:9px;background:#3b82f622;color:#3b82f6;padding:1px 6px;border-radius:10px;margin-right:4px">CHEAPEST</span>':''}${f.airline}${f.flight_no?' <span style="font-size:10px;color:#334155">'+f.flight_no+'</span>':''}</span>
        <span class="fc-price">${f.price_inr}</span>
      </div>
      <div class="fc-meta">${f.departure||""} → ${f.arrival||""} · ${f.duration||""} · ${f.stops===0?"Nonstop":(f.stops||"?")+' stop'} · ${f.source}</div>
    `;
    div.addEventListener("click", () => {
      document.querySelectorAll(".flight-card").forEach(el => el.classList.remove("sel"));
      div.classList.add("sel");
      selectedFlightIdx = i;
    });
    container.appendChild(div);
  });

  document.getElementById("bookBtn").style.display = "block";
}

async function bookFlight() {
  const flight = allFlights[selectedFlightIdx];
  if (!flight) return;

  // Collect passenger details
  const name = prompt("Passenger Name:", "John Doe");
  const age = prompt("Age:", "30");
  const email = prompt("Email:", "john@example.com");
  const phone = prompt("Phone:", "+919876543210");
  if (!name || !age || !email || !phone) return;

  const btn = document.getElementById("bookBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Booking...";
  addLog(`🎫 Starting booking for ${flight.airline} ${flight.price_inr}`, "action");

  const sites = activeAgent.getSites(fields);
  const targetSite = sites.find(s => s.label === flight.source);
  if (!targetSite) {
    addLog("✗ Could not find booking site", "error");
    btn.disabled = false;
    btn.textContent = "🎫 Book Selected Flight";
    return;
  }

  try {
    // Step 1: Login with OTP
    addLog("📱 Requesting OTP...", "action");
    const loginGoal = `Go to ${flight.source}. If login required: Click login/signup, enter phone "${phone}", click Send OTP. Return JSON: {"status":"otp_sent","message":"OTP sent"}`;
    await callTinyFish(targetSite.url, loginGoal);
    
    const otp = prompt("Enter OTP received on your phone:");
    if (!otp) {
      addLog("✗ OTP not provided", "error");
      btn.disabled = false;
      btn.textContent = "🎫 Book Selected Flight";
      return;
    }

    addLog("🔐 Submitting OTP...", "action");
    const otpGoal = `Enter OTP "${otp}" and submit. Return JSON: {"status":"logged_in"}`;
    await callTinyFish(targetSite.url, otpGoal);

    // Step 2: Book flight
    addLog("✈️ Booking flight...", "action");
    let bookingGoal = `Book flight: ${flight.airline} ${flight.flight_no || ""} ${flight.departure} → ${flight.arrival}. 
Fill: Name="${name}", Age="${age}", Email="${email}", Phone="${phone}". 
If OTP requested during booking, click Send OTP and return {"status":"otp_required_booking"}. 
Otherwise proceed to payment (DO NOT pay). Capture current URL. Return JSON: {"status":"ready_for_payment","booking_reference":"string","total_price":"string","payment_url":"<current_url>"}`;
    
    let result = await callTinyFish(targetSite.url, bookingGoal);
    
    // Handle additional OTP if needed
    if (result?.status === "otp_required_booking") {
      const otp2 = prompt("Another OTP required. Enter OTP:");
      if (!otp2) {
        addLog("✗ OTP not provided", "error");
        btn.disabled = false;
        btn.textContent = "🎫 Book Selected Flight";
        return;
      }
      addLog("🔐 Submitting booking OTP...", "action");
      const otp2Goal = `Enter OTP "${otp2}" and continue booking. Proceed to payment (DO NOT pay). Return JSON: {"status":"ready_for_payment","booking_reference":"string","total_price":"string","payment_url":"<current_url>"}`;
      result = await callTinyFish(targetSite.url, otp2Goal);
    }
    
    if (result?.status === "ready_for_payment") {
      addLog(`✅ Booking ready! Ref: ${result.booking_reference}`, "complete");
      addLog(`💳 Total: ${result.total_price}`, "complete");
      
      let paymentUrl = result.payment_url;
      // Always use correct payment URL format for each site
      if (result.booking_reference) {
        if (flight.source === "MakeMyTrip") {
          paymentUrl = `https://payments.makemytrip.com/checkout/?id=${result.booking_reference}&region=in`;
        } else if (flight.source === "Goibibo") {
          paymentUrl = `https://payments.goibibo.com/checkout/?id=${result.booking_reference}&region=in`;
        } else if (flight.source === "Cleartrip") {
          paymentUrl = `https://www.cleartrip.com/payment/${result.booking_reference}`;
        } else if (flight.source === "EaseMyTrip") {
          paymentUrl = `https://www.easemytrip.com/payment/checkout?bookingId=${result.booking_reference}`;
        } else if (result.payment_url) {
          // ixigo uses session URLs - use what API returned
          paymentUrl = result.payment_url;
        }
      }
      
      if (paymentUrl) {
        addLog(`🔗 Payment: ${paymentUrl}`, "complete");
        const paymentBox = document.createElement("div");
        paymentBox.style.cssText = "margin:10px 0;padding:12px;background:#10b98110;border:1px solid #10b98133;border-radius:8px";
        paymentBox.innerHTML = `
          <div style="font-size:11px;font-weight:700;color:#10b981;margin-bottom:6px">💳 Complete Payment</div>
          <a href="${paymentUrl}" target="_blank" style="color:#10b981;font-size:11px;word-break:break-all">${paymentUrl}</a>
          <button onclick="navigator.clipboard.writeText('${paymentUrl}');this.textContent='✓ Copied'" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;border:1px solid #10b98133;background:#10b98111;color:#10b981;font-size:11px;cursor:pointer">Copy Link</button>
        `;
        document.getElementById("resultArea").appendChild(paymentBox);
        chrome.tabs.create({ url: paymentUrl });
      }
    } else {
      addLog("⚠ Booking incomplete", "error");
    }
  } catch (err) {
    addLog(`✗ ${err.message}`, "error");
  }

  btn.disabled = false;
  btn.textContent = "🎫 Book Selected Flight";
}

function renderSDR(results) {
  const container = document.getElementById("resultArea");
  container.style.display = "block";
  const site = results[0]?.data;
  const leadership = results[1]?.data;
  const crunchbase = results[2]?.data;
  const name = site?.name || fields.company || "Company";
  const tech = [...new Set([...(site?.tech_signals||[]),...(leadership?.tech_signals||[])])].slice(0,4);
  const execs = leadership?.executives || [];
  const news = site?.recent_news?.[0] || "";
  const firstName = execs[0]?.name?.split(" ")?.[0] || "there";
  const product = fields.product || "our solution";
  const techHook = tech.slice(0,2).join(" and ") || site?.industry || "your industry";
  const hook = news ? news.slice(0,80) : crunchbase?.last_round ? `your ${crunchbase.last_round}` : `${name}'s growth`;

  const emailSubject = `${name} — ${tech[0]||site?.industry||"partnership"} question`;
  const emailBody = `Hi ${firstName},\n\nSaw ${hook} — impressive momentum.\n\nI help ${site?.industry||"your industry"} teams with ${product}. Given your ${techHook}, I think there's a real fit.\n\nOpen to a 15-min call this week?\n\nBest`;

  container.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#06b6d4;margin-bottom:3px">${name}</div>
    <div style="font-size:10px;color:#334155;margin-bottom:8px">${site?.industry||""} · ${leadership?.employee_count||""}</div>
    <div style="margin-bottom:8px">${tech.map(t=>`<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;background:#06b6d418;color:#06b6d4;border:1px solid #06b6d433;margin:2px">${t}</span>`).join("")}</div>
    ${execs.length>0?`<div style="font-size:10px;color:#475569;margin-bottom:8px">👤 ${execs.map(e=>`${e.name} (${e.title})`).join(" · ")}</div>`:""}
    <div style="background:#06b6d408;border:1px solid #06b6d422;border-radius:7px;padding:10px">
      <div style="font-size:9px;color:#06b6d4;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px">✉ Generated Email</div>
      <div style="font-size:11px;font-weight:600;color:#cbd5e1;margin-bottom:4px">Subject: ${emailSubject}</div>
      <div id="emailBodyText" style="font-size:10px;color:#64748b;line-height:1.7;white-space:pre-wrap">${emailBody}</div>
    </div>
  `;

  const copyBtn = document.createElement("button");
  copyBtn.id = "copyEmailBtn";
  copyBtn.textContent = "Copy Email";
  copyBtn.style.cssText = "width:100%;margin-top:7px;padding:7px;border-radius:5px;border:1px solid #06b6d433;background:#06b6d411;color:#06b6d4;font-size:11px;cursor:pointer;font-weight:600;";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`).then(() => {
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => copyBtn.textContent = "Copy Email", 2000);
    });
  });
  container.appendChild(copyBtn);
}

function renderJobs(results) {
  const container = document.getElementById("resultArea");
  container.style.display = "block";
  const allJobs = results.flatMap(r => (r.data?.jobs||[]).map(j => ({ ...j, source: r.site })));

  if (!allJobs.length) {
    container.textContent = "No jobs found.";
    return;
  }

  container.innerHTML = `<div style="font-size:10px;color:#f43f5e;font-weight:700;margin-bottom:6px">💼 ${allJobs.length} Jobs Found</div>`;
  allJobs.slice(0, 8).forEach(j => {
    const div = document.createElement("div");
    div.className = "job-row";
    div.innerHTML = `
      <div style="flex:1;min-width:0">
        <div class="job-title">${j.title}</div>
        <div class="job-meta">${j.location||""} ${j.salary?"· "+j.salary:""} ${j.source?"· "+j.source:""}</div>
      </div>
    `;
    if (j.apply_url) {
      const a = document.createElement("a");
      a.href = j.apply_url;
      a.target = "_blank";
      a.className = "apply-btn";
      a.textContent = "Apply ↗";
      div.appendChild(a);
    }
    container.appendChild(div);
  });
}

function renderGeneric(results) {
  const container = document.getElementById("resultArea");
  container.style.display = "block";
  const pre = document.createElement("pre");
  pre.style.cssText = "font-size:10px;color:#64748b;white-space:pre-wrap;word-break:break-word;";
  pre.textContent = JSON.stringify(results.map(r => r.data).filter(Boolean), null, 2).slice(0, 2000);
  container.innerHTML = "";
  container.appendChild(pre);
}

// ─── Log helpers ──────────────────────────────────────────────────────
function addLog(msg, type = "action") {
  const el = document.getElementById("logArea");
  const empty = el.querySelector(".l-empty");
  if (empty) empty.remove();
  const line = document.createElement("div");
  line.className = "l-" + type;
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function clearLog() {
  document.getElementById("logArea").innerHTML = '<span class="l-empty">// Agent standing by...</span>';
}

function clearResult() {
  const el = document.getElementById("resultArea");
  el.style.display = "none";
  el.innerHTML = "";
  document.getElementById("bookBtn").style.display = "none";
}

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = text;
}
