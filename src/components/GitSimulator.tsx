
import React, { useState, useEffect, useRef } from 'react';
import RepoGraph from './RepoGraph'; 
import { Terminal, GitBranch, UploadCloud, DownloadCloud, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

// Define type locally to prevent export conflicts
type Command = {
  id: number;
  input: string;
  hash?: string;
  type: 'commit' | 'branch' | 'merge' | 'checkout' | 'error';
  arg?: string;
};


// Generate a fake Git-like commit hash (40 hex chars)
export function GitHash() {
  const hex = "0123456789abcdef";
  let hash = "";

  for (let i = 0; i < 40; i++) {
    hash += hex[Math.floor(Math.random() * 16)];
  }

  return hash;
}


export default function GitSimulator() {
  const [localCmds, setLocalCmds] = useState<Command[]>([]);
  const [remoteCmds, setRemoteCmds] = useState<Command[]>([]);
  
  const [input, setInput] = useState('');
  const [currentBranchName, setCurrentBranchName] = useState('main');
  const [feedback, setFeedback] = useState<string>(''); 
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localCmds, feedback]);

  const addToLocal = (cmd: Command) => setLocalCmds(prev => [...prev, cmd]);
  
  // SIMULATION: A teammate pushes code to the remote repo
  const handleTeammatePush = () => {
    const newCmd: Command = {
      id: Date.now(),
      input: "Teammate Push",
      type: 'commit',
      arg: `Feature #${Math.floor(Math.random() * 100)} (Team)`
    };
    setRemoteCmds(prev => [...prev, newCmd]);
    setFeedback("Update: A teammate just pushed code to origin/main!");
  };
  

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = input.trim();
    if (!rawInput) return;

    if (rawInput === 'clear') {
      setLocalCmds([]);
      setRemoteCmds([]);
      setCurrentBranchName('main');
      setInput('');
      setFeedback("Console cleared.");
      return;
    }

    const parts = rawInput.split(/\s+/);
    const cmd = parts[0];
    const action = parts[1]; 

    if (cmd !== 'git') {
        setFeedback(`Error: Command '${cmd}' not found. Try starting with 'git'.`);
        setInput('');
        return;
    }

    setFeedback(""); // Clear previous messages

    // --- LOCAL OPERATIONS ---
    if (action === 'commit') {
      const msgMatch = rawInput.match(/"([^"]+)"/);
      const msg = msgMatch ? msgMatch[1] : 'msg';
      const newCmd: Command = { id: Date.now(), input: rawInput,hash:GitHash(), type: 'commit', arg: msg };
      addToLocal(newCmd);
    } 
    else if (action === 'branch') {
      const name = parts[2];
      if (name) {
        const newCmd: Command = { id: Date.now(), input: rawInput, type: 'branch', arg: name };
        addToLocal(newCmd);
      }
    }
    else if (action === 'checkout') {
       const isNew = parts[2] === '-b';
       const name = isNew ? parts[3] : parts[2];
       if (name) {
         const newCmd: Command = { id: Date.now(), input: rawInput, type: 'checkout', arg: name };
         setCurrentBranchName(name); 
         addToLocal(newCmd);
       }
    }
    else if (action === 'merge') {
      const name = parts[2];
      if (name) {
        const newCmd: Command = { id: Date.now(), input: rawInput, type: 'merge', arg: name };
        addToLocal(newCmd);
      }
    }
    else if (action === 'revert') {
      // Find last local commit to revert
      const lastCommit = [...localCmds].reverse().find(c => c.type === 'commit');
      const arg = lastCommit && lastCommit.arg ? `Revert "${lastCommit.arg}"` : "Revert HEAD";
      const newCmd: Command = { id: Date.now(), input: rawInput, type: 'commit', arg };
      addToLocal(newCmd);
    }
    
    // --- NETWORK OPERATIONS (PUSH / PULL) ---
    else if (action === 'push') {
        if (remoteCmds.length > localCmds.length) {
            setFeedback("Error: Push rejected. Remote contains work you do not have locally. Run 'git pull' first.");
        } else {
            setRemoteCmds([...localCmds]); // Sync Remote to match Local
            setFeedback("Success: Pushed local commits to origin/main.");
        }
    }
    else if (action === 'pull') {
        // Sync Local to match Remote
        setLocalCmds([...remoteCmds]);
        setFeedback("Success: Pulled latest changes from origin/main.");
    }
    else {
        setFeedback(`Error: Unknown git command '${action}'.`);
    }

    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-slate-800 p-4 border-b border-slate-700 shadow-lg">
        <h1 className="text-xl font-bold text-teal-400 flex items-center gap-2">
           <GitBranch className="text-teal-400" /> Git Flow Simulator
        </h1>
        
        {/* TEAMMATE ACTION BUTTON */}
        <button 
            onClick={handleTeammatePush}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 text-sm"
        >
            <Users size={16} className="group-hover:animate-bounce" /> 
            <span className="font-semibold">Simulate Teammate Push</span>
        </button>
      </div>








      {/* DUAL GRAPH AREA (Split Screen) */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden bg-slate-900/50">
         {/* LOCAL REPO */}
         <div className="relative flex flex-col h-full">
            <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full z-20 font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <UploadCloud size={12} /> Your Local PC
            </div>
            {/* Using the default export RepoGraph */}
            <RepoGraph commands={localCmds} title="Local Repository" local={true} />
         </div>



         {/* REMOTE REPO */}
         <div className="relative flex flex-col h-full">
            <div className="absolute -top-3 left-4 bg-purple-600 text-white text-xs px-3 py-1 rounded-full z-20 font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <DownloadCloud size={12} /> Remote (GitHub)
            </div>
            <RepoGraph commands={remoteCmds} title="origin/main"  local={false} />
         </div>
      </div>










      {/* TERMINAL AREA */}
      <div className="h-1/3 bg-black border-t-4 border-slate-700 p-4 flex flex-col shadow-2xl">
        {/* Output Log */}
        <div className="flex-1 overflow-auto mb-2 text-sm space-y-1 custom-scrollbar font-mono pb-2">
          <div className="text-slate-500 italic"># Repository initialized...</div>
          
          {/* Render Command History */}
          {localCmds.map((cmd) => (
             cmd.input && (
                <div key={cmd.id} className="flex gap-2">
                  <span className="text-green-500 font-bold">➜</span>
                  <span className={cmd.input.includes('revert') ? "text-red-400" : "text-slate-300"}>
                    {cmd.input}
                  </span>
                </div>
             )
          ))}

          {/* Feedback Messages */}
          {feedback && (
             <div className={`mt-2 p-2 rounded border-l-4 ${feedback.includes('Error') ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-green-900/30 border-green-500 text-green-200'} flex items-center gap-2`}>
                {feedback.includes('Error') ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
                {feedback}
             </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleCommand} className="flex gap-2 items-center border-t border-slate-800 pt-3">
          <span className="text-green-500 font-bold flex items-center gap-1 font-mono text-lg">
             <Terminal size={18} /> ~ {currentBranchName}
          </span>
          <input 
            className="bg-transparent border-none outline-none flex-1 text-white font-mono text-base placeholder:text-slate-600"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="git push, git pull, git commit..."
            autoFocus
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}