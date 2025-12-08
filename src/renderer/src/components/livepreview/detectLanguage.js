const detectLanguage = (code) => {
  if (!code || !code.trim()) return 'text'
  
  const trimmed = code.trim()
  
  // Shebang detection
  if (/^#!/.test(trimmed)) {
    if (/bash|sh/.test(trimmed)) return 'bash'
    if (/python/.test(trimmed)) return 'python'
    if (/node|javascript/.test(trimmed)) return 'javascript'
    if (/ruby/.test(trimmed)) return 'ruby'
    if (/perl/.test(trimmed)) return 'perl'
  }
  
  // Markdown indicators
  if (/^#{1,6}\s/m.test(code) || /^\>\s/m.test(code) || /\[.*\]\(.*\)/.test(code) || /^\|.*\|/m.test(code) || /^\s*-\s/m.test(code) || /^\s*\d+\.\s/m.test(code)) {
    return 'markdown'
  }
  
  // JavaScript/TypeScript
  if (/^(import|export|const|let|var|function|class|interface|type|async|await)\s/m.test(code) || /\(\s*\)\s*=>/.test(code) || /console\.log/.test(code) || /document\.|window\./.test(code)) {
    return 'javascript'
  }
  
  // Python
  if (/^(def|class|import|from|try|except)\s/m.test(code) || /:\s*$/m.test(code) || /print\s*\(/.test(code) || /if __name__ == ['"]__main__['"]/.test(code)) {
    return 'python'
  }
  
  // HTML
  if (/<html/i.test(code) || /<\/[^>]+>/.test(code) || /<!DOCTYPE html/i.test(code)) {
    return 'html'
  }
  
  // CSS
  if (/^\s*\..*\{|^\s*#.*\{|^\s*[a-zA-Z-]+\s*\{/.test(code) || /color\s*:\s*|background\s*:\s*|font-size\s*:\s*/.test(code)) {
    return 'css'
  }
  
  // JSON
  if ((/^\s*\{[\s\S]*\}\s*$|^\s*\[[\s\S]*\]\s*$/.test(trimmed) && /":\s*["\d]/.test(code)) || /^[\s\S]*"[^"]*"\s*:\s*["\d\[\{]/.test(trimmed)) {
    return 'json'
  }
  
  // C/C++
  if (/^\s*#include/m.test(code) || /int main\s*\(/.test(code) || /std::/.test(code) || /printf\s*\(/.test(code) || /\.h\s*>/.test(code)) {
    return 'cpp'
  }
  
  // Java
  if (/^(public|private|protected|static|void|int|string|class)\s/m.test(code) && /System\.out/.test(code)) {
    return 'java'
  }
  
  // PHP
  if (/<\?php/i.test(code) || /\$\w+\s*=/.test(code) || /function\s+\w+\s*\(/.test(code) && /\$\w+/.test(code)) {
    return 'php'
  }
  
  // Ruby
  if (/^(def|class|require)\s/m.test(code) || /puts\s+/.test(code) || /@\w+/.test(code)) {
    return 'ruby'
  }
  
  // Go
  if (/^package\s+\w+/m.test(code) || /^func\s+\w+\s*\(/.test(code) || /fmt\.Print/.test(code)) {
    return 'go'
  }
  
  // Rust
  if (/^fn\s+\w+\s*\(/.test(code) || /println!/.test(code) || /let\s+mut\s+/.test(code)) {
    return 'rust'
  }
  
  // SQL
  if (/^(select|insert|update|delete|create|alter|drop)\s/i.test(code) || /where\s+|join\s+|group by\s+/i.test(code)) {
    return 'sql'
  }
  
  // YAML
  if (/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(code) && !/^\s*\{/.test(trimmed)) {
    return 'yaml'
  }
  
  // XML
  if (/<\?xml/i.test(code) || /<[^>]+>[\s\S]*<\/[^>]+>/.test(code)) {
    return 'xml'
  }
  
  // Shell/Bash
  if (/^\s*(echo|ls|cd|mkdir|rm|cp|mv)\s/m.test(code) || /\$\{?\w+\}?/.test(code) || /#!/.test(code)) {
    return 'bash'
  }
  
  // Default
  return 'text'
}

export default detectLanguage
