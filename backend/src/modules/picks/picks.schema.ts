/**
 * Picks module validation schemas - JSON Schema format for Fastify
 */
export const submitPicksSchema = {
  type: 'object',
  required: ['weekId', 'picks'],
  properties: {
    weekId: {
      type: 'string',
      minLength: 1
    },
    picks: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        required: ['gameId', 'selection'],
        properties: {
          gameId: {
            type: 'string',
            minLength: 1
          },
          selection: {
            type: 'string',
            enum: ['home', 'away']
          }
        }
      }
    },
    tiebreakerScore: {
      type: 'number',
      minimum: 0
    }
  }
};