import type { Essay } from '../essay/types'

/* The essay's words. The page and the static build both read this file, so it
   holds text only. Measurements quoted here are transcribed in evidence.ts and
   fisher-evidence.ts. Terms follow the paper, one term per concept. BLOG.md
   lists them. */

const paper = '/papers/self-consolidating-language-models.pdf'

export const scolEssay = {
  id: 'scol',
  path: '/blog/self-consolidating-language-models/',
  name: 'Self-Consolidating Language Models',
  headline: 'Writing context into model weights at test time',
  description: 'SCoL consolidates a stream of contexts into the model weights. The model generates the layer selection for each update and is trained with meta-reinforcement learning on a reward of acquisition minus forgetting.',
  date: '2026-09-25',
  authors: [
    { name: 'Zekun Wang', equal: true },
    { name: 'Anant Gupta', equal: true },
    { name: 'Zihan Dong' },
    { name: 'Christopher J. MacLellan' },
  ],
  authorNote: '* Equal contribution',
  affiliation: 'Georgia Institute of Technology',
  links: [{ label: 'Read the paper', href: paper }],
  image: '/blog-assets/scol/share/essay.png',
  imageAlt: 'Self-Consolidating Language Models. Writing context into model weights at test time. Three contexts are each consolidated into a few of the 28 layers of the model.',

  summary: [
    'Language models increasingly receive information as streams of passages, conversations, and long-context workflows. A longer context window exposes more evidence, but it does not ensure that the information is preserved and reused. We study **continual context consolidation**: writing each incoming context into the model weights while limiting forgetting of previously consolidated contexts.',
    'In **SCoL**, the model generates a layer selection for each context, which names the Transformer layers that receive a LoRA update. We train the model with meta-reinforcement learning on a reward of acquisition minus forgetting.',
    'On a stream of 100 SQuAD passages with Qwen2.5-7B-Instruct, SCoL reaches **35.4%** acquisition and **20.5%** retention. SEAL (continual), which applies SEAL to the same stream, retains 1.3%. On LongBench v2, SCoL is trained on short contexts only and reaches **42.3%** on short contexts and **37.0%** on long contexts.',
  ],
  lead: 'writing',

  sections: [
    {
      id: 'context',
      label: 'Long context',
      heading: 'Long-context inference as a continual learning problem',
      blocks: [
        { p: 'Language models increasingly operate over streaming context: multi-turn conversations, tool-using agents, and document workflows. The model must answer from the current prompt and also preserve earlier information for later use. Longer context windows help, but models underuse distant evidence and degrade as the context grows.[^lost-in-the-middle]' },
        { p: 'Retrieval, compression, and external memory manage access to the context.[^compressive][^rag] They depend on retrieval quality, auxiliary modules, or lossy compression, and they process the stored context again at inference time.' },
        { p: 'We study a complementary direction: using the model weights as memory. In theories of memory consolidation, experience is integrated into long-term representations instead of being kept as transient context.[^consolidation][^cls] We ask whether a context can be written into the weights so that it remains available after the context is gone.' },
      ],
    },
    {
      id: 'weights',
      label: 'Consolidation',
      heading: 'Continual context consolidation',
      blocks: [
        { p: 'The model receives a stream of contexts, one at a time. A context can be a text passage, a multi-turn interaction history, or a long-context window. At step t, the model consolidates the current context c into its weights θ with an update at the selected layers a.' },
        {
          math: String.raw`\theta_t=\theta_{t-1}\oplus\operatorname{Adapt}\big(\theta_{t-1},\,c_t,\,a_t\big)`,
          label: 'The weights after step t are the weights before it, combined with an update computed from those weights, the context c t, and the layer selection a t.',
        },
        { p: 'The weights carry all consolidated contexts. No retrieval index or external memory is kept, and at question time the contexts are not in the prompt. **This turns long-context inference into a continual learning problem**: each consolidation must preserve the previously consolidated contexts.' },
      ],
    },
    {
      id: 'forgetting',
      label: 'Forgetting',
      heading: 'Sequential updates cause forgetting',
      blocks: [
        { p: 'Sequential updates to a neural network are prone to catastrophic interference. An update for a new context changes weights that store previously consolidated contexts.[^ewc]' },
        { exhibit: 'interference' },
        { p: 'We measure two quantities on a stream. **Acquisition** is the accuracy on the questions of a context right after it is consolidated. **Retention** is the accuracy on the questions of past contexts after the whole stream is consolidated.' },
        { p: 'Classical continual learning methods reduce interference by estimating parameter importance, for example with Fisher-based regularization.[^ewc][^si] Reliable Fisher estimation is costly at the scale of a language model.[^fisher] We ask whether the model itself can determine where the update should occur.' },
      ],
    },
    {
      id: 'selection',
      label: 'Layer selection',
      heading: 'The model selects the layers to update',
      blocks: [
        { p: 'For each context, SCoL prompts the current model to generate a layer selection, a list of Transformer layer indices. In our experiments a layer selection contains **up to 10 of the 28 layers**.' },
        {
          math: String.raw`a_t\sim\pi_{\theta_{t-1}}(\,\cdot\mid c_t)`,
          label: 'The layer selection a t is sampled from the current model, given the context c t.',
        },
        { p: 'We attach LoRA adapters to the selected layers and train them on the context with the language-modeling objective.[^lora] The committed update becomes part of the weights. The LoRA hyperparameters are fixed, so the learned decision is where to update, not how strongly.' },
        { p: 'SCoL builds on SEAL, which trains a model to generate its own update instructions.[^seal] SCoL restricts the instruction to the layer selection. Each committed update also changes the model that generates the next layer selection, so the model is trained over its own evolving weights.' },
      ],
    },
    {
      id: 'learning',
      label: 'Training',
      heading: 'Training with meta-reinforcement learning',
      blocks: [
        { p: 'For each context during training, the current model samples K = 10 candidate layer selections. Each candidate receives the same LoRA update from **the same current weights**, at its own selected layers. We score each candidate with the reward.' },
        {
          math: String.raw`r_t=\underbrace{u_t}_{\text{acquisition}}-\;\lambda\underbrace{f_t}_{\text{forgetting}}`,
          label: 'The reward is acquisition minus lambda times forgetting.',
        },
        { exhibit: 'loop' },
        { p: 'The candidate with the highest reward is committed, and the stream continues from the updated weights. For each context, every pair of a higher-reward and a lower-reward candidate is kept as a preference pair.' },
        { p: 'After the stream, the preference pairs train **the round-start model**, not the model at the end of the stream, with Identity Preference Optimisation (IPO).[^ipo] The next round starts from the updated round-start model. This is the meta-learning step: the round-start model is trained so that its own sequence of updates produces better layer selections.' },
        { p: 'On SQuAD, the reward uses held-out questions. Acquisition is the accuracy on the questions of the current passage, and forgetting is the accuracy drop on the questions of past passages.[^squad] On LongBench v2, the reward needs **no labels**. Acquisition is the gain in log-likelihood of the current segment, and forgetting is the relative drop in log-likelihood of past segments.[^longbench]' },
      ],
    },
    {
      id: 'results',
      label: 'Results',
      heading: 'Results on SQuAD and LongBench v2',
      blocks: [
        { p: 'On a stream of 100 SQuAD passages with Qwen2.5-7B-Instruct, SCoL reaches **35.40%** acquisition and **20.46%** retention. SCoL (λ = 0), which removes the forgetting term from the reward, reaches 34.30% and 14.64%. SEAL (continual) reaches 13.70% and 1.30%.' },
        { exhibit: 'results' },
        { p: 'A fixed selection of the last 10 layers reaches 28.78% acquisition and 20.10% retention. Under the same 10-layer budget, SCoL has higher acquisition at comparable retention.' },
        { p: 'On LongBench v2, each example is a long context with a question. The model consolidates the long context as a stream of 2,048-token segments and answers the question after the last segment. We train on short contexts of 16k to 32k tokens and evaluate on short contexts and on long contexts of 32k to 64k tokens. SCoL reaches **42.3%** on short contexts and **37.0%** on long contexts. Sequential FT reaches 36.5% and 23.0%. Batch TTT, which trains one LoRA adapter on the full context, reaches the highest accuracy on long contexts, 41.5%.' },
      ],
    },
    {
      id: 'fisher',
      label: 'Fisher alignment',
      heading: 'Selected layers align with high Fisher information',
      blocks: [
        { p: 'We compare the layer selections with layerwise Fisher information, measured on the running model for each passage before the passage is consolidated.[^fisher] Fisher information measures where the loss on the current passage is most sensitive.' },
        {
          math: String.raw`\mathrm{recall@}k(c)=\frac{\lvert\,S(c)\cap\mathrm{Top}_k\big(F(c)\big)\rvert}{k},\qquad k=\lvert S(c)\rvert`,
          label: 'Recall at k of a context c is the number of selected layers S of c that are among the k layers with the highest Fisher information, divided by k, where k is the number of selected layers.',
        },
        { exhibit: 'fisher' },
        { p: 'Over 100 SQuAD passages, recall@k is **45.1%** for SCoL, 41.0% for SCoL (λ = 0), and 35.7% for a random selection of 10 of the 28 layers. The model is trained only on the reward of acquisition and forgetting.' },
        { p: 'SCoL updates the layers that are most sensitive to the current passage and leaves most layers unchanged. This selective plasticity matches continual learning methods that reduce interference by restricting updates to sparse, task-specific parameters.[^si]' },
      ],
    },
    {
      id: 'open',
      label: 'Limitations',
      heading: 'Limitations and future work',
      blocks: [
        { p: 'Over additional rounds of IPO training, SCoL can concentrate on repeated layer selections, which reduces the context-dependent diversity of the updates. Future work should study training algorithms with diversity regularization, such as KL control or batch-level entropy penalties.' },
        { p: 'Meta-training on longer streams, or adapting the weight λ of the forgetting term to the context length, could further improve the consolidation of long contexts.' },
      ],
    },
  ],

  exhibits: {
    writing: {
      title: 'Three contexts are consolidated into the weights, and a question is answered without them',
      description: 'Three contexts arrive one at a time: Lina puts the key in a blue box. Omar carries the blue box to the study. The study is upstairs. Each context is consolidated into a few of the 28 layers of the model. The contexts are then removed from the prompt. Asked whether the key is upstairs or downstairs, the model answers upstairs.',
      steps: [
        { label: 'Context 1', say: 'Context 1 is in the prompt. The model selects layers and consolidates the context into them with a LoRA update.' },
        { label: 'Context 2', say: 'Context 2 arrives at the updated model and is consolidated in the same way.' },
        { label: 'Context 3', say: 'Context 3 is consolidated.' },
        { label: 'Prompt cleared', say: 'The contexts are removed from the prompt. The weights keep the three updates.' },
        { label: 'Question', say: 'The question needs all three contexts. The model answers from its weights.' },
      ],
    },
    interference: {
      title: 'A second update in the same layers overwrites the first',
      description: 'Context 1 is consolidated into three layers. When Context 2 is consolidated into the same layers, it overwrites part of the update for Context 1. When Context 2 is consolidated into different layers, the update for Context 1 is not overwritten.',
      steps: [
        { label: 'Context 1', say: 'Context 1 is consolidated into three layers.' },
        { label: 'Same layers', say: 'Context 2 is consolidated into the same layers. It overwrites part of the update for Context 1.' },
        { label: 'Different layers', say: 'Context 2 is consolidated into different layers. The update for Context 1 is not overwritten.' },
      ],
    },
    loop: {
      title: 'One training step of SCoL',
      description: 'For one context, the current model samples 10 candidate layer selections. Each candidate receives the same LoRA update from the same weights. Each candidate is scored with the reward, acquisition minus λ times forgetting. The candidate with the highest reward is committed. The preference pairs between candidates train the round-start model.',
      steps: [
        { label: 'Sample', say: 'The current model samples 10 candidate layer selections for the same context.' },
        { label: 'Update', say: 'Each candidate receives the same LoRA update, from the same weights, at its own selected layers.' },
        { label: 'Reward', say: 'Each candidate is scored with the reward: acquisition of the current context minus λ times forgetting of past contexts.' },
        { label: 'Commit', say: 'The candidate with the highest reward is committed, and the stream continues from the updated weights.' },
        { label: 'IPO', say: 'After the stream, the preference pairs between higher-reward and lower-reward candidates train the round-start model.' },
      ],
      notes: [
        'During training, past contexts or their question sets are kept to evaluate forgetting. At evaluation, the model generates one layer selection per context and the update is committed.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    results: {
      title: 'Acquisition and retention on SQuAD, and accuracy on LongBench v2',
      description: 'On a stream of 100 SQuAD passages, SCoL reaches 35.4% acquisition and 20.5% retention. On LongBench v2, SCoL reaches 42.3% on short contexts and 37.0% on long contexts, where Batch TTT reaches 41.5%.',
      tabs: ['SQuAD', 'LongBench v2'],
      tabsLabel: 'Benchmark',
      notes: [
        'Qwen2.5-7B-Instruct. SQuAD: 100 passages consolidated in sequence and evaluated on held-out questions. Prompting only and Batch TTT do not consolidate a stream, so they have no retention value.',
        'LongBench v2: 40 short and 20 long contexts. Whiskers are one standard error over 10 sampled answers per question.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    fisher: {
      title: 'Layerwise Fisher information and the selected layers',
      description: 'For three SQuAD passages, the layerwise Fisher information and the layers that SCoL selected. Over 100 SQuAD passages, recall@k is 45.1% for SCoL, 41.0% for SCoL (λ = 0), and 35.7% for a random selection.',
      tabs: ['American Broadcasting Company', 'Nikola Tesla', 'Normans'],
      tabsLabel: 'SQuAD passage',
      notes: [
        'Fisher information is the squared gradient of the passage loss on the base projection weights of each layer, measured before a new adapter is attached.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
  },

  papers: ['self-consolidating-language-models-continual-kno-2026'],

  references: [
    { id: 'lost-in-the-middle', title: 'Lost in the Middle: How Language Models Use Long Contexts', url: 'https://aclanthology.org/2024.tacl-1.9/' },
    { id: 'compressive', title: 'Compressive Transformers for Long-Range Sequence Modelling', url: 'https://arxiv.org/abs/1911.05507' },
    { id: 'rag', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: 'https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html' },
    { id: 'consolidation', title: 'The Consolidation and Transformation of Memory', url: 'https://doi.org/10.1016/j.neuron.2015.09.004' },
    { id: 'cls', title: 'Why There Are Complementary Learning Systems in the Hippocampus and Neocortex', url: 'https://doi.org/10.1037/0033-295X.102.3.419' },
    { id: 'ewc', title: 'Overcoming Catastrophic Forgetting in Neural Networks', url: 'https://arxiv.org/abs/1612.00796' },
    { id: 'si', title: 'Continual Learning Through Synaptic Intelligence', url: 'https://proceedings.mlr.press/v70/zenke17a.html' },
    { id: 'fisher', title: 'On the Computation of the Fisher Information in Continual Learning', url: 'https://arxiv.org/abs/2502.11756' },
    { id: 'lora', title: 'LoRA: Low-Rank Adaptation of Large Language Models', url: 'https://arxiv.org/abs/2106.09685' },
    { id: 'seal', title: 'Self-Adapting Language Models', url: 'https://openreview.net/forum?id=JsNUE84Hxi' },
    { id: 'ipo', title: 'A General Theoretical Paradigm to Understand Learning from Human Preferences', url: 'https://arxiv.org/abs/2310.12036' },
    { id: 'squad', title: 'SQuAD: 100,000+ Questions for Machine Comprehension of Text', url: 'https://aclanthology.org/D16-1264/' },
    { id: 'longbench', title: 'LongBench v2: Towards Deeper Understanding and Reasoning on Realistic Long-context Multitasks', url: 'https://aclanthology.org/2025.acl-long.183/' },
  ],
} as const satisfies Essay
