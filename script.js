// ---------- CRC ENGINE ----------
// This is the "brain" of the project: real binary (modulo-2) division.
// No shortcuts, no hardcoded answers — every result is calculated here.

function isBinary(s){ return /^[01]+$/.test(s); }

// Performs modulo-2 (XOR) division of bitsStr by polyStr.
// Returns the remainder and a log of every XOR step (for the "show steps" view).
function crcDivide(bitsStr, polyStr){
  const bits = bitsStr.split('').map(Number);
  const poly = polyStr.split('').map(Number);
  const polyLen = poly.length;
  const steps = [];
  for(let i=0; i <= bits.length - polyLen; i++){
    if(bits[i] === 1){
      const before = bits.slice(i, i+polyLen).join('');
      for(let j=0;j<polyLen;j++){ bits[i+j] ^= poly[j]; }
      const after = bits.slice(i, i+polyLen).join('');
      steps.push({pos:i, before, after});
    }
  }
  const remainder = bits.slice(bits.length - (polyLen-1)).join('');
  return { remainder, steps };
}

// SENDER SIDE: appends (generator length - 1) zeros to the data,
// divides by the generator, and attaches the remainder (CRC) to the data.
function calculateCRC(data, gen){
  const padded = data + '0'.repeat(gen.length - 1);
  const { remainder, steps } = crcDivide(padded, gen);
  const frame = data + remainder;
  return { padded, remainder, frame, steps };
}

// Randomly flips exactly one bit in a frame. Position is chosen dynamically,
// never hardcoded, so every run can corrupt a different bit.
function introduceError(frame){
  const idx = Math.floor(Math.random() * frame.length);
  const chars = frame.split('');
  const originalBit = chars[idx];
  const receivedBit = originalBit === '1' ? '0' : '1';
  chars[idx] = receivedBit;
  return { corrupted: chars.join(''), index: idx, originalBit, receivedBit };
}

// RECEIVER SIDE: divides the received frame by the same generator.
// A remainder of all zeros means no error was detected.
function verifyCRC(frame, gen){
  const { remainder } = crcDivide(frame, gen);
  const ok = !remainder.includes('1');
  return { remainder, ok };
}

function validateInput(data, gen){
  if(!data || !isBinary(data)) return 'Data must be binary (only 0s and 1s).';
  if(!gen || !isBinary(gen) || gen.length < 2) return 'Generator must be binary and at least 2 bits.';
  if(gen[0] !== '1') return 'Generator polynomial must start with 1.';
  return null;
}

// ---------- APP STATE ----------
let state = { frame:null, gen:null, received:null, errorIndex:null, originalBit:null, receivedBit:null };

const dataInput = document.getElementById('data');
const genInput = document.getElementById('gen');
const senderErr = document.getElementById('senderErr');
const senderResult = document.getElementById('senderResult');
const channelBody = document.getElementById('channelBody');
const receiverBody = document.getElementById('receiverBody');

function showSenderError(msg){
  senderErr.textContent = msg;
  senderErr.classList.add('show');
}
function clearSenderError(){
  senderErr.textContent = '';
  senderErr.classList.remove('show');
}

function highlightBit(str, idx){
  return str.split('').map((c,i) => i === idx ? `<span class="flip">${c}</span>` : c).join('');
}

// ---------- SENDER UI ----------
document.getElementById('calcBtn').addEventListener('click', () => {
  clearSenderError();
  const data = dataInput.value.trim();
  const gen = genInput.value.trim();

  const validationError = validateInput(data, gen);
  if(validationError){ showSenderError(validationError); return; }

  const result = calculateCRC(data, gen);
  state.frame = result.frame;
  state.gen = gen;
  state.received = null;
  state.errorIndex = null;
  state.originalBit = null;
  state.receivedBit = null;

  senderResult.innerHTML = `
    <div class="result-grid">
      <div class="result-card crc"><p class="k">CRC remainder</p><p class="v">${result.remainder}</p></div>
      <div class="result-card frame"><p class="k">Transmitted frame</p><p class="v">${result.frame}</p></div>
    </div>
    <button class="steps-toggle" id="stepsToggle">Show calculation steps</button>
    <div class="steps" id="stepsBox">${renderSteps(result)}</div>
  `;
  document.getElementById('stepsToggle').addEventListener('click', (e) => {
    const box = document.getElementById('stepsBox');
    box.classList.toggle('show');
    e.target.textContent = box.classList.contains('show') ? 'Hide calculation steps' : 'Show calculation steps';
  });

  renderChannel();
  renderReceiver();
});

function renderSteps(result){
  let out = `<div>Data + zeros (generator length - 1):  ${result.padded}</div>`;
  out += `<div>Generator:  ${genInput.value.trim()}</div><div> </div>`;
  result.steps.forEach((s, i) => {
    out += `<div>Step ${i+1} — bit at position ${s.pos} is 1, XOR with generator:  <span class="hi">${s.before}</span> -> ${s.after}</div>`;
  });
  out += `<div> </div><div>Final remainder (CRC):  <span class="hi">${result.remainder}</span></div>`;
  out += `<div>Transmitted frame = data + CRC:  ${result.frame}</div>`;
  return out;
}

// ---------- CHANNEL UI ----------
function renderChannel(){
  channelBody.innerHTML = `
    <div class="frame-flow"><span class="box">Sender: ${state.frame}</span><span class="arrow">&rarr;</span><span class="box">Channel</span><span class="arrow">&rarr;</span><span class="box">Receiver</span></div>
    <div class="btn-row">
      <button class="primary" id="sendClean">Send normally</button>
      <button class="danger" id="sendError">Simulate transmission error</button>
    </div>
    <div id="channelCompare"></div>
  `;
  document.getElementById('sendClean').addEventListener('click', () => sendFrame(false));
  document.getElementById('sendError').addEventListener('click', () => sendFrame(true));
}

// Sends the transmitted frame through the simulated channel, optionally
// corrupting one bit, then automatically hands it to the receiver.
function sendFrame(withError){
  const compareEl = document.getElementById('channelCompare');

  if(withError){
    const { corrupted, index, originalBit, receivedBit } = introduceError(state.frame);
    state.received = corrupted;
    state.errorIndex = index;
    state.originalBit = originalBit;
    state.receivedBit = receivedBit;

    compareEl.innerHTML = `
      <div class="result-grid" style="margin-top:14px;">
        <div class="result-card"><p class="k">Original frame</p><p class="v">${highlightBit(state.frame, index)}</p></div>
        <div class="result-card"><p class="k">Received frame</p><p class="v">${highlightBit(corrupted, index)}</p></div>
      </div>
      <p class="empty" style="margin-top:10px;">Transmission error — bit position ${index}: original bit was ${originalBit}, received bit is ${receivedBit}.</p>
    `;
  } else {
    state.received = state.frame;
    state.errorIndex = null;
    state.originalBit = null;
    state.receivedBit = null;

    compareEl.innerHTML = `
      <div class="result-grid" style="grid-template-columns:1fr; margin-top:14px;">
        <div class="result-card"><p class="k">Received frame</p><p class="v">${state.received}</p></div>
      </div>
      <p class="empty" style="margin-top:10px;">Sent with every bit unchanged.</p>
    `;
  }

  renderReceiver();
}

// ---------- RECEIVER UI (automatic verification, no button) ----------
function renderReceiver(){
  if(state.received === null){
    receiverBody.innerHTML = `<p class="empty">Waiting for a frame to arrive from the channel.</p>`;
    return;
  }
  const { remainder, ok } = verifyCRC(state.received, state.gen);
  receiverBody.innerHTML = `
    <div class="result-grid">
      <div class="result-card"><p class="k">Received frame</p><p class="v">${highlightBit(state.received, state.errorIndex)}</p></div>
      <div class="result-card"><p class="k">Remainder at receiver</p><p class="v">${remainder}</p></div>
    </div>
    <div class="badge ${ok ? 'ok' : 'err'}"><span class="sq"></span>${ok ? 'No error detected' : 'Error detected'}</div>
  `;
}

// ---------- RESET ----------
function resetSimulation(){
  dataInput.value = '1101';
  genInput.value = '1011';
  clearSenderError();
  state = { frame:null, gen:null, received:null, errorIndex:null, originalBit:null, receivedBit:null };
  senderResult.innerHTML = `<p class="empty" style="margin-top:16px;">Results will appear here after you calculate the CRC.</p>`;
  channelBody.innerHTML = `<p class="empty">Calculate the CRC first, then send the frame through the channel.</p>`;
  receiverBody.innerHTML = `<p class="empty">Waiting for a frame to arrive from the channel.</p>`;
}
document.getElementById('resetBtn').addEventListener('click', resetSimulation);
