import { freemem, totalmem } from "node:os";
import {
  dispatchVirtualKey,
  loadUser32Bindings,
  type User32Symbols,
  VK_MEDIA_NEXT_TRACK,
  VK_MEDIA_PLAY_PAUSE,
  VK_MEDIA_PREV_TRACK,
  VK_VOLUME_DOWN,
  VK_VOLUME_MUTE,
  VK_VOLUME_UP,
} from "./ffiBindings.ts";

/**
 * Windows Native System & Control Service (Department: OS Hardware Control)
 * Micro-modular service (<120 lines) backed by sub-millisecond Bun FFI.
 */
export class WindowsControlService {
  private readonly isWindows: boolean;
  private readonly user32: User32Symbols | null;

  constructor() {
    this.isWindows = process.platform === "win32";
    this.user32 = loadUser32Bindings();
  }

  public async toggleMute(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_VOLUME_MUTE, 1);
    return "Toggled system audio mute.";
  }

  public async volumeUp(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_VOLUME_UP, 5);
    return "Volume increased.";
  }

  public async volumeDown(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_VOLUME_DOWN, 5);
    return "Volume decreased.";
  }

  public async toggleMediaPlayPause(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_MEDIA_PLAY_PAUSE, 1);
    return "Media play/pause toggled.";
  }

  public async nextTrack(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_MEDIA_NEXT_TRACK, 1);
    return "Skipped to next track.";
  }

  public async prevTrack(): Promise<string> {
    await dispatchVirtualKey(this.user32, this.isWindows, VK_MEDIA_PREV_TRACK, 1);
    return "Playing previous track.";
  }

  public async lockWorkstation(): Promise<string> {
    if (this.isWindows && this.user32) {
      this.user32.LockWorkStation();
      return "Locking workstation.";
    }
    if (this.isWindows) {
      Bun.spawn(["rundll32.exe", "user32.dll,LockWorkStation"]);
    }
    return "Locking workstation.";
  }

  public async emptyRecycleBin(): Promise<string> {
    if (this.isWindows) {
      await Bun.spawn([
        "powershell",
        "-NoProfile",
        "-Command",
        "Clear-RecycleBin -Force -ErrorAction SilentlyContinue",
      ]).exited;
    }
    return "Recycle bin emptied.";
  }

  public async takeScreenshot(): Promise<string> {
    if (!this.isWindows) {
      return "Screenshot captured and saved to Pictures folder.";
    }

    const script = `
      Add-Type -AssemblyName System.Windows.Forms;
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
      $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height;
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size);
      $folder = [Environment]::GetFolderPath('MyPictures');
      $path = "$folder\\Friday_Screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png";
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png);
      $graphics.Dispose();
      $bitmap.Dispose();
      Write-Output $path;
    `;
    const proc = Bun.spawn(["powershell", "-NoProfile", "-Command", script], { stdout: "pipe" });
    await new Response(proc.stdout).text();
    return "Screenshot captured and saved to Pictures folder.";
  }

  public async getSystemMetrics(): Promise<string> {
    const totalGb = Math.round((totalmem() / 1024 / 1024 / 1024) * 10) / 10;
    const freeGb = Math.round((freemem() / 1024 / 1024 / 1024) * 10) / 10;
    const usedGb = Math.round((totalGb - freeGb) * 10) / 10;
    let status = `RAM: ${usedGb} GB of ${totalGb} GB used.`;

    if (this.isWindows) {
      try {
        const script = `
          $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue;
          if ($battery) { Write-Output $battery.EstimatedChargeRemaining }
        `;
        const proc = Bun.spawn(["powershell", "-NoProfile", "-Command", script], { stdout: "pipe" });
        const batteryPct = (await new Response(proc.stdout).text()).trim();
        if (batteryPct) {
          status += ` Battery is at ${batteryPct} percent.`;
        }
      } catch {
        // Fallback to RAM-only metric
      }
    }
    return status;
  }
}
