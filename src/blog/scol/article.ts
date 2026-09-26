export const scolArticle = {
  title: 'Self-Consolidating Language Models',
  subtitle: 'Writing context into model weights at test time',
  deck: 'We turn a growing context into a stream of learning updates. SCoL learns where to write new information into its weights so it remains useful after the original context is gone.',
  introduction: [],
  sections: [
    {
      id: 'history',
      eyebrow: 'A growing history',
      title: 'When later questions depend on earlier evidence',
      paragraphs: [
        'Consider a small story told over three messages. Lina puts the key in a blue box. Omar carries the blue box to the study. The study is upstairs. Later, someone asks whether the key is upstairs or downstairs. The answer is upstairs, but reaching it requires connecting all three messages. Remembering only the last one is not enough.',
        'Now imagine those messages arriving across days of conversations, documents, and tool use. An assistant accumulates a history much larger than a single prompt. With standard attention, carrying that growing history into inference increases computation and memory use. A longer window still does not guarantee that the model will use the relevant evidence. What we need is for past experience to remain useful as new experience arrives.',
        'Our starting point is human memory consolidation. We can learn from a conversation and use what we learned later without replaying the whole exchange. Experience leaves lasting changes in the internal representations that support recall and reasoning. We want language models to gain a similar ability by writing incoming context into their weights at test time. SCoL learns where those changes should happen, restricting each update to a small set of Transformer layers.',
      ],
    },
    {
      id: 'memory',
      eyebrow: 'A growing history',
      title: 'From carrying context to learning from it',
      paragraphs: [
        'A larger window keeps more of the history in view. Recursive processing revisits earlier material, while compression carries a shorter summary or state forward. Retrieval brings selected passages back when they seem relevant. Each reduces a different part of the burden of working with a long history.',
        'With fixed weights, past information must still reach the model through a prompt or a carried state. The history has to be kept, compressed, or found again. A summary can leave out a detail that turns out to matter later, and retrieval has to find that detail before the model can use it. These methods improve access to past experience, but they do not by themselves make that experience part of the model’s weights.',
        'We take the more direct route of learning from the context itself. New information is written into the model’s weights so it can influence later answers after the original text has left the prompt. A growing history becomes a stream of learning updates to the same model. This recasts long-context inference as a continual learning problem, where each new experience must be learned without erasing what came before.',
      ],
    },
    {
      id: 'consolidation',
      eyebrow: 'Consolidating a stream',
      title: 'Writing context into the model',
      paragraphs: [
        'We call this setting continual context consolidation. A model receives text one chunk at a time and updates its parameters before moving on. Each new chunk reaches a model that already includes changes from the previous ones. At question time, the model draws on those accumulated updates, after the original context has been removed from the prompt.',
        'In our story, learning that the key is in the blue box changes the model that then reads about the box moving to the study. Learning that the study is upstairs changes it again. The final question can draw on those accumulated changes, even though the three earlier messages are no longer in the prompt.',
        'The original text can now leave the prompt while what was learned remains available through the parameters. The model keeps the same architecture as the stream grows. This makes the quality of each update crucial. Future questions depend on what the model learns and retains from its experience.',
      ],
    },
    {
      id: 'forgetting',
      eyebrow: 'Consolidating a stream',
      title: 'Memory has to survive new learning',
      paragraphs: [
        'Writing context into weights brings the classic problem of catastrophic forgetting into long-context inference. Sequential updates can interfere because the same parameters support many behaviors. The model might learn that the study is upstairs while weakening the connection between the key and the blue box. The latest clue survives, but the chain needed for the later question no longer holds.',
        'We call learning the current material acquisition, and the continued usefulness of earlier learning retention. Looking at both makes the problem visible. A model can learn each passage when it arrives and still answer poorly about the beginning of the stream after many later updates.',
        'Continual learning methods often protect earlier knowledge by constraining parameter changes or estimating which parameters matter. We ask whether the model can learn where to change itself as new context arrives. Sparse updates give it a limited set of layers in which to absorb each chunk, and feedback on acquisition and forgetting teaches it how to use that space.',
      ],
    },
    {
      id: 'selection',
      eyebrow: 'Learning where to update',
      title: 'Letting the model select its layers',
      paragraphs: [
        'For each incoming context, SCoL asks the current LLM to generate a list of Transformer layer indices. That list is the action, and the model’s distribution over possible lists is its selection policy. In our experiments, each action can select up to 10 of the model’s 28 layers.',
        'We attach LoRA adapters to the selected layers and train them with causal language modeling, predicting the next token from preceding text. The training data and update procedure stay fixed across layer selections, letting us compare the consequences of different update locations. When an update is committed, its adapter is merged into the model weights.',
        'This builds on work such as SEAL, which learns to generate adaptation instructions. SCoL focuses that decision on which layers to update. Because an update changes the model that will choose the next layers, learning to select them requires following the model through a sequence of its own changes.',
      ],
    },
    {
      id: 'learning',
      eyebrow: 'Learning where to update',
      title: 'Training through the changes it makes',
      paragraphs: [
        'During training, the current model samples 10 candidate layer lists for the same chunk. Each candidate starts from the same current model state and receives the same LoRA adaptation procedure at its selected layers. We then compare the resulting models, asking how well each has learned the new material and how much it has disturbed earlier learning.',
        'The reward combines those two effects: acquisition minus a weighted forgetting term. Increasing the weight gives preservation of earlier learning more influence over the ranking. Past contexts or their question-answer checks are kept during training to evaluate forgetting, while each candidate’s adaptation uses the current material. This lets the evaluation reach back through the stream even though the update is local to the incoming chunk.',
        'We commit the single candidate with the highest reward, merge its adapter into the running model, and move to the next chunk. The other candidate states are discarded. At every step, the reward comparisons also provide preferences between better and worse layer selections. We collect these preferences throughout the stream for the outer learning loop.',
      ],
      afterFigure: [
        'The same evolving LLM both absorbs context and chooses the next update. Each committed action therefore changes the policy that makes the next decision. This motivates meta-reinforcement learning: we train a starting model by following the consequences of its own adaptation through the stream.',
        'After the stream, we use the collected preferences to train the model saved at the beginning of the round, rather than the model at the end of the stream. Identity Preference Optimisation, or IPO, favors higher-reward layer lists relative to a fixed copy of that starting policy. The next round begins from the improved model and follows a fresh sequence of consolidation decisions.',
        'SQuAD provides held-out questions for measuring acquisition and forgetting, with performance on earlier passages compared against their first-consolidation baselines. LongBench v2 uses an intrinsic reward based on improved prediction of the incoming text and normalized likelihood drops on earlier chunks. It requires no downstream QA labels.',
        'At evaluation on SQuAD, the trained model generates one layer selection per passage and commits the resulting update. It uses the policy learned from these comparisons to choose an adaptation directly.',
      ],
    },
    {
      id: 'results',
      eyebrow: 'What the experiments show',
      title: 'Measuring acquisition and retention',
      paragraphs: [
        'We evaluate this memory through what the model can answer after learning from context. With Qwen2.5-7B-Instruct on a stream of 100 SQuAD passages, SCoL reaches 35.40% immediate accuracy and 20.46% retention. Removing the forgetting term gives 34.30% and 14.64%, respectively, while continual SEAL reaches 13.70% and 1.30%. Rewarding retention improves how well earlier learning survives later updates, alongside a small increase in immediate acquisition.',
        'A fixed policy that always updates the last 10 layers reaches 28.78% immediate accuracy and 20.10% retention. Under the same layer budget, SCoL improves acquisition while achieving comparable retention.',
        'LongBench v2 tests whether a policy learned on shorter streams transfers to longer ones. We meta-train on contexts of 16k to 32k tokens, processed in 2,048-token chunks, and evaluate on streams up to 64k. SCoL reaches 42.3% accuracy on short contexts and 37.0% on long contexts, compared with 36.5% and 23.0% for sequential finetuning.',
        'SCoL leads the evaluated baselines on short contexts. On long contexts, Batch TTT is stronger at 41.5%, compared with SCoL’s 37.0%. Batch TTT trains jointly on the full passage, while SCoL consolidates it sequentially. Full Context and Summarization reach 35.5% and 36.0%. The results show transfer beyond the training lengths and identify a remaining gap to adaptation with joint access to the document.',
      ],
    },
    {
      id: 'fisher',
      eyebrow: 'What the model learns',
      title: 'The learned selections align with Fisher importance',
      paragraphs: [
        'The accuracy results tell us whether consolidation helps. The layer selections let us look more closely at what the model has learned about its own parameters. We examine these choices through layerwise Fisher information, estimated on the running model before each new passage is consolidated. These squared-gradient estimates indicate where the current passage loss is sensitive to changes in the weights.',
        'We compare the model’s selected layers with an equally sized set of layers that have the highest Fisher scores. Their overlap tells us how closely the learned choices follow those sensitive regions. With 10 selections among 28 layers, a random policy has an expected overlap of 35.7%.',
      ],
      afterFigure: [
        'Across 100 SQuAD passages, SCoL reaches 45.1% alignment, compared with 41.0% when the forgetting term is removed and 35.7% for random selection. The policy learns from acquisition and forgetting rewards. Fisher scores are computed separately for this analysis and are never given to the model when it chooses layers.',
        'This gives a more concrete picture of the learned behavior. The selected updates tend to target layers that are responsive to the incoming passage, while the sparse budget leaves most layers unchanged. It connects the policy’s choices to selective plasticity, a recurring idea in continual learning. Acquisition and retention remain the behavioral checks on whether those choices help.',
      ],
    },
    {
      id: 'outlook',
      eyebrow: 'What the experiments show',
      title: 'Learning over longer histories',
      paragraphs: [
        'The next step is to study consolidation across longer and more varied histories. Beyond the two settings tested with this 7B model, an assistant would encounter changing topics, revisited questions, and information whose usefulness emerges much later. Understanding how update choices interact with those demands could guide the design of models that continue learning during deployment.',
        'Training the selection policy for more rounds brings another challenge. In additional IPO rounds, the model can converge on repeated layer lists, reducing the variety of updates it chooses for different contexts. Preserving that diversity while improving acquisition and retention is a concrete direction for further work.',
      ],
    },
  ],
  closing: [
    'We want language models to accumulate knowledge from their own experience. SCoL pursues that goal by learning context into weights and learning where those changes should happen. The next challenge is to make this memory reliable across the longer, changing histories a deployed model will encounter.',
  ],
  references: [
    {
      title: 'Lost in the Middle: How Language Models Use Long Contexts',
      url: 'https://aclanthology.org/2024.tacl-1.9/',
    },
    {
      title: 'The Consolidation and Transformation of Memory',
      url: 'https://doi.org/10.1016/j.neuron.2015.09.004',
    },
    {
      title: 'Why There Are Complementary Learning Systems in the Hippocampus and Neocortex',
      url: 'https://doi.org/10.1037/0033-295X.102.3.419',
    },
    {
      title: 'Compressive Transformers for Long-Range Sequence Modelling',
      url: 'https://arxiv.org/abs/1911.05507',
    },
    {
      title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
      url: 'https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html',
    },
    {
      title: 'Overcoming Catastrophic Forgetting in Neural Networks',
      url: 'https://arxiv.org/abs/1612.00796',
    },
    {
      title: 'Continual Learning Through Synaptic Intelligence',
      url: 'https://proceedings.mlr.press/v70/zenke17a.html',
    },
    {
      title: 'LoRA: Low-Rank Adaptation of Large Language Models',
      url: 'https://arxiv.org/abs/2106.09685',
    },
    {
      title: 'Self-Adapting Language Models',
      url: 'https://openreview.net/forum?id=JsNUE84Hxi',
    },
    {
      title: 'A General Theoretical Paradigm to Understand Learning from Human Preferences',
      url: 'https://arxiv.org/abs/2310.12036',
    },
    {
      title: 'SQuAD: 100,000+ Questions for Machine Comprehension of Text',
      url: 'https://aclanthology.org/D16-1264/',
    },
    {
      title: 'LongBench v2: Towards Deeper Understanding and Reasoning on Realistic Long-context Multitasks',
      url: 'https://aclanthology.org/2025.acl-long.183/',
    },
    {
      title: 'On the Computation of the Fisher Information in Continual Learning',
      url: 'https://arxiv.org/abs/2502.11756',
    },
  ],
} as const

export const paragraphCitations: Record<string, Record<number, readonly number[]>> = {
  history: { 1: [1], 2: [2, 3] },
  memory: { 0: [4], 1: [5] },
  forgetting: { 0: [6], 2: [6, 7] },
  selection: { 1: [8], 2: [9] },
  'learning-after': { 1: [10], 2: [11, 12] },
  results: { 0: [11], 2: [12] },
  fisher: { 0: [13] },
  'fisher-after': { 1: [7] },
}

const paragraphEmphasis: Record<string, Record<number, readonly string[]>> = {
  history: {
    0: ['connecting all three messages'],
    2: ['human memory consolidation', 'writing incoming context into their weights at test time'],
  },
  memory: {
    1: ['The history has to be kept, compressed, or found again'],
    2: ['learning from the context itself', 'long-context inference as a continual learning problem'],
  },
  consolidation: { 0: ['continual context consolidation', 'after the original context has been removed from the prompt'] },
  forgetting: { 0: ['catastrophic forgetting'], 1: ['acquisition', 'retention'] },
  selection: { 0: ['up to 10 of the model’s 28 layers'] },
  learning: {
    0: ['same current model state'],
    1: ['acquisition minus a weighted forgetting term'],
    2: ['single candidate with the highest reward'],
  },
  'learning-after': {
    0: ['same evolving LLM'],
    1: ['model saved at the beginning of the round'],
    2: ['no downstream QA labels'],
  },
  results: {
    0: ['35.40% immediate accuracy and 20.46% retention'],
    2: ['transfers to longer ones'],
    3: ['Batch TTT is stronger at 41.5%'],
  },
  fisher: { 0: ['before each new passage is consolidated'] },
  'fisher-after': { 0: ['never given to the model when it chooses layers'] },
}

export function paragraphParts(id: string, index: number, text: string) {
  const ranges = (paragraphEmphasis[id]?.[index] ?? [])
    .map(phrase => ({ start: text.indexOf(phrase), length: phrase.length }))
    .filter(range => range.start >= 0)
    .sort((a, b) => a.start - b.start)
  const parts: { text: string, emphasis: boolean }[] = []
  let cursor = 0
  for (const { start, length } of ranges) {
    if (start < cursor) continue
    if (start > cursor) parts.push({ text: text.slice(cursor, start), emphasis: false })
    parts.push({ text: text.slice(start, start + length), emphasis: true })
    cursor = start + length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), emphasis: false })
  return parts
}
