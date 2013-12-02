module.exports = {
  title: 'Small Range Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.range.small',
  description: 'A small range card',
  properties: {
    title: {
      type: 'string',
      description: 'Title of the range',
      maxLength: 24
    },
    bigEnd: {
      type: 'string',
      description: 'the top of the range',
      maxLength: 7
    },
    smallEnd: {
      type: 'string',
      description: 'the small end',
      maxLength: 7
    },
    paragraph: {
      type: 'string',
      description: 'the description of the range',
      maxLength: 100
    }
  },
  links: [

  ]
}
