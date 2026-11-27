/**
 * Windows Native Text-To-Speech Synthesizer
 * Zero external downloads, zero heavy audio dependencies.
 * Supports instant barge-in cancellation (`stopSpeaking()`) when the user presses Ctrl+Shift+Space.
 */
export class SpeechService {
  private readonly isWindows: boolean;
  private activeProc: ReturnType<typeof Bun.spawn> | null = null;

  constructor() {
    this.isWindows = process.platform === "win32";
  }

  /**
   * Barge-in interrupt: terminates any currently speaking SAPI5/TTS stream immediately.
   */
  public stopSpeaking(): void {
    if (this.activeProc) {
      try {
        this.activeProc.kill();
      } catch {
        // Ignore already exited
      }
      this.activeProc = null;
    }
  }

  public async speak(text: string): Promise<void> {
    this.stopSpeaking();

    // Sanitize text to avoid script injection in speech synthesizer
    const cleanText = text.replace(/["'`$\\]/g, "");

    if (this.isWindows) {
      // Use natural female voice: Microsoft Zira Desktop / Microsoft Zira
      const script = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $zira = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like "*Zira*" -and $_.Enabled } | Select-Object -First 1;
        if ($zira) {
          $synth.SelectVoice($zira.VoiceInfo.Name);
        }
        $synth.Rate = 0;
        $synth.Volume = 100;
        $synth.Speak("${cleanText}");
      `;
      const proc = Bun.spawn([
        "powershell",
        "-NoProfile",
        "-Command",
        script,
      ]);
      this.activeProc = proc;
      await proc.exited;
      if (this.activeProc === proc) {
        this.activeProc = null;
      }
    } else {
      // Fallback for macOS / Linux if binary exists
      const bin = process.platform === "darwin" ? "say" : "spd-say";
      if (!Bun.which(bin)) {
        return;
      }
      const proc = Bun.spawn([bin, cleanText]);
      this.activeProc = proc;
      await proc.exited;
      if (this.activeProc === proc) {
        this.activeProc = null;
      }
    }
  }
}
