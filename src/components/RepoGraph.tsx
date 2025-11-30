import { Gitgraph, templateExtend, TemplateName } from '@gitgraph/react';
import {useState} from "react";

export type Command = {
  id: number;
  input: string;
  hash?: string;
  type: 'commit' | 'branch' | 'merge' | 'checkout' | 'error';
  arg?: string;
};

interface RepoGraphProps {
  commands: Command[];
  title: string;
  local:boolean;
  hash:string;
}


export default function RepoGraph({ commands, title ,local}: RepoGraphProps) {
    const [pushed,setpushed]=useState(local);
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-700 overflow-hidden relative">
      <div className="bg-slate-100 p-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center z-10">
        <span className="flex items-center gap-2">{title}</span>
        <span className="text-xs font-normal bg-slate-200 px-2 py-1 rounded text-slate-500 border border-slate-300">
           {commands.filter(c => c.type === 'commit').length} Commits
        </span>
      </div>
    {pushed &&
      <div className="flex-1 overflow-auto p-4 relative text-black">
        {/* Key prop forces React to destroy and redraw graph on every update */}
        <Gitgraph
          key={JSON.stringify(commands)} 
          options={{
            author: "Dev",
            orientation: "vertical-reverse",
            template: templateExtend(TemplateName.Metro, {
              branch: { label: { display: true } },
              commit: { 
                  message: { displayAuthor: false, displayHash: true },
                  dot: { size: 12, strokeWidth: 2 }
              }
            })
          }}
        > 
          {(gitgraph) => {
            const master = gitgraph.branch("main");
            master.commit("Initial Commit");
            const branches: Record<string, any> = { "main": master };
            let currentBranch = master;

            commands.forEach(cmd => {
              if (cmd.type === 'commit') {
                setpushed(true);
                const isRevert = cmd.input.includes('revert');
                const isTeammate = cmd.input.includes('Teammate');
                
                let style = {};
                if (isRevert) style = { dot: { color: '#ef4444' }, message: { color: '#ef4444' } };
                if (isTeammate) style = { dot: { color: '#8b5cf6' }, message: { color: '#8b5cf6', fontStyle: 'italic' } };

                currentBranch.commit({ subject:cmd.arg, hash:cmd.hash, style });
              } 
              else if (cmd.type === 'branch') {
                if (cmd.arg && !branches[cmd.arg]) branches[cmd.arg] = gitgraph.branch(cmd.arg);
              } 
              else if (cmd.type === 'checkout') {
                if (cmd.arg) {
                  if (!branches[cmd.arg]) branches[cmd.arg] = gitgraph.branch(cmd.arg);
                  currentBranch = branches[cmd.arg];
                }
              } 
              else if (cmd.type === 'merge') {
                if (cmd.arg && branches[cmd.arg]) currentBranch.merge(branches[cmd.arg]);
              }
            });
          }
          }
        </Gitgraph>
      </div>
}
    </div>
  );
}