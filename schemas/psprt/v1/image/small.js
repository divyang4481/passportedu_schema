module.exports = {
  title: 'Small Image Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.image.small',
  description: 'A small image card',
  properties: {
    imgData: {
      title: 'Image (small)',
      description: 'Data containing a small photo to go with paragraph.',
      type: 'string',
      maxLength: 2000,
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