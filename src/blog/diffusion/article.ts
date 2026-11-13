import type { Essay } from '../essay/types'

/* The essay's words. The page and the static build both read this file, so it
   holds text only. Measurements quoted here are transcribed in evidence.ts.
   Terms follow the two papers, one term per concept. BLOG.md lists them. */

const trustRegion = '/papers/trust-region-continual-learning.pdf?v=f24a30d7db6c'
const trustRegionHtml = 'https://arxiv.org/html/2602.02417v1'
const rankOne = 'https://arxiv.org/html/2509.23593v2'

export const diffusionEssay = {
  id: 'diffusion',
  path: '/blog/continual-learning-diffusion-models/',
  name: 'Continual Learning Diffusion Models',
  headline: 'Generative replay with a rank-1 Fisher trust region',
  description: 'Trust region continual learning combines generative replay with a rank-1 Fisher penalty. On diffusion image generation and diffusion-policy control it achieves the best final performance and the lowest forgetting, and old tasks re-converge in few gradient updates.',
  date: '2026-10-08',
  authors: [{ name: 'Zekun Wang' }],
  affiliation: 'Georgia Institute of Technology',
  links: [{ label: 'Read the two papers', href: '#papers' }],
  image: '/blog-assets/diffusion/share/essay.png',
  imageAlt: 'Continual Learning Diffusion Models. Generative replay with a rank-1 Fisher trust region. On a loss surface with the low-loss regions of three tasks, the parameters converge in the basin shared by all three, inside the trust region around the old-task optimum.',

  summary: [
    'Continual learning aims to acquire tasks sequentially without catastrophic forgetting. We study it in diffusion models for class-conditional image generation and robot control.',
    '**Trust region continual learning** combines generative replay with a Fisher penalty. Replay supplies old-task gradients. The Fisher penalty, computed from a rank-1 Fisher, keeps the parameters in a trust region around the old-task optima. Under local approximations, the old-task part of the update takes the form of one-step MAML.',
    'On ImageNet-1k, average FID improves from 69.0 with replay to **48.5**. On Continual World (CW10), the average success rate reaches **88.3%**, and Task 1 re-converges to 90% of its initial success rate within **2 to 45 gradient updates** after every task transition.',
  ],
  lead: 'return',

  sections: [
    {
      id: 'forgetting',
      label: 'Forgetting',
      heading: 'Finetuning on a new task causes catastrophic forgetting',
      blocks: [
        { p: 'A diffusion model is trained to remove noise from training samples. Repeating the denoising step generates an image or, for a diffusion policy, an action chunk conditioned on recent observations.[^ddpm][^diffusion-policy]' },
        { p: 'In continual learning, the model observes a stream of tasks sequentially, and the data of the old tasks are not available while it learns a new task. The gradients of the new task change parameters that the old tasks depend on. **Finetuning on the new task moves the parameters away from the old-task optimum, and the old-task performance collapses.** On CW10, finetuning reaches a 17.9% average success rate after 10 tasks.[^trust-region-results]' },
        { exhibit: 'forgetting' },
        { p: 'Two families of methods address catastrophic forgetting. Regularization-based methods such as Elastic Weight Consolidation (EWC) penalize changes to parameters that are important for the old tasks. Replay-based methods train on new-task data together with stored or generated samples of the old tasks. Trust region continual learning combines the two.' },
      ],
    },
    {
      id: 'region',
      label: 'Trust region',
      heading: 'EWC as a trust region around the old-task optimum',
      blocks: [
        { p: 'EWC adds a quadratic penalty on the displacement from the old-task optimum θ*, weighted by the Fisher information F.[^ewc] The empirical Fisher is the average outer product of per-sample gradients. It measures how sensitive the old task is to a parameter change in each direction.' },
        {
          math: String.raw`F=\mathbb{E}\big[\,g\,g^{\top}\big],\qquad \mathcal{L}_{\mathrm{EWC}}=\tfrac{\lambda}{2}\,(\theta-\theta^{\star})^{\top}F\,(\theta-\theta^{\star})`,
          label: 'The Fisher is the expected outer product of per-sample gradients. The Fisher penalty is lambda over two times the displacement from the old-task optimum, weighted by the Fisher.',
        },
        { p: 'This Fisher penalty is the Lagrangian relaxation of a trust region constraint: the Fisher-weighted distance to the old-task optimum stays below a radius δ. EWC keeps the update in an ellipsoidal trust region whose shape is set by the Fisher.' },
        { p: 'The full Fisher is too large to store, so EWC usually uses its diagonal. The diagonal Fisher discards the off-diagonal structure. In a small MNIST diffusion model, its relative Frobenius error with respect to the full Fisher is near 1.0 at every timestep. Most of the curvature is in the off-diagonal entries, so **the diagonal trust region is a weak constraint**.[^fisher-measurements]' },
        { p: 'Diffusion models admit a better approximation. In the later diffusion timesteps, where the signal-to-noise ratio is low, **per-sample gradients are strongly collinear with their mean**, so the empirical Fisher is approximately rank-1.[^rank-one-paper] In the same model, the second eigenvalue of the Fisher is 0.022 of the first at timestep 700.' },
        {
          math: String.raw`F\;\approx\;\rho\,u\,u^{\top},\qquad u=\bar g\,/\,\lVert\bar g\rVert`,
          label: 'The Fisher is approximately rho times u u transpose, where u is the direction of the mean gradient.',
        },
        { exhibit: 'region' },
        { p: 'The rank-1 Fisher stores one vector per task, the same memory as the diagonal Fisher. With the same generative replay, replacing the diagonal Fisher with the rank-1 Fisher improves average FID on ImageNet-1k from 73.8 to **48.5**.[^rank-one-results]' },
      ],
    },
    {
      id: 'sharing',
      label: 'Replay',
      heading: 'Trust region continual learning: generative replay with the Fisher penalty',
      blocks: [
        { p: 'EWC alone can overconstrain the update. **If the new-task optimum lies outside the trust region, the feasible set is empty.** On CW10, EWC reaches a 17.6% average success rate, close to the 17.9% of finetuning.[^trust-region-results]' },
        { p: 'Generative replay trains on new-task data together with replay data. We use generative distillation: a frozen copy of the previous model generates samples of the old tasks, and the current model is trained to match its predictions on them.[^parameter-sharing] Replay supplies old-task gradients, so the parameters move toward a basin shared by the old tasks and the new task.' },
        { p: 'Replay alone can drift. The replay data are imperfect, and no term keeps the parameters near the old-task optimum. The parameters can converge to a different basin far from it, and the old tasks then need more gradient updates to re-converge.[^trust-region-geometry]' },
        { p: '**Trust region continual learning** adds the Fisher penalty to the replay objective. Replay moves the parameters toward a shared basin, and the Fisher penalty keeps them near the old-task optima.' },
        {
          math: String.raw`\min_{\theta}\;\;\mathcal{L}_{\mathrm{new}}(\theta)\;+\;\beta\,\mathcal{L}_{\mathrm{replay}}(\theta)\;+\;\frac{\lambda}{2}\sum_{i}\rho_i\big(u_i^{\top}(\theta-\theta_i^{\star})\big)^{2}`,
          label: 'Minimize the new-task loss, plus beta times the replay loss, plus lambda over two times the sum over old tasks of rho i times the squared projection of the displacement from the old-task optimum onto the direction u i.',
        },
        { exhibit: 'methods' },
      ],
    },
    {
      id: 'maml',
      label: 'MAML form',
      heading: 'The old-task update takes a one-step MAML form',
      blocks: [
        { p: 'Fast re-convergence means that the parameters act as an initialization from which few gradient updates re-attain the old-task performance. Gradient-based meta-learning optimizes for the same property.[^maml]' },
        { p: 'One-step MAML takes one inner step on support data and then minimizes the loss on query data at the adapted parameters. We compare its meta-gradient with the old-task part of the Trust Region update for an old task i, where δᵢ = θ − θᵢ* is the displacement from the old-task optimum.[^trust-region-paper]' },
        {
          math: String.raw`\begin{aligned}g_i^{\mathrm{TR}}&=\beta\,\widetilde g_i+\lambda\,F_i\,\delta_i\\[5pt] g_i^{\mathrm{MAML}}&=(I-\alpha H_i^{\mathrm{s}})\,g_i^{\mathrm{q}}(\theta_i')\end{aligned}`,
          label: 'The Trust Region old-task update is beta times the replay gradient plus lambda times the Fisher times the displacement. The MAML meta-gradient is the identity minus alpha times the support Hessian, applied to the query gradient at the adapted parameters.',
        },
        { p: 'Under local approximations around the old-task optimum, the replay gradient approximates the query gradient, and both are approximately Fᵢδᵢ. The support Hessian is approximately Fᵢ. With the rank-1 Fisher, Fᵢ² ≈ ρᵢFᵢ.' },
        {
          math: String.raw`g_i^{\mathrm{TR}}\simeq(\beta+\lambda)\,F_i\,\delta_i,\qquad g_i^{\mathrm{MAML}}\simeq(1-\alpha\rho_i)\,F_i\,\delta_i`,
          label: 'Under the local approximations, the Trust Region old-task update is beta plus lambda, times the Fisher times the displacement. The MAML meta-gradient is one minus alpha rho, times the same Fisher times the displacement.',
        },
        { p: '**Both updates follow the same Fisher-shaped direction**, up to task-dependent scalar factors, and the directions agree when 1 − αρᵢ > 0. Replay supplies the query gradient, and the Fisher penalty approximates the support curvature correction offline, without a bilevel procedure. On the CW10 diffusion policies, the old-task part of the update has a mean cosine similarity of **0.83** with an exact second-order one-step MAML meta-gradient.[^meta-alignment]' },
      ],
    },
    {
      id: 'recovery',
      label: 'Re-convergence',
      heading: 'Task 1 re-converges in few gradient updates',
      blocks: [
        { p: 'We evaluate Task 1 during training on Tasks 2 to 10. After each task transition, we count the gradient updates until Task 1 returns to a threshold relative to its initial performance.' },
        { exhibit: 'recovery' },
        { p: 'On CW10 at the 90% threshold, Trust Region re-converges within **2 to 45 gradient updates** after every task transition. After the transition to Task 10 it needs **2 gradient updates, and Replay needs 8,000**. The continual meta-learning baselines FTML and VR-MCL need up to 20,000 gradient updates or do not re-converge.[^recovery-measurements]' },
        { p: 'On ImageNet-500 at the +30% FID threshold, Trust Region re-converges within 2 to 55 gradient updates after every task transition. Replay re-converges only after the first three.' },
      ],
    },
    {
      id: 'results',
      label: 'Results',
      heading: 'Trust Region achieves the best final performance and the lowest forgetting',
      blocks: [
        { p: 'We evaluate class-conditional image generation on ImageNet-1k (20 tasks) and ImageNet-500 (10 tasks), and diffusion-policy control on CW10 (10 manipulation tasks).' },
        { exhibit: 'results' },
        { p: 'On ImageNet-1k, Replay reaches an average FID of 69.0 with a forgetting of 46.2. Trust Region reaches **48.5 with 15.2**. EWC with the rank-1 Fisher and without replay reaches 74.3.[^rank-one-results]' },
        { p: 'On ImageNet-500, Trust Region improves average FID over Replay from 53.4 to **44.5** and forgetting from 18.2 to **10.6**. On CW10, it reaches an **88.3% average success rate, against 85.3%** for Replay, and reduces forgetting from 8.2 to 4.4.[^trust-region-results]' },
        { p: 'FTML and VR-MCL fall below finetuning on ImageNet-500, with an average FID of 172.5 and 142.2. On CW10 they reach average success rates of 78.5% and 77.9%, below Trust Region.' },
      ],
    },
    {
      id: 'open',
      label: 'Limitations',
      heading: 'Limitations and future work',
      blocks: [
        { p: 'The analysis assumes that the Task 1 optimum lies close to a shared optimum that also works for new tasks. When tasks are highly heterogeneous, the shared optimum can be far from the Task 1 optimum, which weakens the benefit of the trust region.' },
        { p: 'Future work could study how to identify or construct tasks that are more likely to share a common parameter region. More broadly, the results suggest a scalable approach to continual learning and meta-learning for large models and demanding tasks such as robotic control.' },
      ],
    },
  ],

  exhibits: {
    return: {
      title: 'CW10 Task 1 after training on Task 1 and after training on all 10 tasks',
      description: 'Recorded rollouts of CW10 Task 1, hammer, for four diffusion policies. After training on Task 1, all four succeed. After training on all 10 tasks, the policy trained with Trust Region succeeds, and the policies trained with Replay, EWC, and finetuning fail.',
      wide: true,
      notes: [
        'Four diffusion policies are trained on the 10 CW10 tasks in the same order. Each recording is one evaluation rollout of Task 1. The top row is recorded after training on Task 1, the bottom row after training on all 10 tasks.',
      ],
      sources: [{ label: 'Trust Region paper, Section 4.2', href: `${trustRegionHtml}#S4.SS2` }],
    },
    forgetting: {
      title: 'Finetuning moves the parameters away from the old-task optimum',
      description: 'A loss surface over the parameters, with the low-loss region of each task. Task 1 and Task 2 are the old tasks. After training on them, the parameters are at the old-task optimum, where their low-loss regions overlap. The low-loss region of the new task, Task 3, overlaps them only partly. Finetuning moves the parameters to the new-task optimum, outside the low-loss regions of the old tasks.',
      wide: true,
      steps: [
        { label: 'Old tasks', say: 'After training on Task 1 and Task 2, the parameters are at the old-task optimum, where the low-loss regions of the two tasks overlap.' },
        { label: 'New task', say: 'The low-loss region of the new task, Task 3, overlaps the low-loss regions of the old tasks only partly.' },
        { label: 'Finetuning', say: 'Finetuning follows the new-task gradient to the new-task optimum, outside the low-loss regions of the old tasks.' },
      ],
    },
    region: {
      title: 'The trust region under the rank-1 Fisher and under the diagonal Fisher',
      description: 'The same loss surface, around the old-task optimum. The per-sample gradients of each old task are strongly collinear. The trust region of the rank-1 Fisher covers the overlap of the two low-loss regions. The trust region of the diagonal Fisher is axis-aligned, so it is shorter along the overlap and wider across it.',
      wide: true,
      aliases: ['fisher-comparison', 'fisher-construction'],
      steps: [
        { label: 'Gradients', say: 'In the later diffusion timesteps, the per-sample gradients of each old task are strongly collinear with their mean.' },
        { label: 'Rank-1 Fisher', say: 'The rank-1 Fisher keeps this direction, one vector per old task. Its trust region covers the overlap of the two low-loss regions.' },
        { label: 'Diagonal Fisher', say: 'The diagonal Fisher keeps only the per-parameter terms. Its trust region is axis-aligned, so it is shorter along the overlap and wider across it.' },
      ],
      sources: [
        { label: 'Rank-1 Fisher paper, Section 3.1', href: `${rankOne}#S3.SS1` },
        { label: 'Measured spectrum, Figure 3', href: `${rankOne}#S3.F3` },
      ],
    },
    methods: {
      title: 'Parameter updates for a new task under EWC, Replay, and Trust Region',
      description: 'Three views of a loss surface with the low-loss regions of Task 1, Task 2, and the new task, Task 3. Under EWC, the low-loss region of Task 3 lies outside the trust region, and the update stops at its boundary. Replay moves the parameters into a basin shared by all three tasks and drifts to a different shared basin far from the old-task optimum. Trust Region converges in the shared basin inside the trust region.',
      wide: true,
      aliases: ['parameter-sharing'],
      steps: [
        { label: 'EWC', say: 'The low-loss region of Task 3 lies outside the trust region, so the feasible set is empty. EWC stops at its boundary.' },
        { label: 'Replay', say: 'Replay moves the parameters into a basin shared by all three tasks. Without the Fisher penalty they drift to a different shared basin far from the old-task optimum.' },
        { label: 'Trust Region', say: 'With replay and the Fisher penalty, the parameters converge in the shared basin inside the trust region. The grey line is the path of replay alone.' },
      ],
      sources: [{ label: 'Trust Region paper, Figure 1 and Section 3.2', href: `${trustRegion}#page=4` }],
    },
    recovery: {
      title: 'Gradient updates for Task 1 to re-converge',
      description: 'For each task transition, the number of gradient updates until Task 1 returns to a threshold relative to its initial performance. On CW10 at the 90% threshold, Trust Region needs 2 to 45 gradient updates after every task transition. Replay needs 8,000 after the transition to Task 10.',
      aliases: ['meta-learning', 'recovery-cw10', 'recovery-imagenet500'],
      wide: true,
      tabs: ['CW10', 'ImageNet-500'],
      tabsLabel: 'Benchmark',
      notes: [
        'Each mark is the number of gradient updates, after a task transition, until Task 1 returns to the threshold. A cross means that the threshold was not reached during training on that task. Counts are from Table 2 of the Trust Region paper.',
        'Thresholds are relative to the initial Task 1 performance: a fraction of its success rate on CW10, and a margin above its FID on ImageNet-500.',
      ],
      sources: [
        { label: 'Table 2', href: `${trustRegion}#page=9` },
        { label: 'Task 1 curves, Figure 2', href: `${trustRegion}#page=8` },
        { label: 'Derivation, Section 3.3', href: `${trustRegion}#page=5` },
        { label: 'Local approximations, Appendix D.1', href: `${trustRegion}#page=19` },
      ],
    },
    results: {
      title: 'Final performance and forgetting',
      description: 'Final performance and forgetting of every method on three benchmarks. Trust Region reaches an average FID of 48.5 on ImageNet-1k and 44.5 on ImageNet-500, and an 88.3% average success rate on CW10, with the lowest forgetting on each.',
      aliases: ['measured-results'],
      wide: true,
      tabs: ['ImageNet-1k', 'ImageNet-500', 'CW10'],
      tabsLabel: 'Benchmark',
      notes: [
        'ImageNet-1k: 1,000 classes at 32 × 32 pixels in 20 tasks, 3 seeds. ImageNet-500: 500 classes in 10 tasks, 3 seeds. CW10: 10 Meta-World manipulation tasks, 2,500 scripted demonstrations and 100 evaluation rollouts per task, 4 seeds.',
        'Whiskers are one standard error. Average FID and average success rate are taken over all tasks after the last task. Forgetting is the change in a task’s performance from when it is first learned to the end of training. FTML and VR-MCL are first-order implementations with generative replay.',
      ],
      sources: [
        { label: 'Rank-1 Fisher paper, Table 1', href: `${rankOne}#S5.T1` },
        { label: 'Trust Region paper, Table 1', href: `${trustRegionHtml}#S4.T1` },
      ],
    },
  },

  papers: [
    'trust-region-continual-learning-as-implicit-meta-2026',
    'avoid-catastrophic-forgetting-rank-1-fisher-from-2026',
  ],

  references: [
    { id: 'ddpm', title: 'Denoising Diffusion Probabilistic Models', url: 'https://arxiv.org/abs/2006.11239', detail: 'Ho, Jain, and Abbeel. NeurIPS 2020.' },
    { id: 'diffusion-policy', title: 'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion', url: 'https://arxiv.org/abs/2303.04137', detail: 'Chi and colleagues. Robotics: Science and Systems 2023.' },
    { id: 'trust-region-results', title: 'Final performance and forgetting on ImageNet-500 and CW10', url: `${trustRegionHtml}#S4.T1`, detail: 'Trust Region paper, Table 1.' },
    { id: 'ewc', title: 'Overcoming catastrophic forgetting in neural networks', url: 'https://arxiv.org/abs/1612.00796', detail: 'Kirkpatrick and colleagues. PNAS 2017.' },
    { id: 'fisher-measurements', title: 'Measured Fisher spectrum and approximation errors', url: `${rankOne}#S3.F3`, detail: 'Rank-1 Fisher paper, Figure 3.' },
    { id: 'rank-one-paper', title: 'Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models', url: `${rankOne}#S3.SS1`, detail: 'ICLR 2026. Section 3.1 derives the gradient collinearity.' },
    { id: 'rank-one-results', title: 'Final performance and forgetting on ImageNet-1k', url: `${rankOne}#S5.T1`, detail: 'Rank-1 Fisher paper, Table 1.' },
    { id: 'parameter-sharing', title: 'Generative replay with generative distillation', url: `${rankOne}#S3.SS4`, detail: 'Rank-1 Fisher paper, Section 3.4.' },
    { id: 'trust-region-geometry', title: 'EWC, replay, and trust region continual learning', url: `${trustRegion}#page=4`, detail: 'Trust Region paper, Figure 1 and Section 3.2.' },
    { id: 'maml', title: 'Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks', url: 'https://arxiv.org/abs/1703.03400', detail: 'Finn, Abbeel, and Levine. ICML 2017.' },
    { id: 'trust-region-paper', title: 'Trust Region Continual Learning as an Implicit Meta-Learner', url: `${trustRegion}#page=5`, detail: 'NeurIPS 2026. Section 3.3, Equations 5 to 13.' },
    { id: 'meta-alignment', title: 'Empirical analysis of the local approximations', url: `${trustRegion}#page=19`, detail: 'Trust Region paper, Appendix D.1.' },
    { id: 'recovery-measurements', title: 'Gradient updates for Task 1 to re-converge', url: `${trustRegion}#page=9`, detail: 'Trust Region paper, Table 2.' },
  ],
} as const satisfies Essay
