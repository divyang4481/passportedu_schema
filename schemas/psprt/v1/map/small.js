module.exports = {
  title: 'Small Map Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.map.small',
  description: 'A small map card',
  properties: {
    title: {
      type: 'string',
      description: 'Title of the map'
    },
    center: {
      description: 'Coordinates center of a map',
      $ref: 'http://json-schema.org/geo'
    },
    pin: {
      description: 'Coordinates of pins on a map',
      type: 'object',
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
  },
  links: [

  ]
}