/**
 * Windows Native Text-To-Speech Synthesizer
 * Zero external downloads, zero heavy audio dependencies.
 * Uses Windows SAPI via low-overhead background process.
 */
export class SpeechService {
  private readonly isWindows: boolean;

  constructor() {
    this.isWindows = process.platform === "win32";
  }

  public async speak(text: string): Promise<void> {
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

      await proc.exited;
    } else {
      // Fallback for macOS / Linux
      const cmd = process.platform === "darwin" ? ["say", cleanText] : ["spd-say", cleanText];
      const proc = Bun.spawn(cmd);
      await proc.exited;
    }
  }
}
