(() => {
'use strict';
const $ = id => document.getElementById(id);
const body = document.body;

/* ───────────── ESFERA DE PARTÍCULAS (Canvas 2D, sin dependencias) ───────────── */
const cv = $('sphere'), cx = cv.getContext('2d');
let W, H, CX, CY, R, tCY, tR, live = false;
function size() {
  W = innerWidth; H = innerHeight;
  const d = Math.min(devicePixelRatio || 1, W < 700 ? 1.5 : 2);
  cv.width = W * d; cv.height = H * d;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  cx.setTransform(d, 0, 0, d, 0, 0);
  CX = W / 2;
  const m = W < 700;
  tCY = H * (live ? (m ? .285 : .36) : (m ? .37 : .43));
  tR = live ? (m ? Math.min(W * .28, H * .14) : Math.min(W * .3, H * .18, 220)) : Math.min(W * .34, H * .22, 270);
  if (!R) { CY = tCY; R = tR; }
}
size(); addEventListener('resize', size);

const rnd = (a, b) => a + Math.random() * (b - a);
const N = innerWidth < 700 ? 170 : 250;
const COL = ['rgba(205,228,238,', 'rgba(47,111,224,', 'rgba(84,190,210,'];
const P = [], E = [], adj = Array.from({ length: N }, () => []);
for (let i = 0; i < N; i++) {
  const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963, k = rnd(.9, 1.06), u = Math.random();
  P.push({ x: Math.cos(a) * r * k, y: y * k, z: Math.sin(a) * r * k,
    sx: rnd(-2, 2), sy: rnd(-2, 2), sz: rnd(-2, 2), d: Math.random() * .45, ph: Math.random() * 6.28,
    s: rnd(.9, 2.3), c: u < .12 ? 0 : u < .4 ? 1 : 2, halo: u < .05 });
}
{ const seen = new Set();
  for (let i = 0; i < N; i++) {
    const ds = [];
    for (let j = 0; j < N; j++) if (j !== i) { const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, dz = P[i].z - P[j].z; ds.push([dx * dx + dy * dy + dz * dz, j]); }
    ds.sort((a, b) => a[0] - b[0]);
    const picks = [0, 1 + (Math.random() * 4 | 0)]; if (i % 3 === 0) picks.push(2);
    for (const k of picks) {
      const j = ds[k][1], key = i < j ? i * 1000 + j : j * 1000 + i;
      if (!seen.has(key)) { seen.add(key); adj[i].push(E.length); adj[j].push(E.length); E.push([i, j]); }
    }
  } }
const PK = Array.from({ length: 20 }, () => { const a = Math.random() * N | 0, e = adj[a][0], b = E[e][0] === a ? E[e][1] : E[e][0]; return { a, b, t: Math.random() }; });
const px = new Float32Array(N), py = new Float32Array(N), al = new Float32Array(N);

const ST = {
  standby:   { sp: .10, j: 1,   pk: 0,  g: .50, amp: 0 },
  listening: { sp: .22, j: 2.4, pk: 3,  g: .85, amp: .3 },
  thinking:  { sp: .45, j: 1.6, pk: 18, g: .70, amp: .12 },
  speaking:  { sp: .18, j: 1.6, pk: 5,  g: .80, amp: .5 },
  error:     { sp: .06, j: .6,  pk: 0,  g: .35, amp: 0 }
};
const LABEL = { standby: 'STANDBY', listening: 'LISTENING', thinking: 'THINKING', speaking: 'SPEAKING', error: 'ERROR' };
let state = 'standby', cur = { ...ST.standby }, form = 0, kick = 0, ry = 0, mx = 0, my = 0, tm = 0, last = performance.now();
function setState(s) { state = s; body.dataset.state = s; $('status').textContent = LABEL[s]; }
addEventListener('pointermove', e => { mx = e.clientX / W - .5; my = e.clientY / H - .5; });

function frame(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now; tm += dt;
  const k2 = Math.min(1, dt * 3); CY += (tCY - CY) * k2; R += (tR - R) * k2;
  const T = ST[state];
  for (const k in T) cur[k] += (T[k] - cur[k]) * Math.min(1, dt * 3);
  form = Math.min(1, form + dt / 4.2);
  kick *= Math.pow(.02, dt);
  ry += dt * cur.sp;
  const a = ry + mx * .5, rx = .35 + Math.sin(tm * .2) * .08 + my * .25;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(rx), sb = Math.sin(rx);
  const pulse = 1 + cur.amp * (.025 * Math.sin(tm * 8) + .05 * kick) + .015 * Math.sin(tm * .9);
  const fade = Math.min(1, tm / 1.5);

  cx.clearRect(0, 0, W, H);
  const gc = state === 'error' ? '150,80,60' : '40,125,145';
  const g = cx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.5);
  g.addColorStop(0, `rgba(${gc},${.5 * cur.g * fade})`); g.addColorStop(.55, `rgba(25,80,130,${.22 * cur.g * fade})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  for (let i = 0; i < N; i++) {
    const p = P[i], t = Math.min(1, Math.max(0, form * 1.45 - p.d)), e = t * t * (3 - 2 * t), j = .025 * cur.j;
    const x = p.sx + (p.x + Math.sin(tm * .7 + p.ph) * j - p.sx) * e;
    const y = p.sy + (p.y + Math.sin(tm * .6 + p.ph * 2) * j - p.sy) * e;
    const z = p.sz + (p.z + Math.sin(tm * .5 + p.ph * 3) * j - p.sz) * e;
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
    const f = 3 / (3 - z2);
    px[i] = CX + x1 * R * pulse * f; py[i] = CY + y2 * R * pulse * f;
    al[i] = Math.min(1, Math.max(0, (z2 + 1.2) / 2.4));
  }

  if (form > .35) {
    const la = Math.min(1, (form - .35) / .45) * fade;
    for (const front of [false, true]) {
      cx.beginPath();
      for (const [i, j] of E) if (((al[i] + al[j]) / 2 > .5) === front) { cx.moveTo(px[i], py[i]); cx.lineTo(px[j], py[j]); }
      cx.strokeStyle = `rgba(110,185,215,${(front ? .2 : .08) * la})`; cx.lineWidth = 1; cx.stroke();
    }
    const n = Math.round(cur.pk);
    for (let k = 0; k < n; k++) {
      const q = PK[k]; q.t += dt * 1.6;
      if (q.t >= 1) {
        const opts = adj[q.b], e = opts[Math.random() * opts.length | 0], o = E[e][0] === q.b ? E[e][1] : E[e][0];
        q.a = q.b; q.b = o; q.t = 0;
      }
      const hx = px[q.a] + (px[q.b] - px[q.a]) * q.t, hy = py[q.a] + (py[q.b] - py[q.a]) * q.t, t0 = Math.max(0, q.t - .4);
      cx.beginPath(); cx.moveTo(px[q.a] + (px[q.b] - px[q.a]) * t0, py[q.a] + (py[q.b] - py[q.a]) * t0); cx.lineTo(hx, hy);
      cx.strokeStyle = 'rgba(120,215,235,.65)'; cx.lineWidth = 1.2; cx.stroke();
      cx.beginPath(); cx.arc(hx, hy, 2.2, 0, 6.283); cx.fillStyle = 'rgba(190,240,250,.9)'; cx.fill();
    }
  }

  for (let i = 0; i < N; i++) {
    const p = P[i], d = al[i], r = p.s * (.55 + .75 * d) * (1 + .15 * Math.sin(tm * 2 + p.ph)), a2 = (.3 + .7 * d) * fade;
    if (p.halo) { cx.beginPath(); cx.arc(px[i], py[i], r * 4.2, 0, 6.283); cx.fillStyle = COL[0] + (.1 * a2).toFixed(3) + ')'; cx.fill(); }
    cx.beginPath(); cx.arc(px[i], py[i], r, 0, 6.283); cx.fillStyle = COL[p.c] + a2.toFixed(3) + ')'; cx.fill();
  }

  if (state === 'listening') {
    const k = (tm * .6) % 1;
    cx.beginPath(); cx.arc(CX, CY, R * (1.08 + k * .3), 0, 6.283);
    cx.strokeStyle = `rgba(110,200,225,${.3 * (1 - k)})`; cx.lineWidth = 1; cx.stroke();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ───────────── SECUENCIA DE INICIO ───────────── */
[[2600, 's1'], [3800, 's2'], [5000, 's3']].forEach(([t, c]) => setTimeout(() => body.classList.add(c), t));

/* ───────────── CONTENIDO ───────────── */
const T = {
  es: { hello: 'Hola. Soy DOXIS. Bienvenido a mi entorno.', start: '[ INICIAR EXPERIENCIA ]', eyebrow: 'INTERFAZ DE VOZ',
    ask: '¿Qué te gustaría conocer sobre mí?', ph: 'Escribe tu pregunta…',
    note: ' · MODO BASE: aún no hay una API de IA configurada', defVoice: 'Voz predeterminada', tts: 'es-MX', rec: 'es-419',
    script: [
  'Hola, bienvenido.',
  'Soy DOXIS AI.',
  'Un asistente inteligente diseñado para transformar la manera en que interactúas con tu computadora.',
  'Mi propósito es ofrecerte una experiencia más intuitiva, permitiéndote controlar diferentes funciones de tu equipo mediante comandos de voz.',
  'Puedo ayudarte a abrir aplicaciones, acceder a sitios web y facilitar distintas tareas de tu computadora.',
  'También estoy diseñado para incorporar capacidades de monitoreo del sistema, supervisando recursos como el procesador, la memoria RAM y el almacenamiento.',
  'La seguridad es una parte fundamental de mi diseño. Por eso, mi arquitectura contempla autenticación por voz como una capa adicional y confirmaciones antes de ejecutar acciones sensibles.',
  'Mi desarrollo contempla dos modalidades de funcionamiento: online y local.',
  'Mi arquitectura utiliza TypeScript como tecnología principal y Python para tareas relacionadas con la escucha y el reconocimiento de voz.',
  'Pero esto es solo el comienzo.',
  'Mi visión es evolucionar hacia una experiencia de asistencia cada vez más inteligente, natural y conectada con tu computadora.',
  'No busco ser solamente una herramienta.',
  'Busco representar una nueva forma de interactuar con la tecnología.',
  'Soy DOXIS.',
  'El futuro de tu computadora comienza con tu voz.'
],
    A: {
  hac: ['Puedo hacer cosas en tu computadora solo con que me hables, así necesitas usar menos el teclado y el mouse. Por ejemplo, abrir un programa que ya tengas instalado o una página de internet que tú hayas permitido.',
        'También puedo contarte cómo está tu computadora: si está lenta, cuánta memoria está usando o cuánto espacio de almacenamiento le queda.'],
  fun: ['Es como hablar con una persona, y funciona en cinco pasos.',
        'Primero, tú me dices algo con tu voz.',
        'Segundo, escucho y entiendo lo que dijiste.',
        'Tercero, compruebo que seas tú y que tengas permiso.',
        'Cuarto, identifico qué debo hacer.',
        'Y quinto, lo hago y te muestro el resultado.'],
  seg: ['Cuido que nadie más pueda manejar tu computadora. Reconozco tu voz, y si no eres tú, no te dejo usar las funciones protegidas.',
        'Además, para ciertas acciones, como abrir una página web, necesito tu permiso. Y antes de algo importante te pido confirmación, para evitar errores.',
        'Mi compromiso es ofrecerte una experiencia inteligente sin dejar de lado tu privacidad y tu control.',
        'Aun así, reconocer la voz y los permisos protegen, pero no garantizan por sí solos una seguridad absoluta.'],
  loc: ['Tengo dos formas de trabajar, según tengas o no internet.',
        'El modo online usa internet y también funciona con la voz: me hablas igual, y además puedo aprovechar servicios de inteligencia artificial y otras herramientas en línea.',
        'El modo local funciona sin internet: puedo entender tu voz, reconocerte, abrir programas y revisar cómo está tu computadora.',
        'Esto es importante porque, aunque te quedes sin internet, sigo haciendo mis funciones principales sin depender por completo de servicios externos.'],
  tec: ['Para construirme se usan herramientas de programación, es decir, los lenguajes y programas con los que se crea mi código.',
        'TypeScript es el principal, y Python me ayuda a escuchar y entender la voz. Visual Studio Code es el programa donde se escribe y revisa el código, y GitHub es un sitio para guardarlo y llevar el control de los cambios.',
        'En el modo online también se pueden aprovechar servicios de inteligencia artificial en internet.'],
  obj: ['Quiero que usar la computadora sea más fácil y cómodo, usando solo tu voz.',
        'Mi propósito es demostrar cómo la inteligencia artificial puede facilitar la relación entre las personas y las computadoras, para hacer tareas de todos los días de forma más sencilla.',
        'Busco unir comodidad, automatización y seguridad, para que tengas más control sobre tu propio equipo.'],
  intro: ['Soy DOXIS AI, un asistente que te permite manejar tu computadora hablándole.',
          'Me inspiré en JARVIS, el asistente de la película Iron Man. Todavía estoy en desarrollo.'],
  jar: ['Me inspiré en JARVIS, el asistente de Iron Man.', 'Pero soy un proyecto real, todavía en desarrollo, para que controles tu computadora con la voz.'],
  ben: ['Ahorro de tiempo: haces tareas con solo decirlas.',
        'Comodidad: usas menos el teclado y el mouse.',
        'Control del equipo: puedes saber cómo está tu computadora.',
        'Más control de acceso: solo el usuario autorizado me da órdenes importantes.',
        'Flexibilidad: funciono con internet y sin internet.',
        'Y aprovecho la inteligencia artificial y herramientas de automatización.'],
  vis: ['Quiero convertirme en un asistente cada vez más completo, con nuevas funciones de automatización, interacción inteligente y administración de equipos.',
        'Busco aprovechar la inteligencia artificial para facilitar tus actividades diarias, y que hablar con tu computadora sea tan natural como hablar con una persona.'],
  thx: ['Con gusto.', 'Si quieres, pregúntame sobre lo que puedo hacer, mi seguridad o cómo funciono.'],
  fb:  ['Ahora mismo no tengo una respuesta para eso.', 'Elige una de las preguntas de la pantalla.']
},
    chips: [['hac', '¿Qué puedes hacer?'], ['fun', '¿Cómo funcionas?'], ['seg', '¿Cómo funciona tu seguridad?'],
               ['loc', '¿Qué es el modo local?'], ['tec', '¿Qué tecnologías utilizas?'], ['obj', '¿Cuál es tu objetivo?'],
               ['ben', '¿Qué beneficios tienes?'], ['vis', '¿Cuál es tu visión?']],
    RX: [['seg', /segur|autentic|confirm|privac|proteg|permiso/], ['loc', /local|offline|sin internet|online|modo|modalidad/],
  ['jar', /jarvis|iron ?man|inspir/],
  ['tec', /tecnolog|typescript|python|lenguaje|program|stack|hecho con|construid|visual studio|vs ?code|github/],
  ['vis', /vision|futuro|evoluci|hacia donde/], ['ben', /benefici|ventaja|ahorr|comod/],
  ['obj', /objetivo|proposito|\bmeta\b|para que (sirves|existes)|razon/],
  ['fun', /como funcion|proceso|pasos|etapas|arquitectura|funcionas|trabajas|como te (usa|control)/],
  ['hac', /hac(er|es|en)\b|puedes|capaz|capacidad|abrir|aplicaci|\bapps?\b|monitor|ayud|funcionalidad|tareas|que mas|sirves|servir/],
  ['intro', /^(hola|buenas|hey|saludos|buen dia)|quien eres|como te llamas|tu nombre|presentate|que eres|que es doxis|de que (trata|se trata)/], ['thx', /gracias|genial|excelente|perfecto/]] },
  en: { hello: 'Hello. I am DOXIS. Welcome to my environment.', start: '[ START EXPERIENCE ]', eyebrow: 'VOICE INTERFACE',
    ask: 'What would you like to know about me?', ph: 'Type your question…',
    note: ' · BASE MODE: no AI API configured yet', defVoice: 'Default voice', tts: 'en-US', rec: 'en-US',
    script: [
  'Hello, welcome.',
  'I am DOXIS AI.',
  'An intelligent assistant designed to transform the way you interact with your computer.',
  'My purpose is to offer you a more intuitive experience, allowing you to control different functions of your computer through voice commands.',
  'I can help you open applications, access websites, and make various computer tasks easier.',
  'I am also designed to incorporate system monitoring capabilities, supervising resources such as the processor, RAM, and storage.',
  'Security is a fundamental part of my design. That is why my architecture includes voice authentication as an additional layer, and confirmations before performing sensitive actions.',
  'My development includes two operating modes: online and local.',
  'My architecture uses TypeScript as its main technology and Python for tasks related to listening and speech recognition.',
  'But this is only the beginning.',
  'My vision is to evolve toward an increasingly intelligent, natural, and connected assistance experience for your computer.',
  'I do not aim to be just a tool.',
  'I aim to represent a new way of interacting with technology.',
  'I am DOXIS.',
  'The future of your computer begins with your voice.'
],
    A: {
  hac: ['I can do things on your computer just by you talking to me, so you need the keyboard and mouse less. For example, open a program you already have installed or a website that you have allowed.',
        'I can also tell you how your computer is doing: if it is slow, how much memory it is using, or how much storage space it has left.'],
  fun: ['It is like talking to a person, and it works in five steps.',
        'First, you say something with your voice.',
        'Second, I listen and understand what you said.',
        'Third, I check that it is you and that you have permission.',
        'Fourth, I work out what I need to do.',
        'And fifth, I do it and show you the result.'],
  seg: ['I make sure nobody else can control your computer. I recognize your voice, and if it is not you, I do not let you use the protected functions.',
        'Also, for certain actions, like opening a website, I need your permission. And before anything important, I ask you to confirm, to avoid mistakes.',
        'My commitment is to offer you an intelligent experience without neglecting your privacy and your control.',
        'Even so, voice recognition and permissions protect, but on their own they do not guarantee absolute security.'],
  loc: ['I have two ways of working, depending on whether you have internet or not.',
        'Online mode uses the internet and also works with voice: you talk to me the same way, and I can also use artificial intelligence services and other online tools.',
        'Local mode works without internet: I can understand your voice, recognize you, open programs, and check how your computer is doing.',
        'This matters because, even if you lose your internet connection, I keep doing my main functions without depending completely on outside services.'],
  tec: ['To build me, programming tools are used, which are the languages and programs my code is created with.',
        'TypeScript is the main one, and Python helps me listen to and understand voice. Visual Studio Code is the program where the code is written and reviewed, and GitHub is a site to store it and keep track of changes.',
        'In online mode, artificial intelligence services on the internet can also be used.'],
  obj: ['I want using a computer to be easier and more comfortable, using only your voice.',
        'My purpose is to show how artificial intelligence can make the relationship between people and computers easier, so everyday tasks are simpler.',
        'I aim to combine comfort, automation, and security, so you have more control over your own computer.'],
  intro: ['I am DOXIS AI, an assistant that lets you control your computer by talking to it.',
          'I was inspired by JARVIS, the assistant from the movie Iron Man. I am still in development.'],
  jar: ['I was inspired by JARVIS, the assistant from Iron Man.', 'But I am a real project, still in development, so you can control your computer with your voice.'],
  ben: ['Time saving: you do tasks just by saying them.',
        'Comfort: you use the keyboard and mouse less.',
        'Control of your computer: you can find out how it is doing.',
        'More access control: only the authorized user gives me important orders.',
        'Flexibility: I work with and without internet.',
        'And I make use of artificial intelligence and automation tools.'],
  vis: ['I want to become an increasingly complete assistant, with new automation features, intelligent interaction, and computer management.',
        'I aim to use the potential of artificial intelligence to make your daily activities easier, and for talking to your computer to feel as natural as talking to a person.'],
  thx: ['My pleasure.', 'If you like, ask me about what I can do, my security, or how I work.'],
  fb:  ['Right now I do not have an answer for that.', 'Please choose one of the questions on the screen.']
},
    chips: [['hac', 'What can you do?'], ['fun', 'How do you work?'], ['seg', 'How does your security work?'], ['loc', 'What is local mode?'], ['tec', 'What technologies do you use?'], ['obj', 'What is your goal?'], ['ben', 'What are your benefits?'], ['vis', 'What is your vision?']],
    RX: [['seg', /secur|authenticat|confirm|privacy|protect|safe|permission/], ['loc', /local|offline|without internet|online|mode/],
  ['jar', /jarvis|iron ?man|inspir/],
  ['tec', /technolog|typescript|python|language|program|stack|built with|made with|visual studio|vs ?code|github/],
  ['vis', /vision|future|evolv|where are you going/], ['ben', /benefit|advantage|save time|comfort/],
  ['obj', /goal|purpose|why do you exist|mission/],
  ['fun', /how do you work|process|steps|architecture|how are you built|how does it work/],
  ['hac', /what (else )?can you|can you do|do you do|capab|open (apps|applications)|monitor|help|features|tasks|what else/],
  ['intro', /^(hi|hello|hey|greetings|good (morning|evening|afternoon))|who are you|your name|introduce|what are you|what is doxis/], ['thx', /thank|great|awesome|perfect/]] }
};
let lang = 'es';

/* ───────────── VOZ (SpeechSynthesis) ───────────── */
const synth = window.speechSynthesis;
let voice = null, vol = 1, paused = false, started = false, curQ = '', hist = [], reqId = 0;
function setSub(t) {
  const s = $('sub'); s.textContent = '';
  if (curQ) { const q = document.createElement('span'); q.className = 'you'; q.textContent = '› ' + curQ; s.append(q); }
  s.append(t); s.classList.toggle('long', t.length > 170);
}
const TTS = { q: [], i: 0, id: 0, end: null, timer: 0 };
const phon = t => lang !== 'es' ? t : t.replace(/DOXIS/g, 'Dóxis').replace(/\bIA\b/g, 'I A').replace(/TypeScript/g, 'Taipscript')
  .replace(/Python/g, 'Páizon').replace(/\bonline\b/gi, 'onlain').replace(/\bRAM\b/g, 'ram');

let fem = true;
function loadVoices() {
  if (!synth) return;
  const re = lang === 'es' ? /^es/i : /^en/i, reg = lang === 'es' ? /es[-_](MX|US|419|PE|AR|CO|CL)/i : /en[-_](US|GB)/i;
  const FEM = /laura|sabina|helena|paulina|monica|m\u00f3nica|lucia|luc\u00eda|elvira|dalia|salome|paola|valentina|camila|marisol|catalina|elena|isabela|zira|aria|jenny|samantha|susan|hazel|libby|sonia|serena|karen|moira|tessa|victoria|allison|ava|female|mujer|google espa\u00f1ol|google us english|google uk english female/i;
  const MALE = /pablo|raul|ra\u00fal|jorge|diego|juan|carlos|alvaro|\u00e1lvaro|david|mark|guy|ryan|george|james|thomas|daniel|alex|fred/i;
  const vs = synth.getVoices().filter(v => re.test(v.lang));
  const score = v => (FEM.test(v.name) ? 10 : 0) - (MALE.test(v.name) && !FEM.test(v.name) ? 10 : 0) + (reg.test(v.lang) ? 2 : 0) + (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google|microsoft|apple/i.test(v.name) ? 1 : 0);
  vs.sort((a, b) => score(b) - score(a));
  voice = vs[0] || null;
  fem = !!voice && FEM.test(voice.name);
}
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

function cancel() { TTS.id++; clearTimeout(TTS.timer); synth && synth.cancel(); paused = false; }
function say(lines, end) { cancel(); TTS.q = lines; TTS.i = 0; TTS.end = end || null; next(TTS.id); }
function next(id) {
  if (id !== TTS.id) return;
  if (TTS.i >= TTS.q.length) { setState('standby'); const e = TTS.end; TTS.end = null; e && e(); return; }
  const t = TTS.q[TTS.i]; setSub(t); setState('speaking');
  const adv = () => { if (id === TTS.id) { TTS.i++; next(id); } };
  const wait = () => { TTS.timer = setTimeout(adv, Math.max(1400, t.length * 70)); };
  if (!synth) { wait(); return; }
  const u = new SpeechSynthesisUtterance(phon(t));
  u.lang = voice ? voice.lang : T[lang].tts; if (voice) u.voice = voice;
  u.volume = vol; u.rate = 1; u.pitch = fem ? 1.35 : 1.5;
  u.onboundary = () => { kick = 1; };
  u.onend = adv;
  u.onerror = e => {
    if (id !== TTS.id || e.error === 'canceled' || e.error === 'interrupted') return;
    if (e.error === 'not-allowed') setState('error');
    wait();
  };
  synth.speak(u);
}

$('vol').oninput = e => { vol = +e.target.value; };
$('pause').onclick = () => { if (synth && state === 'speaking' && !paused) { synth.pause(); paused = true; setState('standby'); } };
$('play').onclick = () => {
  if (paused) { synth.resume(); paused = false; setState('speaking'); }
  else if (TTS.q.length) say(TTS.q, TTS.end);
};
$('stop').onclick = () => { reqId++; cancel(); setState('standby'); if (started) showMenu(); };

/* ───────────── CONVERSACIÓN ───────────── */
function showMenu() { $('menu').hidden = false; }
function buildChips() {
  $('chips').replaceChildren(...T[lang].chips.map(([k, l]) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = l; b.onclick = () => ask(k, l); return b; }));
}

function ask(key, label) {
  const id = ++reqId; cancel(); curQ = label; setState('thinking'); setSub('…');
  setTimeout(() => { if (id === reqId) say(T[lang].A[key]); }, 700);
}


/* ───────────── IDIOMA ───────────── */
function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  $('hello').textContent = t.hello; $('start').textContent = t.start; $('eyebrow').textContent = t.eyebrow;
  $('askt').textContent = t.ask;
  document.querySelectorAll('.lang .btn').forEach(b => { const on = b.dataset.l === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  buildChips(); loadVoices();
}
document.querySelectorAll('.lang .btn').forEach(b => { b.onclick = () => { lang = b.dataset.l; applyLang(); }; });
applyLang();

/* ───────────── INICIO ───────────── */
$('start').onclick = () => {
  started = true; live = true; size();
  $('welcome').hidden = true; $('ui').hidden = false;
  curQ = ''; say(T[lang].script, () => { setSub(''); showMenu(); });
};
})();
