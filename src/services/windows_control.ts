/**
 * Windows Native System & Control Service
 * Zero external dependencies. Uses Windows native APIs / PowerShell commands
 * for high-speed execution (<50ms).
 */
export class WindowsControlService {
  /**
   * Mute or unmute system audio
   */
  public async toggleMute(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      $w.SendKeys([char]173);
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Toggled system audio mute.";
  }

  /**
   * Volume Up (increments by ~10%)
   */
  public async volumeUp(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      for ($i=0; $i -lt 5; $i++) { $w.SendKeys([char]175); }
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Volume increased.";
  }

  /**
   * Volume Down (decrements by ~10%)
   */
  public async volumeDown(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      for ($i=0; $i -lt 5; $i++) { $w.SendKeys([char]174); }
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Volume decreased.";
  }

  /**
   * Media Play / Pause
   */
  public async toggleMediaPlayPause(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      $w.SendKeys([char]179);
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Media play/pause toggled.";
  }

  /**
   * Media Next Track
   */
  public async nextTrack(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      $w.SendKeys([char]176);
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Skipped to next track.";
  }

  /**
   * Media Previous Track
   */
  public async prevTrack(): Promise<string> {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      $w.SendKeys([char]177);
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
    return "Playing previous track.";
  }

  /**
   * Lock Windows Workstation
   */
  public async lockWorkstation(): Promise<string> {
    Bun.spawn(["rundll32.exe", "user32.dll,LockWorkStation"]);
    return "Locking workstation.";
  }

  /**
   * Empty Recycle Bin safely
   */
  public async emptyRecycleBin(): Promise<string> {
    await Bun.spawn([
      "powershell",
      "-NoProfile",
      "-Command",
      "Clear-RecycleBin -Force -ErrorAction SilentlyContinue",
    ]).exited;
    return "Recycle bin emptied.";
  }

  /**
   * Take a full screenshot saved to user's Pictures/Screenshots
   */
  public async takeScreenshot(): Promise<string> {
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
    const proc = Bun.spawn(["powershell", "-NoProfile", "-Command", script], {
      stdout: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    return `Screenshot captured and saved to Pictures folder.`;
  }

  /**
   * Get battery status and CPU / memory overview
   */
  public async getSystemMetrics(): Promise<string> {
    const script = `
      $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue;
      $os = Get-CimInstance Win32_OperatingSystem;
      $freeMem = [math]::Round($os.FreePhysicalMemory / 1024 / 1024, 1);
      $totalMem = [math]::Round($os.TotalVisibleMemorySize / 1024 / 1024, 1);
      $usedMem = [math]::Round($totalMem - $freeMem, 1);
      $status = "RAM: $usedMem GB of $totalMem GB used.";
      if ($battery) {
        $status += " Battery is at $($battery.EstimatedChargeRemaining) percent.";
      }
      Write-Output $status;
    `;
    const proc = Bun.spawn(["powershell", "-NoProfile", "-Command", script], {
      stdout: "pipe",
    });
    const result = (await new Response(proc.stdout).text()).trim();
    return result || "System hardware operational.";
  }
}
