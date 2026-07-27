// src/App.jsx
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './index.css';

/* --- utility: localStorage --- */
const saveToLocal = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const loadFromLocal = (k, fallback) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback; } catch(e){ return fallback; }
};

/* --- normalize incoming rows into {id, question, options[], answerIndex} --- */
function normalizeQuestion(obj) {
  const q = { id: obj.id || uuidv4(), question: '', options: [], answerIndex: 0 };

  if (typeof obj === 'string') {
    q.question = obj;
    q.options = obj.options || [];
    return q;
  }

  q.question = obj.question || obj.Question || obj.QuestionText || obj.Q || '';

  if (Array.isArray(obj.options) && obj.options.length) {
    q.options = obj.options;
  } else {
    const opts = [];
    [
      'optionA','optionB','optionC','optionD',
      'OptionA','OptionB','OptionC','OptionD',
      'A','B','C','D','a','b','c','d'
    ].forEach(k => {
      if (obj[k] !== undefined && obj[k] !== '') opts.push(String(obj[k]));
    });
    [0,1,2,3].forEach(i => {
      if (obj[i] !== undefined) opts.push(String(obj[i]));
    });
    q.options = opts;
  }

  // 1) if file already provided numeric answerIndex, use it
  if (typeof obj.answerIndex === 'number') {
    q.answerIndex = obj.answerIndex;
  } else {
    // 2) else read any letter/number/text answer robustly
    let ans = (
      obj.correct ||
      obj.Correct ||
      obj.answer ||
      obj.Answer ||
      obj.correctAnswer ||
      ""
    ).toString().trim().toUpperCase();

    if (["A","B","C","D"].includes(ans)) {
      q.answerIndex = ans.charCodeAt(0) - 65;
    } else if (/^\d+$/.test(ans)) {
      q.answerIndex = parseInt(ans, 10);
    } else {
      const idx = q.options.findIndex(o => o.trim().toLowerCase() === ans.toLowerCase());
      if (idx >= 0) q.answerIndex = idx;
    }
  }

  if (!q.question && q.options.length) q.question = q.options[0];
  return q;
}


/* --- parsing files (csv/json/xlsx) --- */
function parseCSVorJSONFile(file, onParsed) {
  const reader = new FileReader();
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    reader.onload = (e) => {
      const parsed = Papa.parse(e.target.result, { header: true, skipEmptyLines: true });
      onParsed(parsed.data.map(normalizeQuestion));
    };
    reader.readAsText(file);
  } else if (name.endsWith('.json')) {
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const arr = Array.isArray(data) ? data : data.items || [];
        onParsed(arr.map(normalizeQuestion));
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      onParsed(rows.map(normalizeQuestion));
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Unsupported file type. Use CSV, JSON, or XLSX.');
  }
}

/* --- simple bulk text parser --- */
function parseBulkText(text) {
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const out = [];

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    let question = lines[0];
    const options = [];
    let answerIndex = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Option lines: A. xxx / B) xxx / C - xxx
      const opt = line.match(/^([A-Da-d])[\)\.:-]?\s+(.*)$/);
      if (opt) {
        const letter = opt[1].toUpperCase();
        const text = opt[2].trim();
        options.push(text);
        continue;
      }

      // Answer line: Answer: D
      const ans = line.match(/^Answer[:\-]?\s*([A-Da-d])$/i);
      if (ans) {
        answerIndex = ans[1].toUpperCase().charCodeAt(0) - 65;
        continue;
      }
    }

    if (answerIndex === null) answerIndex = 0;

    out.push({
      id: uuidv4(),
      question,
      options,
      answerIndex
    });
  });

  return out;
}


/* --- shuffle helper --- */
function shuffleArray(arr) { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

/* ---------------- App Component ---------------- */
export default function App(){
  const [questions, setQuestions] = useState(()=>loadFromLocal('qp:questions', []));
  const [mode, setMode] = useState('setup'); // setup | practicing | summary | manage
  const [numQuestions, setNumQuestions] = useState(20);
  const [sessionList, setSessionList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [paste, setPaste] = useState('');

  useEffect(()=> saveToLocal('qp:questions', questions), [questions]);

  function addQuestions(newQs){
    const normalized = newQs.map(normalizeQuestion);
    setQuestions(prev => [...prev, ...normalized]);
    alert(`Added ${normalized.length} questions`);
  }

  function handleFileInput(e){
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    parseCSVorJSONFile(f, (parsed)=> addQuestions(parsed));
    e.target.value = '';
  }

  function importPasted(){
    if (!paste.trim()) { alert('Paste some questions'); return; }
    const parsed = parseBulkText(paste);
    if (!parsed.length){ alert('No questions parsed'); return; }
    addQuestions(parsed);
    setPaste('');
  }

  function startPractice(){
    if (!questions.length){ alert('No questions loaded'); return; }
    const n = Math.min(numQuestions || 20, questions.length);
    setSessionList(shuffleArray(questions).slice(0,n));
    setAttempts([]);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setRevealed(false);
    setMode('practicing');
  }

  function chooseOption(idx){
    if (revealed) return;
    setSelectedIndex(idx);
    setRevealed(true);
  }

  function nextQuestion(){
    // record attempt
    const cur = sessionList[currentIndex];
    const chosen = (typeof selectedIndex === 'number') ? selectedIndex : null;
    const correct = chosen === cur.answerIndex;
    setAttempts(prev => [...prev, { id: cur.id, chosen, correct, answerIndex: cur.answerIndex, question: cur.question }]);
    // advance
    const next = currentIndex + 1;
    if (next >= sessionList.length) {
      setMode('summary');
    } else {
      setCurrentIndex(next);
      setSelectedIndex(null);
      setRevealed(false);
    }
  }

  function restart(){
    setMode('setup');
    setSessionList([]);
    setAttempts([]);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setRevealed(false);
  }

function exportJSON(){
  // Ensure we export normalized shape and answerIndex
  const cleaned = (questions || []).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    answerIndex: (typeof q.answerIndex === 'number') ? q.answerIndex : null
  }));
  const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'questions.json'; a.click();
}



  function clearAll(){
    if (!confirm('Clear all questions?')) return;
    setQuestions([]);
    saveToLocal('qp:questions', []);
  }

  // UI helpers
  const curQ = sessionList[currentIndex] || null;
  const progressPct = sessionList.length ? Math.round((currentIndex / sessionList.length) * 100) : 0;
  const correctCount = attempts.filter(a=>a.correct).length;

  return (
    <div className="app-shell">
      <div className="container">
        <main className="card">
          <div className="header">
            <div>
              <div className="title">Practice — Exam Mode</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="small">Total questions</div>
              <div style={{fontWeight:700,fontSize:18}}>{questions.length}</div>
            </div>
          </div>

          {/* progress */}
          <div>
            <div className="progress-wrap" aria-hidden>
              <div className="progress" style={{width:`${progressPct}%`}} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              <div className="small">Progress</div>
              <div className="small">{sessionList.length ? `${currentIndex} / ${sessionList.length}` : '0 / 0'}</div>
            </div>
          </div>

          {/* main area */}
          {mode === 'setup' && (
            <div style={{display:'grid',gap:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 220px',gap:12}}>
                <div>
                  <div className="upload">
                    <div className="small">Upload CSV / XLSX / JSON</div>
                    <input className="file-input" type="file" accept=".csv,.xlsx,.xls,.json,.txt" onChange={handleFileInput} />
                    <div className="small" style={{marginTop:6}}>Or paste bulk text below</div>
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',gap:8}}>
                    <input type="number" min="1" value={numQuestions} onChange={e=>setNumQuestions(Number(e.target.value||1))} style={{flex:1,padding:10,borderRadius:8,border:'1px solid #e6edf8'}}/>
                    <button className="btn btn-primary" onClick={startPractice} style={{padding:'10px 12px'}}>Start</button>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost" onClick={exportJSON}>Export JSON</button>
                    <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
                  </div>
                </div>
              </div>

              <textarea placeholder={`Q1: ...\nA. ...\nB. ...\nAnswer: B\n\nQ2: ...`} value={paste} onChange={e=>setPaste(e.target.value)} style={{width:'100%',minHeight:120,padding:12,borderRadius:10,border:'1px solid #e6edf8'}}/>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button className="btn btn-primary" onClick={importPasted}>Import Paste</button>
              </div>
            </div>
          )}

          {mode === 'practicing' && curQ && (
            <div>
              <div className="question-meta">
                <div className="q-number">Question {currentIndex+1} / {sessionList.length}</div>
                <div className="q-number">Score: {correctCount} </div>
              </div>

              <div className="q-text">{curQ.question}</div>

              <div className="options">
                {curQ.options.map((opt, idx) => {
                  const isChosen = selectedIndex === idx;
                  const isCorrect = revealed && idx === curQ.answerIndex;
                  const isWrongChosen = revealed && isChosen && !isCorrect;
                  const cls = 'opt-btn';
                  const style = {};
                  if (isCorrect) style.borderColor = '#bbf7d0';
                  if (isWrongChosen) style.borderColor = '#fecaca';
                  return (
                    <button key={idx} className={cls} onClick={()=>chooseOption(idx)} style={style}>
                      <div className="opt-letter">{String.fromCharCode(65+idx)}</div>
                      <div className="opt-text">{opt}</div>
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <div style={{marginTop:12}}>
                  {selectedIndex === curQ.answerIndex ? (
                    <div className="feedback correct">Correct — well done ✅</div>
                  ) : (
                    <div className="feedback wrong">Wrong — correct answer: <strong>{String.fromCharCode(65+curQ.answerIndex)}. {curQ.options[curQ.answerIndex]}</strong></div>
                  )}
                </div>
              )}

              <div className="controls" style={{ justifyContent: "space-between" }}>

  {/* BACK BUTTON (LEFT) */}
  <button
    className="btn btn-ghost"
    disabled={currentIndex === 0}
    onClick={() => {
      if (currentIndex > 0) {
        // Remove the last attempt when going back
        setAttempts(prev => prev.slice(0, prev.length - 1));

        setCurrentIndex(currentIndex - 1);
        setSelectedIndex(null);
        setRevealed(false);
      }
    }}
  >
    Back
  </button>

  <div style={{ display: "flex", gap: 8 }}>
    
    {/* EXIT */}
    <button className="btn btn-ghost" onClick={() => setMode("setup")}>
      Exit
    </button>

    {/* NEXT BUTTON (RIGHT) */}
    <button
      className={`btn ${revealed ? "" : "btn-disabled"}`}
      disabled={!revealed}
      onClick={nextQuestion}
      style={{ background: "#111827", color: "#fff", borderRadius: 10 }}
    >
      Next
    </button>

  </div>

</div>


            </div>
          )}

          {mode === 'summary' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:20,fontWeight:700}}>Session Summary</div>
                  <div className="sub">Your results for this session</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:22,fontWeight:800}}>{attempts.filter(a=>a.correct).length} / {attempts.length}</div>
                  <div className="small">Correct</div>
                </div>
              </div>

              <div style={{marginTop:14}}>
                {attempts.filter(a=>!a.correct).length > 0 ? (
                  <div style={{display:'grid',gap:10}}>
                    <div style={{fontWeight:700}}>Review mistakes</div>
                    {attempts.filter(a=>!a.correct).map((w, i)=>(
                      <div key={i} style={{padding:12,borderRadius:8,background:'#fff',border:'1px solid #f1f5f9'}}>
                        <div style={{fontWeight:700}}>{w.question}</div>
                        <div className="small">Your: {w.chosen !== null ? String.fromCharCode(65+w.chosen) : '-'} • Correct: {String.fromCharCode(65+w.answerIndex)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{padding:12,background:'#ecfdf5',borderRadius:8,color:'#065f46'}}>Great job — no mistakes!</div>
                )}
              </div>

              <div style={{display:'flex',gap:10,marginTop:12}}>
                <button className="btn btn-primary" onClick={restart}>Back</button>
              </div>
            </div>
          )}

        </main>

        <aside className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700}}>Controls</div>
            <div className="small">Quick actions</div>
          </div>

          <div style={{marginTop:12}}>
            <div className="small">Load / Manage</div>
            <div style={{marginTop:8}}>
              <label className="small">Import file</label>
              <input type="file" accept=".csv,.xlsx,.xls,.json,.txt" onChange={handleFileInput} style={{width:'100%',marginTop:8}} />
            </div>

            <div style={{marginTop:12}}>
              <div className="stat"><div className="small">Total stored</div><div style={{fontWeight:700}}>{questions.length}</div></div>
              <div className="stat"><div className="small">Session length</div><div style={{fontWeight:700}}>{numQuestions}</div></div>
            </div>

            <div style={{marginTop:12,display:'flex',gap:8}}>
              <button className="btn btn-ghost" onClick={exportJSON}>Export JSON</button>
              <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
            </div>

            <div style={{marginTop:14}}>
              <div className="small">Tips</div>
              <ul className="small" style={{paddingLeft:18,marginTop:6,color:'#475569'}}>
                <li>Upload CSV/XLSX with columns: question, optionA..optionD, correct (A/B/C/D)</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
