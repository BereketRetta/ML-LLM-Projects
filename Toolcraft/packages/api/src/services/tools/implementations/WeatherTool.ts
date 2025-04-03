// packages/api/src/services/tools/implementations/WeatherTool.ts

import axios from "axios";
import { Tool } from "@toolcraft/shared";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast?: {
    date: string;
    condition: string;
    minTemp: number;
    maxTemp: number;
  }[];
}

export class WeatherTool implements Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  private apiKey: string;

  constructor(apiKey: string) {
    this.name = "weather";
    this.description =
      "Get current weather and forecast information for a location";
    this.parameters = {
      location: {
        type: "string",
        description:
          'The city or location to get weather for (e.g., "New York", "Paris, France")',
        required: true,
      },
      forecast: {
        type: "boolean",
        description: "Whether to include forecast for the next few days",
        required: false,
        default: false,
      },
    };
    this.apiKey = apiKey;
  }

  async execute(parameters: Record<string, any>): Promise<any> {
    const location = parameters.location;
    const includeForecast = parameters.forecast || false;

    try {
      // Get current weather
      const currentResponse = await axios.get(
        "https://api.weatherapi.com/v1/current.json",
        {
          params: {
            key: this.apiKey,
            q: location,
            aqi: "no",
          },
        }
      );

      let forecastData = [];

      // Get forecast if requested
      if (includeForecast) {
        const forecastResponse = await axios.get(
          "https://api.weatherapi.com/v1/forecast.json",
          {
            params: {
              key: this.apiKey,
              q: location,
              days: 3,
              aqi: "no",
              alerts: "no",
            },
          }
        );

        forecastData = forecastResponse.data.forecast.forecastday.map(
          (day: any) => ({
            date: day.date,
            condition: day.day.condition.text,
            minTemp: day.day.mintemp_c,
            maxTemp: day.day.maxtemp_c,
          })
        );
      }

      const weatherData: WeatherData = {
        location: `${currentResponse.data.location.name}, ${currentResponse.data.location.country}`,
        temperature: currentResponse.data.current.temp_c,
        condition: currentResponse.data.current.condition.text,
        humidity: currentResponse.data.current.humidity,
        windSpeed: currentResponse.data.current.wind_kph,
      };

      if (includeForecast) {
        weatherData.forecast = forecastData;
      }

      return {
        success: true,
        data: weatherData,
        message: `Current weather for ${weatherData.location}: ${weatherData.condition}, ${weatherData.temperature}°C`,
      };
    } catch (error) {
      console.error("Error executing weather tool:", error);

      return {
        success: false,
        error: error,
        message: `Failed to get weather for "${location}"`,
      };
    }
  }
}
