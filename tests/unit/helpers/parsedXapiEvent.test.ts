import { expect } from 'chai'
import { XApiRecordBuilder } from '../../builders'
import { ParsedXapiEvent } from '../../../src/helpers/parsedXapiEvent'
import { v4 } from 'uuid'
import { XApiRecord } from '../../../src/db/xapi'

describe('parsedXapiEvent', () => {
  context('event is undefined', () => {
    it('returns null', async () => {
      // Arrange
      const roomId = 'room1'
      const rawXapiEvent: XApiRecord | undefined | null = undefined

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

      const rawXapiEvent = new XApiRecordBuilder().withUserId(userId).build()

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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

        const rawXapiEvent: XApiRecord = {
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

        const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

        const rawXapiEvent: XApiRecord = {
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

        const rawXapiEvent: XApiRecord = {
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

        const rawXapiEvent: XApiRecord = {
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

  context(
    'event.xapi.data.statement.object.definition.extensions.subContentId is defined',
    () => {
      it('h5pParentId is set as h5pId', async () => {
        // Arrange
        const roomId = 'room1'

        const rawXapiEvent: XApiRecord = {
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
                        id: 'http://h5p.org/libraries/H5P.Flashcards-1.2',
                      },
                    ],
                  },
                },
                object: {
                  definition: {
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': v4(),
                      'http://h5p.org/x-api/h5p-subContentId': v4(),
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
        expect(resultEvent?.h5pType).to.not.be.undefined
        expect(resultEvent?.h5pParentId).to.equal(resultEvent?.h5pId)
      })
    },
  )

  context(
    'event.xapi.data.statement.context.contextActivities.parent.id is defined',
    () => {
      it('h5pParentId is set as h5pId', async () => {
        // Arrange
        const roomId = 'room1'
        const depth0Id = v4()
        const depth1Id = v4()
        const depth2Id = v4()

        const rawXapiEvent: XApiRecord = {
          userId: v4(),
          serverTimestamp: Date.now(),
          xapi: {
            clientTimestamp: Date.now(),
            data: {
              statement: {
                context: {
                  contextActivities: {
                    parent: [
                      {
                        id: `undefined?subContentId=${depth1Id}`,
                      },
                    ],
                  },
                },
                object: {
                  definition: {
                    extensions: {
                      'http://h5p.org/x-api/h5p-local-content-id': depth0Id,
                      'http://h5p.org/x-api/h5p-subContentId': depth2Id,
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
        expect(resultEvent?.h5pId).to.equal(depth0Id)
        expect(resultEvent?.h5pSubId).to.equal(depth2Id)
        expect(resultEvent?.h5pParentId).to.equal(depth1Id)
      })
    },
  )

  context('event.xapi.data.statement.verb is undefined', () => {
    it('returns non-null value', async () => {
      // Arrange
      const roomId = 'room1'

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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

      const rawXapiEvent: XApiRecord = {
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
