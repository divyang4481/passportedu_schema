module.exports = {
  title: 'Medium QRCode Schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  name: 'psprt.v1.qrcode.medium',
  description: 'A medium QR Code card',
  properties: {
    title: {
      title: 'Title',
      description: 'Heading of the QR Code',
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
    qrCodeURL: {
      title: 'QR Code URL',
      description: 'link to embed in QR Code.',
      type: 'string'
    }
  },
  links: [

  ]
};
