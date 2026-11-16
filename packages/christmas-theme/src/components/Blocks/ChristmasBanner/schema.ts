export const ChristmasBannerSchema = () => ({
  title: 'Christmas Banner',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['greeting', 'message', 'decorations', 'variant'],
    },
  ],
  properties: {
    greeting: {
      title: 'Greeting Headline',
      type: 'string',
      default: "Season's Greetings!",
    },
    message: {
      title: 'Banner Message',
      type: 'string',
      default: 'Wishing you a joyful holiday season and a prosperous New Year.',
    },
    decorations: {
      title: 'Holiday Emojis',
      type: 'string',
      default: '🎄 ❄️ 🎁 🎅',
    },
    variant: {
      title: 'Banner Style',
      type: 'string',
      choices: [
        ['evergreen', 'Evergreen Forest'],
        ['candy-cane', 'Candy Cane Red'],
        ['gold', 'Holiday Gold'],
      ],
      default: 'evergreen',
    },
  },
  required: [],
});
