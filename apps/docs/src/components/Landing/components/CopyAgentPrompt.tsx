"use client";

import { useEffect, useState } from "react";

const agentPrompt = `Set up Recontent (https://recontent.app/introduction/installation/) as our design system toolchain:
1. Install \`recontent\` as a dev dependency
2. Scaffold \`recontent.config.ts\`
  2.a. Design tokens can be populated from existing files (e.g., CSS, TS, or JSON token files) if explicitly approved
  2.b. Introspection can be configured using project's UI components if explicitly approved
3. Add appropriate plugins from \`recontent/plugins\` (such as \`css()\`, \`tailwind()\`, \`docs()\`, \`designMD()\`, \`contrast()\`)
4. Run \`npx recontent build\` and verify \`npx recontent inspect\` works
5. Add instructions to AGENTS.md if explicitly approved telling coding agents to query \`recontent inspect\` before writing UI`;

export function CopyAgentPrompt() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agentPrompt);
      setCopied(true);
    } catch {
      // Clipboard API unavailable in non-secure contexts.
    }
  };

  return (
    <button type="button" className="lp-btn lp-btn-dark" onClick={handleCopy} aria-live="polite">
      {copied ? "Prompt copied!" : "Copy prompt to agent"}
    </button>
  );
}
