// packages/api/src/services/tools/implementations/WebSearchTool.ts

import axios from 'axios';
import { Tool } from '@toolcraft/shared';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export class WebSearchTool implements Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    this.name = 'web_search';
    this.description = 'Search the web for information on a given query';
    this.parameters = {
      query: {
        type: 'string',
        description: 'The search query to look up on the web',
        required: true
      },
      num_results: {
        type: 'number',
        description: 'Number of results to return (default: 5, max: 10)',
        required: false,
        default: 5
      }
    };
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async execute(parameters: Record<string, any>): Promise<any> {
    const query = parameters.query;
    const numResults = Math.min(parameters.num_results || 5, 10);

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: numResults
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        return {
          success: true,
          results: [],
          message: 'No results found for the query.'
        };
      }

      const searchResults: SearchResult[] = response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || 'No description available'
      }));

      return {
        success: true,
        results: searchResults,
        message: `Found ${searchResults.length} results for "${query}"`
      };
    } catch (error) {
      console.error('Error executing web search:', error);
      
      return {
        success: false,
        error: error,
        message: `Failed to search for "${query}"`
      };
    }
  }
}