/* The opening figure's example: three contexts and a question that needs all three. */
export const storyExample = {
  contexts: [
    { id: 'c1', label: 'Context 1', text: 'Lina puts the key in a blue box.' },
    { id: 'c2', label: 'Context 2', text: 'Omar carries the blue box to the study.' },
    { id: 'c3', label: 'Context 3', text: 'The study is upstairs.' },
  ],
  question: 'Is the key upstairs or downstairs?',
  answer: 'Upstairs.',
} as const
