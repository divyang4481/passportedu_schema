module.exports = {
  title: 'Small Form Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.form.small',
  description: 'A small form card',
  properties: {
    title: {
      title: 'Title',
      description: 'Heading of the form',
      type: 'string',
      maxLength: 12,
      minLength: 0
    },
    fields: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
      items: {
        properties: {
          prompt: {
            type: 'string',
            description: 'What the user should submit.'
          },
          name: {
            type: 'string'
          },
          value: {
            type: {
              enum: [
                'text',
                'number',
                'email',
                'password',
                'radio',
                'checkbox',
                'date',
                'datetime',
                'month',
                'week',
                'tel',
                'time',
                'url',
                'range',
                'color',
                'submit'
              ]
            }
          }
        }
      }
    }
  },
  links: [

  ]
};
