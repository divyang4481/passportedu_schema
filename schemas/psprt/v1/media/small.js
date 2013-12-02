module.exports = {
  title: 'Small Media Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.media.small',
  description: 'A small media card',
  properties: {
    title: {
      title: 'Title',
      description: 'Heading of the media',
      type: 'string',
      maxLength: 12,
      minLength: 0
    },
    paragraph: {
      title: 'Paragraph text',
      description: 'A paragraph describing image.',
      type: 'string',
      maxLength: 190,
      minLength: 0
    },
    imgData: {
      title: 'Image (small)',
      description: 'Data containing a small photo to go with paragraph.',
      type: 'string',
      maxLength: 2000,
      media: {
        'binaryEncoding': 'base64',
        'type': 'image/png'
      }
    }
  },
  links: [

  ]
};
