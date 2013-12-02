module.exports = {
  title: 'Medium Media Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.media.medium',
  description: 'A medium media card',
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
      title: 'Image (medium)',
      description: 'Data containing a medium photo to go with paragraph.',
      type: 'string',
      maxLength: 5000,
      media: {
        'binaryEncoding': 'base64',
        'type': 'image/png'
      }
    }
  },
  links: [

  ]
};
