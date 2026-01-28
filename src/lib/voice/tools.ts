/**
 * Client tools for ElevenLabs voice agent
 *
 * These tools are executed client-side when the voice agent calls them.
 * Tool names are case-sensitive and must match ElevenLabs dashboard config.
 */

// Type definition for client tools compatible with @elevenlabs/react
type ToolHandler = (params: Record<string, unknown>) => Promise<string>;

interface ClientTool {
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  handler: ToolHandler;
}

export type ClientToolsMap = Record<string, ClientTool>;

/**
 * Navigator mode tools - site-wide navigation and search
 */
export const navigatorTools: ClientToolsMap = {
  navigateToPage: {
    description:
      'Navigate the user to a specific page on the website. Use this when the user wants to go to an agent profile, suburb page, or agency page.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The URL path to navigate to (e.g., /agent/john-smith-bondi)',
        },
      },
      required: ['path'],
    },
    handler: async (params) => {
      const { path } = params as { path: string };
      window.location.href = path;
      return 'Navigated successfully';
    },
  },

  searchAgents: {
    description:
      'Search for agents, agencies, or suburbs. Returns matching results.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
    handler: async (params) => {
      const { query } = params as { query: string };
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.success) {
          return JSON.stringify({ error: 'Search failed' });
        }

        return JSON.stringify({
          agents_found: data.data?.agents?.length ?? 0,
          agencies_found: data.data?.agencies?.length ?? 0,
          suburbs_found: data.data?.suburbs?.length ?? 0,
          top_results: (data.data?.agents ?? [])
            .slice(0, 3)
            .map((a: Record<string, unknown>) => ({
              name: a.full_name,
              agency: a.agency_name,
              slug: a.slug,
              suburb: a.suburb,
            })),
        });
      } catch {
        return JSON.stringify({ error: 'Search failed' });
      }
    },
  },

  filterResults: {
    description: 'Apply filters on the current agent listing page.',
    parameters: {
      type: 'object',
      properties: {
        sort: {
          type: 'string',
          enum: ['sales_count', 'avg_price', 'rating', 'name'],
          description: 'Sort order for results',
        },
        propertyType: {
          type: 'string',
          enum: ['house', 'apartment', 'townhouse', 'land'],
          description: 'Filter by property type',
        },
      },
    },
    handler: async (params) => {
      const { sort, propertyType } = params as { sort?: string; propertyType?: string };
      const urlParams = new URLSearchParams(window.location.search);
      if (sort) urlParams.set('sort', sort);
      if (propertyType) urlParams.set('type', propertyType);
      window.location.search = urlParams.toString();
      return 'Filters applied';
    },
  },

  scrollToSection: {
    description: 'Scroll to a section on the current page.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Section ID (e.g., reviews, sales-history, stats)',
        },
      },
      required: ['section'],
    },
    handler: async (params) => {
      const { section } = params as { section: string };
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return `Scrolled to ${section}`;
      }
      return `Section ${section} not found`;
    },
  },

  activateAssistant: {
    description:
      "Switch from Navigator to Assistant mode for the current agent or agency. Use when user wants to talk to the agent's assistant.",
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Agent or agency slug',
        },
      },
      required: ['slug'],
    },
    handler: async (params) => {
      const { slug } = params as { slug: string };
      window.dispatchEvent(
        new CustomEvent('voice-mode-change', {
          detail: { mode: 'assistant', slug },
        })
      );
      return 'Switching to assistant mode';
    },
  },

  highlightAgent: {
    description:
      "Highlight a specific agent's card on a listing page to draw the user's attention.",
    parameters: {
      type: 'object',
      properties: {
        agentSlug: {
          type: 'string',
          description: "The agent's slug identifier",
        },
      },
      required: ['agentSlug'],
    },
    handler: async (params) => {
      const { agentSlug } = params as { agentSlug: string };
      const card = document.querySelector(`[data-agent-slug="${agentSlug}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
        }, 5000);
        return 'Agent highlighted';
      }
      return 'Agent card not found on this page';
    },
  },
};

/**
 * Assistant mode tools - minimal, conversation-focused
 */
export const assistantTools: ClientToolsMap = {
  scrollToSection: {
    description:
      'Scroll to a section on the current page to show the user specific information.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Section ID (e.g., reviews, sales-history, stats, contact)',
        },
      },
      required: ['section'],
    },
    handler: async (params) => {
      const { section } = params as { section: string };
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return `Scrolled to ${section}`;
      }
      return `Section ${section} not found`;
    },
  },
};
