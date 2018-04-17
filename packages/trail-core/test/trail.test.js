require('./utils')

const {TrailComponent, Trail} = require('../lib/trail')

describe('TrailComponent', () => {
  describe('constructor', () => {
    test('should create a component from a string', () => {
      const subject = new TrailComponent('FOO')

      expect(subject.id).toEqual('FOO')
      expect(subject.attributes).toEqual({})
    })

    test('should create a component from a object, excluding the id from the attributes', () => {
      const subject = new TrailComponent({id: '1', a: 2, b: 3})

      expect(subject.id).toEqual('1')
      expect(subject.attributes).toEqual({a: 2, b: 3})
    })

    test('should create a component from a object with a specific key as id', () => {
      const subject = new TrailComponent({id: 1, a: '2', b: 3}, 'a')

      expect(subject.id).toEqual('2')
      expect(subject.attributes).toEqual({id: 1, b: 3})
    })

    test('should not allow non objects and non strings as input', () => {
      expect(() => {
        new TrailComponent(123) // eslint-disable-line no-new
      }).toThrow('A trail component must be initialized either with a string or a object.')

      expect(() => {
        new TrailComponent([1, 2, 3]) // eslint-disable-line no-new
      }).toThrow('A trail component must be initialized either with a string or a object.')
    })

    test('should not allow empty strings as input', () => {
      expect(() => {
        new TrailComponent('') // eslint-disable-line no-new
      }).toThrow('The id of a trail component must be a non empty string.')
    })

    test('should require the id property to be defined', () => {
      expect(() => {
        new TrailComponent({a: 1}, 'b') // eslint-disable-line no-new
      }).toThrow('The "b" property of a trail component must be defined.')
    })
  })
})

describe('Trail', () => {
  describe('constructor', () => {
    test('should parse string timestamps', () => {
      const subject = new Trail('id', '2018-01-01T12:34:56', 'who', 'what', 'subject')

      expect(subject.when).toBeSameDate('2018-01-01T12:34:56')
    })

    test('should raise an error if argument "where" is neither undefined or an object', () => {
      expect(() => {
        new Trail('id', '2018-01-01T12:34:56', 'who', 'what', 'subject', 'invalid value')
      }).toThrow('The where argument must be either undefined or an object.')
    })

    test('should raise an error if argument "why" is neither undefined or an object', () => {
      expect(() => {
        new Trail('id', '2018-01-01T12:34:56', 'who', 'what', 'subject', null, 'invalid value')
      }).toThrow('The why argument must be either undefined or an object.')
    })

    test('should raise an error if argument "meta" is neither undefined or an object', () => {
      expect(() => {
        new Trail('id', '2018-01-01T12:34:56', 'who', 'what', 'subject', null, null, 'invalid value')
      }).toThrow('The meta argument must be either undefined or an object.')
    })

    test('should raise an error if argument "date" isn\'t a string', () => {
      expect(() => {
        new Trail('id', {}, 'who', 'what', 'subject')
      }).toThrow('Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.')
    })

    test('should raise an error if argument "date" isn\'t a valid date', () => {
      expect(() => {
        new Trail('id', 'not a valid date', 'who', 'what', 'subject', null, null, 'invalid value')
      }).toThrow('Invalid date "not a valid date". Please specify a valid UTC date in ISO8601 format.')
    })
  })
})
