module.exports = {
  title: 'Medium Map Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.map.medium',
  description: 'A medium map card',
  properties: {
    title: {
      type: 'string',
      description: 'Title of the map'
    },
    center: {
      description: 'Coordinates center of a map',
      $ref: 'http://json-schema.org/geo'
    },
    pins: {
      description: 'Coordinates of pins on a map',
      type: 'array',
      items: {
        properties: {
          title: {
            type: 'string',
            description: 'Title of a pin'
          },
          location: {
            $ref: 'http://json-schema.org/geo',
            description: 'Location of pin'
          }
        }
      }
    }
  }
}