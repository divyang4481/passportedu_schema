module.exports = {
  title: 'Medium Video Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.video.medium',
  description: 'A medium media card',
  properties: {
    title: {
      title: 'Title',
      description: 'Heading of the video',
      type: 'string',
      maxLength: 12,
      minLength: 0
    },
    paragraph: {
      title: 'Paragraph text',
      description: 'A paragraph describing video.',
      type: 'string',
      maxLength: 190,
      minLength: 0
    },
    videoURI: {
      title: 'Video URI (medium)',
      description: 'link to a medium video.',
      type: 'string'
    }
  },
  links: [

  ]
};
