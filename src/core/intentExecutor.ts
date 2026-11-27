import type { FridayIntent, WeatherData } from "./types.ts";
import type { WindowsControlService } from "../services/windows_control.ts";
import type { DevCommandService } from "../services/dev_service.ts";
import type { WeatherService } from "../services/weather.ts";
import type { FridayDatabase } from "../services/db.ts";

/**
 * Deterministic Intent Execution Dispatcher (Department: Core / Action Routing)
 * Maps each typed `FridayIntent` to its underlying native service (<95 lines).
 */
export async function executeIntentAction(
  intent: FridayIntent,
  query: string,
  winControl: WindowsControlService,
  devService: DevCommandService,
  weather: WeatherService,
  db: FridayDatabase
): Promise<string> {
  switch (intent) {
    case "system_volume_mute":
      return winControl.toggleMute();

    case "system_volume_up":
      return winControl.volumeUp();

    case "system_volume_down":
      return winControl.volumeDown();

    case "media_play_pause":
      return winControl.toggleMediaPlayPause();

    case "media_next":
      return winControl.nextTrack();

    case "media_prev":
      return winControl.prevTrack();

    case "system_lock":
      return winControl.lockWorkstation();

    case "system_empty_bin":
      return winControl.emptyRecycleBin();

    case "system_screenshot":
      return winControl.takeScreenshot();

    case "system_status": {
      const sysMetrics = await winControl.getSystemMetrics();
      return `All systems operational. ${sysMetrics}`;
    }

    case "dev_git_status":
      return devService.getGitStatus();

    case "dev_run_tests":
      return devService.runProjectTests();

    case "dev_port_check":
      return devService.checkServerPort(4141);

    case "weather_check": {
      const prefs = db.getPreferences();
      const targetCoords = await weather.resolveCityFromQuery(
        query,
        prefs.defaultCity,
        prefs.latitude,
        prefs.longitude
      );
      const w: WeatherData = await weather.getCurrentWeather(
        targetCoords.city,
        targetCoords.lat,
        targetCoords.lon
      );
      return weather.formatWeatherAdvice(w, query);
    }

    case "smalltalk":
      return "Hey there! I am Friday, your zero-latency desktop command assistant.";

    default:
      return `I received your command: "${query}". Routing through System-1.`;
  }
}
