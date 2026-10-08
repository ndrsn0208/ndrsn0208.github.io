const trustRegionPdf = '/papers/trust-region-continual-learning.pdf?v=f24a30d7db6c'

export const diffusionArticle = {
  title: 'Continual Learning Diffusion Models',
  subtitle: 'A geometric view of learning new tasks while preserving earlier abilities',
  description: 'How rank-1 Fisher preserves parameter correlations and works with replay to support continual learning, retention, and recovery in diffusion image generators and robot policies.',
  date: '2026-10-08',
  author: 'Zekun Wang',
  introduction: [
    'A robot should still know how to use a hammer after learning nine more skills. An image generator that learns new animals should still be able to draw the vehicles it learned earlier. We want each new task to expand what a model can do. But when successive tasks change the same weights, learning can erase the abilities it should be building on.',
    'Our two papers approach this problem through diffusion models. The first asks which parameter changes threaten earlier tasks and finds that diffusion gradients offer a surprisingly compact answer. The second combines that information with replay and uncovers a local connection to **meta-learning**: continual training can preserve a useful initialization from which earlier tasks recover quickly. Together, they connect **rank-1 Fisher, generative replay, and trust regions** to continual learning in image generation and robotic control.',
  ],
  sections: [
    {
      id: 'problem',
      label: 'Learning across tasks',
      title: 'The same weights have to serve every task',
      paragraphs: [
        'Diffusion models learn to remove noise from training examples. Repeated denoising can then produce an image or, for a diffusion policy, an action sequence conditioned on recent observations. Our experiments use separate image generators and robot policies. Each model learns its own sequence of tasks, such as new image classes or different manipulation skills.',
        'The difficulty begins when the next task arrives. Its gradients change parameters that earlier tasks also depend on. The model must learn from the new data while continuing to perform earlier tasks, without returning to their full training datasets. **Learning the current task and retaining earlier tasks are joint requirements.** A model that succeeds at each task on arrival can still end the sequence unable to perform most of them.',
      ],
      citations: ['ddpm', 'diffusion-policy'],
    },
    {
      id: 'fisher',
      label: 'Which changes matter',
      title: 'The diagonal approximation misses how weights change together',
      paragraphs: [
        'Elastic weight consolidation, or EWC, protects earlier tasks by penalizing changes to their learned parameters. Fisher information determines which directions receive the strongest penalty. Our diffusion work estimates an empirical Fisher by averaging outer products of denoising loss gradients. These products retain **correlations between parameters**, including changes that reinforce or compensate for one another.',
        'The full matrix is expensive to store, so EWC commonly keeps only its diagonal. Every weight receives an individual importance value, but **all the off-diagonal entries disappear**. In an image denoiser, several weights can work together to represent an edge or a texture. Their individual importance does not tell us how changing them together affects the model. The missing entries describe those relationships.',
        'The comparison below starts with a Fisher matrix whose gradients largely agree. Its off-diagonal structure gives the loss a preferred geometry. Removing that structure changes the shape of the valley. A rank-1 estimate retains the shared pattern, so **its geometry stays close to full Fisher**. We use a richer illustrative loss surface to make the difference visible, with the same nonlinear detail in every panel. The next section explains why diffusion gradients can have this structure.',
      ],
      afterFigure: [
        'Increasing the strength of an inaccurate penalty cannot restore the correlations it discarded. We need a compact estimate that preserves the important direction. Diffusion models provide a way to find it.',
      ],
      citations: ['ewc', 'fisher-measurements'],
    },
    {
      id: 'rank-one',
      label: 'A tractable approximation',
      title: 'Diffusion gradients reveal a common direction',
      paragraphs: [
        'Later in the forward noising process, noise dominates the input. The rank-1 paper studies this low signal-to-noise ratio regime near convergence using a locally linear score approximation. Its central observation is that **per-example gradients align strongly with their mean**. Their outer products therefore concentrate Fisher information along one direction.',
        'The animation below multiplies each sample gradient by itself to form a matrix, then averages these matrices to build the empirical Fisher. When the gradients share a dominant direction, the **scaled outer product of their mean** recovers that pattern, including relationships between different weights.',
        'We test this structure using 1,024 sampled gradients from a small MNIST diffusion model. Figure 3 reports a second-to-first eigenvalue ratio of **0.022 at diffusion timestep 700**. The diagonal approximation has relative Frobenius error near **1.0** across the evaluated timesteps, while rank-1 error becomes much smaller at later steps. These are measured matrix approximation errors, separate from the illustrative parameter-space comparison.',
      ],
      afterFigure: [
        'Mean gradients also align across timesteps, supporting a practical estimate from gradients averaged over sampled noise levels. The resulting EWC penalty stores a direction and a scale, then penalizes the squared projection of each update onto that direction. Its representation scales linearly with parameter count per stored task, like diagonal EWC, while preserving the correlation structure that matters most.',
      ],
      technicalNote: 'The analysis concerns variance-preserving diffusion with squared-error denoising, near convergence, under the paper’s score-model assumptions. Using the mean requires a nonzero mean gradient, and combining timesteps relies on their alignment. Each task can have its own protected direction.',
      citations: ['rank-one-paper', 'fisher-measurements'],
    },
    {
      id: 'trust-region',
      label: 'Learning within a shared region',
      title: 'Finding shared solutions and keeping them stable',
      paragraphs: [
        'A better Fisher does not solve continual learning by itself. **EWC uses Fisher to define a penalty around earlier task solutions.** The model can reach a shared solution for Tasks 1 and 2, then find that Task 3 has no compatible solution there. Learning the new task forces it away from the earlier overlap. Figure 1(a) illustrates this limitation. The model also needs a training signal that helps it find **weights that work across tasks**.',
        'Generative distillation supplies the missing training signal. A frozen copy of the preceding image generator produces replay examples. The current model learns from new data while matching the teacher’s denoising predictions on replayed inputs. Earlier tasks now contribute directly to training. This encourages parameter sharing by asking the same weights to satisfy current and earlier tasks together.',
        'Figure 1(b) shows how replay changes this problem. Training on current and generated earlier examples promotes parameter sharing and can reach a different basin. But generated examples are imperfect. Several parameter regions may fit the replay data without preserving the original tasks equally well. As replay errors accumulate, a model can keep fitting its generated examples while losing earlier abilities.',
        'Figure 1(c) combines both ingredients in **Trust Region**. Replay guides learning toward shared parameters, while the rank-1 Fisher penalty limits changes to combinations of weights that earlier tasks depend on. The three views below show the roles separately and together. EWC provides local protection, replay provides earlier-task training data, and the combination favors a useful shared solution when one is nearby.',
      ],
      afterFigure: [
        'The trust region describes a neighborhood with a small Fisher-weighted penalty around earlier optima. Movement along less sensitive directions costs less. Training uses this soft penalty alongside current data and replay, which discourages harmful changes while allowing the model to adapt. A single rank-1 term constrains one direction, so this neighborhood need not have a closed boundary.',
      ],
      citations: ['parameter-sharing', 'trust-region-geometry'],
    },
    {
      id: 'meta-learning',
      label: 'Preserving the ability to recover',
      title: 'How quickly does an earlier skill return?',
      paragraphs: [
        'Fast recovery is a useful property of the model’s parameters. After learning a new task perturbs an earlier skill, a few further updates should bring that skill back. **The model remains a good initialization for its earlier tasks.** This is the connection to gradient-based meta-learning.',
        'MAML learns such an initialization by taking an update on support data and optimizing the query loss after adaptation. We start with the continual-learning objective and compare its old-task contribution with that one-step meta-gradient. **Replay supplies the query signal, while Fisher supplies the local curvature.** The derivation below shows where those roles meet.',
      ],
      recoveryIntro: [
        'We checked the connection directly on the CW10 diffusion policy. Its old-task update reached a **mean cosine similarity of 0.83** with an exact second-order, one-step MAML meta-gradient. Both were evaluated at the same parameters, with support and query samples from the same stream. This measures the directional agreement predicted by the analysis.',
        'We then test the behavior that motivates the connection. We keep evaluating **Task 1 while training later tasks** with current data, replay, and the Fisher penalty. The curves track how quickly earlier performance returns during this ongoing training. A useful initialization should require only a small correction to recover the earlier skill.',
      ],
      afterFigure: [
        'On CW10, Trust Region recovers 90% of initial Task 1 success within **2 to 45 updates** at every later task transition. At the transition to Task 10, the counts are **2 updates with Trust Region and 8,000 with Replay**. Replay ties at several transitions and is faster at one. Trust Region maintains short recovery times across the full sequence, alongside better final retention.',
        'The derivation identifies a meta-learning structure inside a practical continual-learning update. The gradient comparison tests that connection directly. The recovery curves show its behavioral consequence: **learning new tasks while keeping earlier abilities easy to recover**.',
      ],
      technicalNote: 'The derivation uses locality around approximate earlier optima, agreement between replay and adapted-query gradients, similar support/query curvature, and a rank-1 Fisher approximation. The empirical Fisher is a curvature proxy. The per-task directions agree when 1 − αρᵢ is positive and Fᵢδᵢ is nonzero. The scales can differ by task, so this does not make the summed updates or complete algorithms identical. Recovery is measured on previously learned tasks during continual training. It is not a separate adaptation test on unseen tasks.',
      citations: ['trust-region-paper', 'maml', 'meta-alignment', 'recovery-curves', 'recovery-measurements'],
    },
    {
      id: 'results',
      label: 'Evidence from images and actions',
      title: 'Retaining images and manipulation skills',
      paragraphs: [
        'The rank-1 paper evaluates four image datasets. On ImageNet-1k, twenty tasks introduce fifty classes each. Adding rank-1 EWC to generative distillation reduces final average FID from **69.0 to 48.5** and forgetting from **46.2 to 15.2**. FID measures generation quality, with lower values indicating a closer match to real images. Forgetting measures its increase between first learning a task and the final evaluation.',
        'On this same stream, diagonal EWC with distillation ends at 73.8 FID. Rank-1 EWC without distillation ends at 74.3. Both comparisons matter: useful curvature and a cross-task training signal are needed together.',
        'The trust-region paper uses a separate ten-task ImageNet-500 sequence. The combined method improves final average FID from **53.4 to 44.5** and reduces forgetting from **18.2 to 10.6**, compared with replay. These comparisons belong to different protocols and should be read within each experiment.',
        'On Continual-World-10, diffusion policies learn from offline expert demonstrations and use state observations for simulated manipulation. Trust Region reaches **88.3% average success versus 85.3% with Replay**. Average forgetting falls from **8.2 to 4.4 percentage points**. The same principle helps retain action-generation skills across distinct tasks.',
      ],
      citations: ['rank-one-results', 'trust-region-results'],
    },
    {
      id: 'outlook',
      label: 'Learning that accumulates',
      title: 'Learning should keep adding to what a model can do',
      paragraphs: [
        'The two papers address complementary requirements for learning that accumulates. We need a useful account of which parameter changes matter, and training signals that help the model satisfy tasks together. Diffusion gradients make the first tractable. Replay makes the second possible, while a better constraint limits the drift that replay can introduce.',
        'Our broader aim is continual learning that supports adaptation and generalization at deployment time. Larger generators, longer task streams, and physical robots remain important tests. Success means learning new abilities efficiently, retaining earlier knowledge, and using both when the next unfamiliar task arrives.',
      ],
      citations: ['rank-one-paper', 'trust-region-paper'],
    },
  ],
  acknowledgments: [
    'The ICLR 2026 paper, Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models, is by Zekun Wang, Anant Gupta, Zihan Dong, and Christopher J. MacLellan.',
    'The NeurIPS 2026 paper, Trust Region Continual Learning as an Implicit Meta-Learner, is by Zekun Wang, Anant Gupta, and Christopher J. MacLellan.',
  ],
  references: [
    {
      id: 'rank-one-paper',
      title: 'Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models',
      url: 'https://arxiv.org/html/2509.23593v2#S3.SS1',
      detail: 'ICLR 2026. Section 3.1 derives the gradient-alignment argument.',
    },
    {
      id: 'trust-region-paper',
      title: 'Trust Region Continual Learning as an Implicit Meta-Learner',
      url: `${trustRegionPdf}#page=5`,
      detail: 'NeurIPS 2026. Section 3.3, Equations 5–13, derives the local, task-wise connection to the MAML meta-gradient.',
    },
    {
      id: 'ddpm',
      title: 'Denoising Diffusion Probabilistic Models',
      url: 'https://arxiv.org/abs/2006.11239',
      detail: 'Ho, Jain, and Abbeel. NeurIPS 2020. The denoising objective behind the image models.',
    },
    {
      id: 'diffusion-policy',
      title: 'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion',
      url: 'https://arxiv.org/abs/2303.04137',
      detail: 'Chi and colleagues. Robotics: Science and Systems 2023. Action generation through diffusion.',
    },
    {
      id: 'ewc',
      title: 'Overcoming catastrophic forgetting in neural networks',
      url: 'https://arxiv.org/abs/1612.00796',
      detail: 'Kirkpatrick and colleagues. PNAS 2017. Elastic weight consolidation.',
    },
    {
      id: 'maml',
      title: 'Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks',
      url: 'https://arxiv.org/abs/1703.03400',
      detail: 'Finn, Abbeel, and Levine. ICML 2017. Learning an initialization for rapid adaptation.',
    },
    {
      id: 'fisher-measurements',
      title: 'Measured Fisher spectrum and approximation errors',
      url: 'https://arxiv.org/html/2509.23593v2#S3.F3',
      detail: 'Rank-1 Fisher paper, Figure 3. Full Fisher, diagonal, and rank-1 comparisons across diffusion timesteps.',
    },
    {
      id: 'parameter-sharing',
      title: 'Promoting parameter sharing through generative distillation',
      url: 'https://arxiv.org/html/2509.23593v2#S3.SS4',
      detail: 'Rank-1 Fisher paper, Section 3.4. The frozen teacher and the combined training objective.',
    },
    {
      id: 'trust-region-geometry',
      title: 'EWC, replay, and trust-region continual learning',
      url: 'https://arxiv.org/html/2602.02417v1#S3.F1',
      detail: 'Trust-region paper, Figure 1 and Section 3.2. Task overlap, replay drift, and the hybrid approach.',
    },
    {
      id: 'meta-alignment',
      title: 'Direct comparison with an exact MAML meta-gradient',
      url: `${trustRegionPdf}#page=19`,
      detail: 'Trust Region paper, Appendix D.1 and Table 9. The CW10 old-task update has mean cosine similarity 0.83 with an exact second-order, one-step MAML meta-gradient.',
    },
    {
      id: 'recovery-curves',
      title: 'Task 1 performance throughout continual training',
      url: `${trustRegionPdf}#page=8`,
      detail: 'Trust Region paper, Figure 2. Original ImageNet-500 and CW10 learning curves across ten tasks.',
    },
    {
      id: 'recovery-measurements',
      title: 'Task 1 recovery while learning later tasks',
      url: `${trustRegionPdf}#page=9`,
      detail: 'Trust-region paper, Table 2. Update counts at specified FID and success-rate thresholds.',
    },
    {
      id: 'rank-one-results',
      title: 'Continual image generation with rank-1 Fisher',
      url: 'https://arxiv.org/html/2509.23593v2#S5.T1',
      detail: 'Rank-1 Fisher paper, Table 1. Final FID and forgetting across four image datasets.',
    },
    {
      id: 'trust-region-results',
      title: 'ImageNet-500 and Continual-World-10 results',
      url: 'https://arxiv.org/html/2602.02417v1#S4.T1',
      detail: 'Trust-region paper, Table 1. Final image quality, manipulation success, and forgetting.',
    },
  ],
}
