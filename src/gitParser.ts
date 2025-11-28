import { parseArgsStringToArgv } from "string-argv";

export interface ParseResult {
  command?: string;
  args?: string[];
  error?: string;
}

export const parseCommand = (input: string): ParseResult => {
  try {
    const tokens = parseArgsStringToArgv(input);
    
    if (!tokens.length) return { error: "Empty command" };
    if (tokens[0] !== "git") return { error: "Not a git command" };
    
    return { 
      command: tokens[1], 
      args: tokens.slice(2) 
    };
  } catch (e) {
    return { error: "Syntax Error" };
  }
};