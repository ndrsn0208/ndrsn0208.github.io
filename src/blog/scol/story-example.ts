export const storyExample = {
  label: 'A small reasoning story',
  chunks: [
    { id: 'c1', label: 'Note 1', text: 'Lina puts the key in a blue box.', relation: 'key → blue box' },
    { id: 'c2', label: 'Note 2', text: 'Omar carries the blue box to the study.', relation: 'blue box → study' },
    { id: 'c3', label: 'Note 3', text: 'The study is upstairs.', relation: 'study → upstairs' },
  ],
  question: 'Is the key upstairs or downstairs?',
  answer: 'Upstairs.',
  explanation: 'The key is in the blue box. The box is in the study, which is upstairs.',
} as const
