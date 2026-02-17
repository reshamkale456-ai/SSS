const domainConfig = {
  hospital: {
    title: 'Hospital Support',
    description: 'For health or hospital-related situations. Get guidance, emergency references, maps, and support links.',
    camera: true,
    references: [
      { name: 'Google Health Search', url: 'https://www.google.com/search?q=health+symptoms+support' },
      { name: 'YouTube Health Education', url: 'https://www.youtube.com/results?search_query=health+awareness' },
      { name: 'Nearby Hospitals (Google Maps)', url: 'https://www.google.com/maps/search/nearby+hospitals' },
      { name: 'Customer Support Call (Emergency Dial Guide)', url: 'https://www.google.com/search?q=medical+helpline+number' }
    ]
  },
  education: {
    title: 'Education Support',
    description: 'For study plans, learning difficulties, exam strategies, and topic understanding.',
    camera: false,
    references: [
      { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/' },
      { name: 'W3Schools', url: 'https://www.w3schools.com/' },
      { name: 'ChatGPT', url: 'https://chat.openai.com/' },
      { name: 'Gemini', url: 'https://gemini.google.com/' },
      { name: 'Google Search', url: 'https://www.google.com/' },
      { name: 'YouTube Learning', url: 'https://www.youtube.com/' }
    ]
  },
  work: {
    title: 'Work Profession Support',
    description: 'For career, workplace communication, productivity, and profession-specific planning.',
    camera: false,
    references: [
      { name: 'Google Career Search', url: 'https://www.google.com/search?q=professional+development+guide' },
      { name: 'YouTube Professional Skills', url: 'https://www.youtube.com/results?search_query=workplace+skills' }
    ]
  },
  technical: {
    title: 'Technical Support',
    description: 'For software, hardware, coding, debugging, and technical issue-solving.',
    camera: true,
    references: [
      { name: 'Google Technical Search', url: 'https://www.google.com/search?q=technical+issue+solution' },
      { name: 'YouTube Technical Tutorials', url: 'https://www.youtube.com/results?search_query=technical+troubleshooting' }
    ]
  }
};

const tabs = document.querySelectorAll('.tab');
const supportPanel = document.getElementById('support-panel');
const botPanel = document.getElementById('bot-panel');
const domainTitle = document.getElementById('domain-title');
const domainDescription = document.getElementById('domain-description');
const input = document.getElementById('situation-input');
const responseText = document.getElementById('response-text');
const referenceList = document.getElementById('reference-list');
const cameraBlock = document.getElementById('camera-block');
const startCameraBtn = document.getElementById('start-camera-btn');
const captureBtn = document.getElementById('capture-btn');
const imageUpload = document.getElementById('image-upload');
const cameraView = document.getElementById('camera-view');
const captureCanvas = document.getElementById('capture-canvas');
const imagePreview = document.getElementById('image-preview');
const analyseBtn = document.getElementById('analyse-btn');
const speakBtn = document.getElementById('speak-btn');
const voiceInputBtn = document.getElementById('voice-input-btn');

const avatar = document.getElementById('avatar');
const chatLog = document.getElementById('chat-log');
const botInput = document.getElementById('bot-input');
const botSend = document.getElementById('bot-send');
const botSpeak = document.getElementById('bot-speak');

let currentDomain = 'hospital';
let stream;
let latestImageSummary = '';

function setDomain(domain) {
  currentDomain = domain;
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.domain === domain));

  if (domain === 'bot') {
    supportPanel.classList.add('hidden');
    botPanel.classList.remove('hidden');
    return;
  }

  const cfg = domainConfig[domain];
  supportPanel.classList.remove('hidden');
  botPanel.classList.add('hidden');
  domainTitle.textContent = cfg.title;
  domainDescription.textContent = cfg.description;
  cameraBlock.classList.toggle('hidden', !cfg.camera);
  renderReferences(cfg.references);
  responseText.textContent = 'No analysis yet. Enter your situation and click Analyse.';
}

function renderReferences(items) {
  referenceList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = item.name;
    li.appendChild(a);
    referenceList.appendChild(li);
  });
}

function analyzeSituation(text, domain) {
  const trimmed = text.trim();
  if (!trimmed) return 'Please describe your situation so I can analyze and suggest a detailed plan.';

  const lead = {
    hospital: 'Health-focused guidance:',
    education: 'Education-focused guidance:',
    work: 'Work-focused guidance:',
    technical: 'Technical-focused guidance:'
  }[domain];

  return `${lead}\n
1) Understand the main issue: "${trimmed}"\n2) Immediate step: Break the problem into smaller actions and prioritize urgent items.\n3) Practical solution: Follow reliable references below and collect key details before acting.\n4) Next step: Re-check outcomes after each action and adapt the plan.\n5) Safety note: If risk or emergency is involved, contact local support immediately.\n
Auto-search tips:\n- Google query: ${encodeURIComponent(trimmed)}\n- YouTube query: ${encodeURIComponent(trimmed + ' tutorial')}`;
}

function summarizeImage(fileName, domain) {
  const domainHint = domain === 'hospital'
    ? 'Potential health-related context detected from the image; verify with a medical professional.'
    : domain === 'technical'
      ? 'Potential technical object/issue context detected; inspect visible components and error signs.'
      : 'Image received for additional context.';

  return `Image analyzed: ${fileName}. ${domainHint} Use this visual context with your typed situation for better guidance.`;
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported in this browser.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Voice recognition is not supported in this browser.');
    return;
  }

  const recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
  };
  recognition.start();
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraView.srcObject = stream;
    cameraView.style.display = 'block';
  } catch (err) {
    alert(`Unable to access camera: ${err.message}`);
  }
}

function capturePhoto() {
  if (!stream) return;
  const trackSettings = stream.getVideoTracks()[0].getSettings();
  const width = trackSettings.width || 640;
  const height = trackSettings.height || 480;
  captureCanvas.width = width;
  captureCanvas.height = height;
  const ctx = captureCanvas.getContext('2d');
  ctx.drawImage(cameraView, 0, 0, width, height);
  imagePreview.src = captureCanvas.toDataURL('image/png');
  imagePreview.style.display = 'block';
  latestImageSummary = summarizeImage('captured-photo.png', currentDomain);
}

function appendChatMessage(sender, text) {
  const node = document.createElement('div');
  node.className = 'chat-message';
  node.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function botReply(message) {
  const reply = `I understand: "${message}". I can help you with planning, next actions, and references. Tell me your goal or issue type.`;
  appendChatMessage('Bot', reply);
  avatar.classList.add('talking');
  setTimeout(() => avatar.classList.remove('talking'), 800);
  return reply;
}

tabs.forEach((tab) => tab.addEventListener('click', () => setDomain(tab.dataset.domain)));

analyseBtn.addEventListener('click', () => {
  const analysis = analyzeSituation(input.value, currentDomain);
  const imageNote = latestImageSummary ? `\n\nImage context:\n${latestImageSummary}` : '';
  responseText.textContent = analysis + imageNote;
});

speakBtn.addEventListener('click', () => speakText(responseText.textContent));
voiceInputBtn.addEventListener('click', startVoiceInput);
startCameraBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', capturePhoto);

imageUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.style.display = 'block';
  latestImageSummary = summarizeImage(file.name, currentDomain);
});

botSend.addEventListener('click', () => {
  const message = botInput.value.trim();
  if (!message) return;
  appendChatMessage('You', message);
  const response = botReply(message);
  botInput.value = '';
  botSpeak.onclick = () => speakText(response);
});

setDomain(currentDomain);
appendChatMessage('Bot', 'Hello! I am your Smart Support Bot. Ask me anything.');
