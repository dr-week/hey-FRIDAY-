import { dlopen, FFIType } from "bun:ffi";

// Win32 Virtual-Key Codes for Media & Volume
export const VK_VOLUME_MUTE = 0xad;
export const VK_VOLUME_DOWN = 0xae;
export const VK_VOLUME_UP = 0xaf;
export const VK_MEDIA_NEXT_TRACK = 0xb0;
export const VK_MEDIA_PREV_TRACK = 0xb1;
export const VK_MEDIA_PLAY_PAUSE = 0xb3;
export const KEYEVENTF_KEYUP = 0x0002;

export interface User32Symbols {
  keybd_event: (bVk: number, bScan: number, dwFlags: number, dwExtraInfo: number) => void;
  LockWorkStation: () => boolean;
}

/**
 * Loads user32.dll via Bun FFI on Windows for <0.2ms hardware key and lock calls (<60 lines).
 */
export function loadUser32Bindings(): User32Symbols | null {
  if (process.platform !== "win32") {
    return null;
  }
  try {
    const lib = dlopen("user32.dll", {
      keybd_event: {
        args: [FFIType.u8, FFIType.u8, FFIType.u32, FFIType.usize],
        returns: FFIType.void,
      },
      LockWorkStation: {
        args: [],
        returns: FFIType.bool,
      },
    });
    return lib.symbols as unknown as User32Symbols;
  } catch {
    return null;
  }
}

export async function dispatchVirtualKey(
  user32: User32Symbols | null,
  isWindows: boolean,
  vkCode: number,
  repeat: number = 1
): Promise<void> {
  if (isWindows && user32) {
    for (let i = 0; i < repeat; i++) {
      user32.keybd_event(vkCode, 0, 0, 0);
      user32.keybd_event(vkCode, 0, KEYEVENTF_KEYUP, 0);
    }
    return;
  }

  if (isWindows) {
    const script = `
      $w = New-Object -ComObject WScript.Shell;
      for ($i=0; $i -lt ${repeat}; $i++) { $w.SendKeys([char]${vkCode}); }
    `;
    await Bun.spawn(["powershell", "-NoProfile", "-Command", script]).exited;
  }
}
