/**
 * Dialogue Engine — natural, context-aware chit-chat (ELIZA/AIML-style patterns + dialog state).
 * Returns null when the utterance is a desktop COMMAND that should go to the Laya router.
 */
import { getSlots, getTurns, updateSlots } from "./conversationMemory.ts";
import { ASSISTANT_SKILLS, type SkillReply } from "./assistantSkills.ts";

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const name = () => (getSlots().userName ? `, ${getSlots().userName}` : "");

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I told my computer I needed a break. It said: no problem, I'll go to sleep.",
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "Why did the developer go broke? Because he used up all his cache.",
];

type Rule = [RegExp, (m: RegExpMatchArray) => string];

const RULES: Rule[] = [
  [/\b(my name is|call me|i am called)\s+([a-z]+)/, (m) => {
    const n = m[2][0].toUpperCase() + m[2].slice(1);
    updateSlots({ userName: n });
    return `Nice to meet you, ${n}! I'll remember that.`;
  }],
  [/\b(what('?s| is) my name|do you know my name|who am i)\b/, () =>
    getSlots().userName ? `You're ${getSlots().userName}, of course!` : "You haven't told me yet. Say 'my name is ...'."],
  [/\b(what did i (just )?(ask|say)|what was my last (question|command))\b/, () => {
    const prev = getTurns().slice(-1)[0];
    return prev ? `You said: "${prev.reframed}". I replied: ${prev.reply}` : "This is the start of our chat.";
  }],
  [/^(hi|hello|hey|hii+|yo|namaste|good (morning|afternoon|evening))\b/, (m) =>
    pick([`${m[1][0].toUpperCase() + m[1].slice(1)}${name()}! What can I do for you?`, `Hey${name()}! I'm all ears.`])],
  [/\bhow are you|how('?s| is) it going|how do you do|kaise ho\b/, () =>
    pick(["I'm doing great, thanks for asking! How about you?", "Running smooth and cool. How's your day going?"])],
  [/\b(i('?m| am) (fine|good|great|ok|okay|doing well))\b/, () => {
    updateSlots({ mood: "good" });
    return pick(["Love to hear it! Need help with anything?", "Awesome! Let's get things done."]);
  }],
  [/\b(i('?m| am) (tired|stressed|sad|bored|exhausted|sleepy)|feeling (tired|low|stressed|sad))\b/, () => {
    updateSlots({ mood: "low" });
    return pick(["Sorry to hear that. Want me to start a 5 minute break timer?", "Take it easy. A short break and some water can help a lot. Want a focus timer for later?"]);
  }],
  [/^(yes|yeah|sure|ok|okay|yep)\b.*$/, () => {
    const prev = getTurns().slice(-1)[0]?.reply ?? "";
    return /break timer/.test(prev) ? "__RUN__:set a 5 minute timer" : "Got it!";
  }],
  [/^(no|nope|nah)\b/, () => "No problem. I'm here whenever you need me."],
  [/\b(thank(s| you)|thx|shukriya|dhanyavad)\b/, () => pick(["You're welcome!", "Anytime!", "Happy to help!"])],
  [/\b(who are you|what are you|your name)\b/, () => "I'm Friday, your voice assistant for your desktop."],
  [/\b(who (made|built|created) you)\b/, () => "I was built by dr-week as an open-source project, Hey Friday."],
  [/\b(what can you do|help me|your features|what do you do)\b/, () =>
    "I can control volume, lock your PC, take screenshots, check weather, git and system status, tell the time, do math, set focus timers, take notes, and just chat."],
  [/\b(joke|make me laugh|something funny)\b/, () => pick(JOKES)],
  [/\b(bye|goodbye|good night|see you|later)\b/, () => pick([`Bye${name()}! Say Hey Friday anytime.`, "Good night! Sleep well."])],
  [/\b(i love you|you('?re| are) (awesome|great|smart|the best))\b/, () => "Aww, thank you! You're pretty great yourself."],
  [/\b(you('?re| are) (stupid|dumb|useless|wrong))\b/, () => "Sorry about that. Tap the feedback buttons so I can learn and get better."],
];

export interface DialogueReply extends SkillReply { readonly runCommand?: string }

export function respondConversationally(text: string): DialogueReply | null {
  const t = text.toLowerCase().replace(/[?!.]+$/g, "").trim();
  if (!t) return null;
  for (const skill of ASSISTANT_SKILLS) {
    const r = skill(t);
    if (r) return r;
  }
  for (const [re, fn] of RULES) {
    const m = t.match(re);
    if (m) {
      const out = fn(m);
      if (out.startsWith("__RUN__:")) return { intent: "smalltalk", reply: "On it!", runCommand: out.slice(8) };
      return { intent: "smalltalk", reply: out };
    }
  }
  return null;
}
