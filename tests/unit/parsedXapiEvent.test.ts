import { expect } from 'chai'
import { XAPIRecordBuilder } from '../builders'
import { ParsedXapiEvent } from '../../src/helpers/parsedXapiEvent'
import { v4 } from 'uuid'
import { XAPIRecord } from '../../src/db/xapi/repo'

describe('parsedXapiEvent', () => {
  context('event is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'
      const rawXapiEvent: XAPIRecord | undefined | null = undefined

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.userId is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'
      const userId: string | undefined = undefined

      const rawXapiEvent = new XAPIRecordBuilder().withUserId(userId).build()

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: undefined,
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi.clientTimestamp is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: { clientTimestamp: undefined, data: undefined },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi.data is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: { clientTimestamp: Date.now(), data: undefined },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi.data.statement is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: { clientTimestamp: Date.now(), data: { statement: undefined } },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi.data.statement.object is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: { statement: { object: undefined } },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context('event.xapi.data.statement.object.definition is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: { statement: { object: { definition: undefined } } },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.be.null
    })
  })

  context(
    'event.xapi.data.statement.object.definition.name is undefined',
    () => {
      it('returns non-null value', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XAPIRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            clientTimestamp: Date.now(),
            data: {
              statement: {
                object: {
                  definition: {
                    name: undefined,
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': v4(),
                    },
                  },
                },
              },
            },
          },
        }

        // Act
        const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

        // Assert
        expect(resultEvent).to.not.be.null
      })
    },
  )

  context(
    'event.xapi.data.statement.object.definition.extensions is undefined',
    () => {
      it('returns null', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XAPIRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            data: {
              statement: { object: { definition: { extensions: undefined } } },
            },
          },
        }

        // Act
        const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

        // Assert
        expect(resultEvent).to.be.null
      })
    },
  )

  context('event.xapi.data.statement.context is undefined', () => {
    it('returns non-null value', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: {
            statement: {
              context: undefined,
              object: {
                definition: {
                  extensions: {
                    'http://h5p.org/x-api/h5p-local-content-id': v4(),
                  },
                },
              },
            },
          },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.not.be.null
    })
  })

  context(
    'event.xapi.data.statement.context.contextActivities is undefined',
    () => {
      it('returns non-null value', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XAPIRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            clientTimestamp: Date.now(),
            data: {
              statement: {
                context: { contextActivities: undefined },
                object: {
                  definition: {
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': v4(),
                    },
                  },
                },
              },
            },
          },
        }

        // Act
        const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

        // Assert
        expect(resultEvent).to.not.be.null
      })
    },
  )

  context(
    'event.xapi.data.statement.context.contextActivities.category is undefined',
    () => {
      it('returns non-null value', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XAPIRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            clientTimestamp: Date.now(),
            data: {
              statement: {
                context: { contextActivities: { category: undefined } },
                object: {
                  definition: {
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': v4(),
                    },
                  },
                },
              },
            },
          },
        }

        // Act
        const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

        // Assert
        expect(resultEvent).to.not.be.null
      })
    },
  )

  context(
    'event.xapi.data.statement.context.contextActivities.category has invalid format',
    () => {
      it('returns non-null value', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XAPIRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            clientTimestamp: Date.now(),
            data: {
              statement: {
                context: {
                  contextActivities: {
                    category: [
                      {
                        // End should be H5P.Flashcards-1.2
                        id: 'http://h5p.org/libraries/Flashcards-1.2',
                      },
                    ],
                  },
                },
                object: {
                  definition: {
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': v4(),
                    },
                  },
                },
              },
            },
          },
        }

        // Act
        const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

        // Assert
        expect(resultEvent).to.not.be.null
        expect(resultEvent?.h5pType).to.be.undefined
      })
    },
  )

  context('event.xapi.data.statement.verb is undefined', () => {
    it('returns non-null value', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: {
            statement: {
              verb: undefined,
              object: {
                definition: {
                  extensions: {
                    'http://h5p.org/x-api/h5p-local-content-id': v4(),
                  },
                },
              },
            },
          },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.not.be.null
    })
  })

  context('event.xapi.data.statement.verb.display is undefined', () => {
    it('returns non-null value', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: {
            statement: {
              verb: { display: undefined },
              object: {
                definition: {
                  extensions: {
                    'http://h5p.org/x-api/h5p-local-content-id': v4(),
                  },
                },
              },
            },
          },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.not.be.null
    })
  })

  context('event.xapi.data.statement.result is undefined', () => {
    it('returns non-null value', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XAPIRecord = {
        userId: v4(),
        serverTimestamp: Date.now(),
        xapi: {
          clientTimestamp: Date.now(),
          data: {
            statement: {
              result: undefined,
              object: {
                definition: {
                  extensions: {
                    'http://h5p.org/x-api/h5p-local-content-id': v4(),
                  },
                },
              },
            },
          },
        },
      }

      // Act
      const resultEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)

      // Assert
      expect(resultEvent).to.not.be.null
    })
  })
})
