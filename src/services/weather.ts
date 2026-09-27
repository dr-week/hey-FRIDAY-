import type { WeatherData } from "../core/types.ts";

/**
 * Open-Meteo Weather Client
 * 100% Open source, zero API keys, ultra-fast JSON response.
 */
export class WeatherService {
  private readonly defaultLat: number;
  private readonly defaultLon: number;
  private readonly defaultCity: string;

  constructor(defaultCity: string = "Tokyo", lat: number = 35.6762, lon: number = 139.6503) {
    this.defaultCity = defaultCity;
    this.defaultLat = lat;
    this.defaultLon = lon;
  }

  /**
   * Translates WMO weather codes into human-readable condition summaries
   */
  private describeWeatherCode(code: number): { summary: string; isRaining: boolean } {
    switch (code) {
      case 0:
        return { summary: "Clear sky", isRaining: false };
      case 1:
      case 2:
      case 3:
        return { summary: "Mainly clear to overcast", isRaining: false };
      case 45:
      case 48:
        return { summary: "Foggy", isRaining: false };
      case 51:
      case 53:
      case 55:
        return { summary: "Light drizzle", isRaining: true };
      case 61:
      case 63:
      case 65:
        return { summary: "Rain showers", isRaining: true };
      case 71:
      case 73:
      case 75:
        return { summary: "Snowfall", isRaining: false };
      case 80:
      case 81:
      case 82:
        return { summary: "Heavy rain showers", isRaining: true };
      case 95:
      case 96:
      case 99:
        return { summary: "Thunderstorm with rain", isRaining: true };
      default:
        return { summary: "Variable conditions", isRaining: false };
    }
  }

  public async getCurrentWeather(
    cityName: string = this.defaultCity,
    lat: number = this.defaultLat,
    lon: number = this.defaultLon
  ): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation_probability`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      current: {
        temperature_2m: number;
        weather_code: number;
        precipitation_probability?: number;
      };
    };

    const code = data.current.weather_code;
    const { summary, isRaining } = this.describeWeatherCode(code);
    const rainProb = data.current.precipitation_probability ?? (isRaining ? 85 : 10);

    return {
      city: cityName,
      temperatureC: Math.round(data.current.temperature_2m * 10) / 10,
      weatherCode: code,
      isRaining,
      rainProbability: rainProb,
      summary,
    };
  }
}
