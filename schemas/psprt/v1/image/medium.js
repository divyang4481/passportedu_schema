module.exports = {
  title: 'Medium Image Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.image.medium',
  description: 'A large image card',
  properties: {
    imgData: {
      title: 'Image (medium)',
      description: 'Data containing a medium photo to go with paragraph.',
      type: 'string',
      maxLength: 5000,
      media: {
        binaryEncoding: 'base64',
        type: 'image/png'
      }
    },
    alt: {
      title: 'Alternate text.',
      description: 'Text for browser that cannot render images.',
      type: 'string'
    }
  },
  links: [

  ]
}