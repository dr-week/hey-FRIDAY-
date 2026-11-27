/**
 * Quick Task Grid — icon-first one-tap desktop tasks (sky/cyan gradient zone).
 */
import {
  BatteryMedium, Camera, CloudSun, GitBranch, Lock, NotebookPen, Sun, Timer, Volume1, Volume2, VolumeX, Clock,
} from "lucide-react";
import type { ComponentType } from "react";

interface Task { readonly icon: ComponentType<{ size?: number }>; readonly label: string; readonly cmd: string }

const TASKS: Task[] = [
  { icon: Volume2, label: "Vol +", cmd: "increase volume" },
  { icon: Volume1, label: "Vol −", cmd: "decrease volume" },
  { icon: VolumeX, label: "Mute", cmd: "mute audio" },
  { icon: Camera, label: "Shot", cmd: "take screenshot" },
  { icon: Lock, label: "Lock", cmd: "lock computer" },
  { icon: CloudSun, label: "Weather", cmd: "what is the weather" },
  { icon: GitBranch, label: "Git", cmd: "check git status" },
  { icon: BatteryMedium, label: "System", cmd: "check system status" },
  { icon: Timer, label: "Focus 25", cmd: "start 25 minute pomodoro" },
  { icon: Clock, label: "Time", cmd: "what time is it" },
  { icon: NotebookPen, label: "Notes", cmd: "read my notes" },
  { icon: Sun, label: "Hi!", cmd: "how are you" },
];

export function QuickTaskGrid({ onRun }: { readonly onRun: (cmd: string) => void }) {
  return (
    <section className="task-zone">
      {TASKS.map(({ icon: Icon, label, cmd }) => (
        <button type="button" key={label} title={cmd} onClick={() => onRun(cmd)}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </section>
  );
}
