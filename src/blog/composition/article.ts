import type { Essay } from '../essay/types'

/* The essay's words. The page and the static build both read this file, so it
   holds text only. Measurements quoted here are transcribed in evidence.ts.
   Terms follow the paper, one term per concept. BLOG.md lists them. */

const paper = '/papers/test-time-compositional-generalization.pdf'

export const compositionEssay = {
  id: 'composition',
  path: '/blog/test-time-compositional-generalization/',
  name: 'Test-Time Compositional Generalization',
  headline: 'Composing a held-out combination from prototypes discovered at test time',
  description: 'A diffusion model is trained on some combinations of attributes and is asked for one it has never seen. Mode ascent on the learned score discovers prototypes of seen combinations at test time, and their product of experts generates the held-out combination.',
  date: '2026-11-13',
  authors: [
    { name: 'Zekun Wang' },
    { name: 'Anant Gupta' },
    { name: 'Tianyi Zhu' },
    { name: 'Christopher J. MacLellan' },
  ],
  affiliation: 'Georgia Institute of Technology and University of Virginia',
  links: [{ label: 'Read the paper', href: paper }],
  image: '/blog-assets/composition/share/essay.png',
  imageAlt: 'Test-Time Compositional Generalization. Composing a held-out combination from prototypes discovered at test time. A grid of pairs of digit color and background color, twelve seen in training and four held out. Prototypes of seen pairs compose a held-out pair, a green digit on deep red.',

  summary: [
    'A diffusion model trained on ColorMNIST has seen green digits and deep red backgrounds, but never a green digit on deep red. Compositional generalization asks the model to produce such a held-out combination by recombining what it knows. Diffusion methods for this problem assume that the reusable concepts are given, through labels, prompts, or a learned concept library, and a held-out combination is not among them.',
    'We ask whether the model can discover its own reusable prototypes. A **prototype** is a mode of a noisy marginal, the distribution that the forward process produces at one noise level. Mode ascent on the learned score reaches it at test time from one query image. A prototype keeps what the model has learned: from a query of a held-out combination, mode ascent ends on seen combinations, and each keeps part of the query.',
    'We select the prototypes that explain the query and compose them into a product of experts, which takes each part of the query from the prototype that explains it best. Its closed-form score guides the composable diffusion sampler. On held-out compositions of ColorMNIST and CelebA, the samples reach **92.5%** and **77.0%** attribute correctness, within about a point of a near copy of the query, with a lower KID and a higher diversity. The same sampler conditioned on trained concept tokens reaches at most 39.3% and 63.4%.',
  ],
  lead: 'compose',

  sections: [
    {
      id: 'setting',
      label: 'Held-out combinations',
      heading: 'Training covers every attribute value, but not every combination',
      blocks: [
        { p: 'Compositional generalization asks a model to produce what it has never seen by recombining what it knows. People do this after learning familiar parts, and the ability has long been linked to reusable primitives and operators for recombining them.[^fodor] Neural networks can interpolate well within a training distribution and still fail when familiar primitives appear in unfamiliar combinations.[^scan]' },
        { p: 'ColorMNIST makes the setting concrete. An image has a digit, a digit color, and a background color, which gives 160 combinations. We hold out four pairs of digit color and background color across all ten digits, so 120 combinations are seen in training and 40 are held out. Every digit and every color still appears in training. **The model has seen green digits and deep red backgrounds, but never a green digit on deep red.**' },
        { p: 'At test time the model receives one image of a held-out class, the query, and must generate other images of that class. Diffusion composition methods combine concepts that are already available, as labels, prompts, or a learned concept library.[^poe][^ebm-composition][^composable][^reduce] A held-out class is not among them, and retrieval over the trained classes can only return a class the model was trained on. We ask whether the model can instead discover its own reusable prototypes and compose them into the held-out class.' },
      ],
    },
    {
      id: 'prototype',
      label: 'Prototypes',
      heading: 'A prototype is a mode of a noisy marginal',
      blocks: [
        { p: 'A diffusion model learns from data at every noise level. At level t the forward process turns a clean image into a noisy one, and the noisy marginal is the distribution of these noisy images.[^ddpm]' },
        {
          math: String.raw`x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon,\qquad \varepsilon\sim\mathcal N(0,I)`,
          label: 'The noisy image x t is the clean image x 0 scaled by the square root of alpha bar t, plus Gaussian noise scaled by the square root of one minus alpha bar t.',
        },
        { p: 'The network predicts the noise in a noisy image. Up to a factor, this prediction is the score of the noisy marginal, the gradient of its log-density.[^score-sde]' },
        {
          math: String.raw`s_\theta(x_t,t)=-\frac{\varepsilon_\theta(x_t,t)}{\sqrt{1-\bar\alpha_t}}\;\approx\;\nabla_{x_t}\log p_t(x_t)`,
          label: 'The learned score s theta at x t is minus the predicted noise divided by the square root of one minus alpha bar t. It approximates the gradient of the log-density of the noisy marginal p t.',
        },
        { p: 'We use the score for discovery instead of reverse sampling. **A prototype is a mode of a noisy marginal**, a point where its density has a local maximum. Mode ascent starts from a noised copy of an image and follows the score.' },
        {
          math: String.raw`x_t^{(i+1)}=x_t^{(i)}+\eta\,s_\theta\big(x_t^{(i)},\,t\big)`,
          label: 'Each ascent step moves the current point along the learned score, with step size eta.',
        },
        { exhibit: 'modes' },
        { p: 'A draw from a noisy marginal is visibly noisy, but a mode is noise-free. At a mode the score vanishes, and by Tweedie’s formula the expected clean image is then the mode itself, rescaled.[^tweedie] Around each mode we fit a local Gaussian. The mode is the location of the prototype, and the Gaussian is its extent.' },
        { p: 'Mode ascent needs no labels, no concept library, and no additional training. It uses the unconditional score, so it explores the full noisy marginal and not the conditional distribution of a trained class. The step size is set from the noise level and is halved whenever a step jumps across the mode, so no step size is tuned.' },
      ],
    },
    {
      id: 'levels',
      label: 'Noise levels',
      heading: 'The noise level sets the level of abstraction',
      blocks: [
        { p: 'Up to a rescaling, the noisy marginal at level t is the data distribution smoothed by a Gaussian kernel, and the bandwidth of the kernel grows with t. The noise schedule therefore defines a scale-space over the data distribution.[^scale-space] Mean-shift locates the modes of a density at one fixed bandwidth.[^mean-shift] The forward process fixes a ladder of bandwidths, and the pretrained score gives the gradient of the log-density at each of them. Recent work interprets the modes of the noisy marginals as a hierarchy of concept prototypes.[^concept-formation]' },
        { exhibit: 'levels' },
        { p: 'We recover prototypes at noise levels from t = 10 to t = 990 on four pretrained models, without labels: the unconditional DDPMs for CIFAR-10 and CelebA-HQ, DiT-XL/2 trained on ImageNet, and a text-to-image latent diffusion model (LDM) with 1.45B parameters trained on LAION-400M.[^ddpm][^dit][^ldm]' },
        { p: 'The prototype of an image changes from level to level. On CelebA-HQ, facial detail and identity persist through the fine levels and give way to more generic faces. On the two larger models the prototype shows a simpler version of its object at a higher noise level. **One image therefore yields several distinct prototypes, with changes in visual structure beyond a gradual loss of detail.**' },
      ],
    },
    {
      id: 'sharing',
      label: 'Shared prototypes',
      heading: 'Images come to share prototypes as the noise level grows',
      blocks: [
        { p: 'We measure how far apart the prototypes of different images are with the symmetric KL divergence between their local Gaussians at the same level. At fine levels the prototypes are well separated. As t grows, the separation falls by four to six orders of magnitude on all four models.' },
        { p: 'We also count the distinct prototypes that the images of a model reach.' },
        { exhibit: 'sharing' },
        { p: 'Every image has its own prototype at fine levels. At coarse levels all images of a model share one or two prototypes, from t = 460 on the two DDPMs, t = 560 on DiT-XL/2, and t = 820 on the LDM. Images with the same content share a prototype first: on DiT-XL/2 at t = 440, 44% of the pairs of images from the same class share a prototype, against 21% of the pairs from different groups of classes.' },
        { p: 'The prototype of one image does not change at a uniform rate. Its normalized displacement from the image changes slowly over the fine levels and then rises sharply, from t ≈ 450 on CIFAR-10, t ≈ 500 on CelebA-HQ, and t ≈ 600 on the two larger models. This agrees with the phase transitions and speciation times reported for diffusion models.[^phase][^speciation]' },
      ],
    },
    {
      id: 'learned',
      label: 'Held-out queries',
      heading: 'Mode ascent from a held-out combination ends on seen combinations',
      blocks: [
        { p: 'A prototype could be the image under a growing amount of blur. It would then depend only on the image and on the noise level, and not on what the model has learned. We test this on the ColorMNIST model. We take queries whose color pair is held out, and recolor each digit to two seen pairs, one that keeps the background and one that keeps the digit color.' },
        { exhibit: 'ascent' },
        { p: '**A prototype keeps a color pair that the model has seen and replaces one that it has not.** At t = 300, 89.8% of the ascents from a seen pair with the same background keep their pair, against 9.7% of the ascents from a held-out pair, which end on a seen pair instead. The images differ only in the color pair, so what a prototype keeps is set by what the model has learned and not by the amount of smoothing.' },
        { p: 'The prototype of a held-out query still keeps part of the query. In the figure, the ascent at t = 300 keeps the background and replaces the digit color, and the ascent at t = 400 keeps the digit color and replaces the background.' },
        { p: 'The text-to-image LDM has no held-out combination, but some combinations are rarer than others, such as a blue banana. Its prototypes keep a usual color longer than an unusual one: at t = 400 after 10 ascent steps, the usual color is kept in 95% of the images and the unusual one in 81%.' },
      ],
    },
    {
      id: 'composition',
      label: 'Product of experts',
      heading: 'A product of experts takes each part of the query from the prototype that explains it',
      blocks: [
        { p: 'A single prototype rarely carries every factor of a held-out class, but the prototypes of seen classes carry its parts. We therefore ask whether an out-of-distribution query can be written as a combination of prototypes that the model already has. Given one query, we run mode ascent at several noise levels from noised copies of the query and of the model’s own unconditional samples, and collect a pool of candidate prototypes. Each mode is refined by a second ascent at t = 50, and its local Gaussian is fitted there.' },
        { p: 'A greedy selection keeps the K = 8 prototypes that jointly best explain the query per dimension. The selected prototypes combine into a weighted product of experts.[^poe] The weights are per dimension: in each dimension, a prototype counts by how well it explains the query there. Different prototypes can therefore dominate different dimensions.' },
        {
          math: String.raw`q_{\mathrm T}(x_0)\;\propto\;\prod_{j\in S_K} q_j(x_0)^{\,w_j}`,
          label: 'The product of experts q T is proportional to the product of the selected local Gaussians q j, each raised to its per-dimension weight w j.',
        },
        { exhibit: 'weights' },
        { p: 'For the query above, the weights of the prototypes on deep red are high on the background, and the weights of the green prototypes are high along the digit. **The mean of the product of experts is a green digit on deep red: the held-out pair, composed from prototypes of seen pairs.**' },
        { p: 'The product is a Gaussian with a closed-form mean and covariance, so the score of its noisy marginal is analytic at every noise level. Composable diffusion adds the score of a trained concept token to the unconditional score of the model.[^composable][^cfg] We add the analytic score of the product of experts in its place.' },
        {
          math: String.raw`\hat x_0=\hat x_0^{\varnothing}+\kappa_t\big(\mu_{\mathrm T}-\hat x_0^{\varnothing}\big),\qquad \kappa_t=(1-\bar\alpha_t)\big[\bar\alpha_t\Sigma_{\mathrm T}+(1-\bar\alpha_t)I\big]^{-1}`,
          label: 'The estimate of the clean image is the estimate of the unconditional model, moved toward the mean mu T of the product of experts by the factor kappa t. Kappa t is one minus alpha bar t, times the inverse of alpha bar t times the covariance Sigma T plus one minus alpha bar t times the identity.',
        },
        { p: 'This is the mean of the product of two Gaussians over the clean image: the estimate of the unconditional model and the product of experts. The pull toward the mean of the product of experts is strong at high noise levels, where the estimate of the model is uncertain, and vanishes at low noise levels, so the sampler needs no guidance weight.' },
      ],
    },
    {
      id: 'results',
      label: 'Results',
      heading: 'Samples from one query are other instances of its held-out class',
      blocks: [
        { p: 'We evaluate on two benchmarks. ColorMNIST has 120 seen and 40 held-out classes. The CelebA benchmark has 74 combinations of 14 binary face attributes, of which 51 are seen and 23 are held out.[^celeba] A method receives one image of a held-out class and generates 16 samples. The other members of the class are used only for evaluation.' },
        { exhibit: 'samples' },
        { p: 'We compare with two baselines. Composable diffusion is conditioned on trained concept tokens of the same model: Comp. 1 uses the trained class under which the query has the lowest denoising loss, and Comp. 3 composes the three best.[^composable] Their samples land on neighboring classes. On ColorMNIST they show the query’s background under another digit color, or its digit color on another background. SDEdit noises the query to a level t0 and denoises it with the unconditional model.[^sdedit]' },
        { p: 'Attribute correctness is the fraction of the class’s defining attributes that a sample carries. KID is measured between the 16 samples and the held-out members of the class.[^kid] Diversity rewards samples that stay close to the query and differ from each other.[^dpp]' },
        { p: 'SDEdit at t0 = 50 returns near copies of the query, with 92.9% attribute correctness on ColorMNIST and 78.3% on CelebA. **Our samples reach 92.5% and 77.0%, with a lower KID and the highest diversity of all methods.** Comp. 1 and Comp. 3 reach 37.7% and 39.3% on ColorMNIST, where assigning attribute values at random gives 20%, and 63.4% and 62.2% on CelebA.' },
        { exhibit: 'results' },
        { p: 'A larger t0 lowers the KID of SDEdit only together with its attribute correctness. At every attribute correctness that both methods reach, our method has the lower KID. On CelebA, SDEdit at t0 = 200 matches our attribute correctness, 77.1% against 77.0%, and there our KID is lower in all 23 held-out classes.' },
      ],
    },
    {
      id: 'number',
      label: 'Seen classes',
      heading: 'The held-out class is composed from prototypes of seen classes',
      blocks: [
        { p: 'We vary the number of selected prototypes K. Attribute correctness rises with K and saturates between K = 5 and K = 8: from 65.7% at K = 1 to 92.5% at K = 8 on ColorMNIST, and from 72.8% to 77.0% on CelebA.' },
        { exhibit: 'number' },
        { p: 'The result does not depend on ascents from the query. In a second pool, every candidate is reached from one of the model’s own unconditional samples, and the query enters only through the selection and the weights. With K = 8 this pool gives 92.5% on ColorMNIST and 77.1% on CelebA.' },
        { p: 'On ColorMNIST at least 95% of the selected prototypes are seen classes. A single prototype carries 1.5 of the three factors of the query on average, and eight prototypes carry 2.9. **Eight prototypes jointly carry every factor of the query for 90.5% of the queries. A single prototype does for 2.7%.**' },
      ],
    },
    {
      id: 'limits',
      label: 'Limitations',
      heading: 'Limitations and future work',
      blocks: [
        { p: 'Our protocol follows the standard setting of compositional generalization: the primitive factors are known, and the test cases are unseen recombinations of them. We evaluate composition through generalization to held-out attribute combinations, and we do not analyze compositional structure in the internal representations of the model.' },
        { p: 'Prototype discovery operates on the score of the trained model, so it inherits the inductive biases of that model. On ColorMNIST, a query with a black background, which lies between the four trained background colors, yields coherent prototypes and samples. A query with a white background collapses onto the trained dark backgrounds. A mechanism for detecting, consolidating, and reusing new primitives remains future work.' },
      ],
    },
  ],

  exhibits: {
    compose: {
      title: 'A held-out color pair is composed from prototypes of seen pairs',
      description: 'A grid of the 16 pairs of digit color and background color in ColorMNIST. The model is trained on 12 pairs, and 4 are held out. The query is an image of a held-out pair, a green digit on deep red. Mode ascent ends at prototypes of seen pairs: cyan on deep red, green on dark brown, yellow on dark brown, cyan on dark purple, and pink on dark purple. The product of experts takes the background from the prototype on deep red and the digit color from the green prototype, and its mean is a green digit on deep red. Eight samples guided by it are green digits on deep red.',
      steps: [
        { label: 'Training', say: 'The model is trained on 12 of the 16 pairs of digit color and background color. Four pairs are held out.' },
        { label: 'Query', say: 'At test time the model receives one image of a held-out pair: a green digit on deep red.' },
        { label: 'Prototypes', say: 'Mode ascent ends at prototypes. Each shows a pair the model has seen. One has the background of the query, and one has its digit color.' },
        { label: 'Product', say: 'The product of experts takes the background from the prototype on deep red and the digit color from the green prototype. Its mean is a green digit on deep red.' },
        { label: 'Samples', say: 'The product of experts guides the sampler. The samples are new images of the held-out pair, which the model never saw in training.' },
      ],
      notes: [
        'Each cell of the grid stands for the ten digits in one pair of digit color and background color.',
        'Five of the K = 8 selected prototypes are shown, each in the cell of its pair. Two more show pairs that are already in the grid, and one shows a plain deep red background.',
        'Every image is an output of the ColorMNIST model for this query, from the paper’s overview figure.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    modes: {
      title: 'The modes of a noisy marginal at three noise levels',
      description: 'A one-dimensional example. At a low noise level the noisy marginal has five modes, and mode ascent from the noised copies of two images reaches two different modes. At a higher noise level neighboring modes have merged, and both ascents reach the same mode. At a high noise level one mode is left, and both ascents reach it.',
      notes: [
        'A diagram, not a measurement: a mixture of five Gaussians, smoothed by a Gaussian kernel whose bandwidth grows with the noise level. The rescaling of the forward process is left out.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    levels: {
      title: 'The prototypes of one image at increasing noise levels',
      wide: true,
      description: 'For two images of each of four pretrained models, the image and its prototype at seven increasing noise levels. A CIFAR-10 horse and a red boat, two CelebA-HQ faces, a Siberian husky and a strawberry sampled from DiT-XL/2, and a golden retriever and a fire engine sampled from the text-to-image LDM. At higher noise levels each prototype shows a simpler version of its image and then loses the object.',
      tabs: ['CIFAR-10 DDPM', 'CelebA-HQ DDPM', 'DiT-XL/2', 'Text-to-image LDM'],
      tabsLabel: 'Model',
      notes: [
        'Seven of the twenty noise levels of the paper’s figure. Mode ascent stops when the root mean square of the predicted noise is below 0.10. The mode is decoded with Tweedie’s formula and, for the two latent models, with the autoencoder of the model.',
        'CIFAR-10 and CelebA-HQ: held-out images. DiT-XL/2 and the text-to-image LDM: samples of the model. The models have 36M, 114M, 0.68B, and 1.45B parameters.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    sharing: {
      title: 'The number of distinct prototypes at increasing noise levels',
      description: 'The number of distinct prototypes that the images of each model reach. At t = 100 nearly every image has its own prototype on all four models. One or two prototypes remain from t = 460 on the CIFAR-10 and CelebA-HQ DDPMs, from t = 580 on DiT-XL/2, and at t = 860 on the text-to-image LDM.',
      notes: [
        'CIFAR-10: 512 held-out images. CelebA-HQ: 48 held-out images. DiT-XL/2 and the text-to-image LDM: 256 samples of the model.',
        'Mode ascent runs for 200 steps from one noised copy of every image. Two images share a prototype when their modes lie within a fixed distance of each other.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    ascent: {
      title: 'Mode ascent from a held-out color pair ends on a seen pair',
      description: 'On the grid of pairs, mode ascent from a held-out query, a green digit on deep red, ends on a seen pair. At t = 300 it ends on yellow on deep red: it keeps the background and replaces the digit color. At t = 400 it ends on green on dark brown: it keeps the digit color and replaces the background. Mode ascent from the same digit recolored to a seen pair, yellow on deep red, keeps that pair. Over 40 queries at t = 300, 9.7% of the ascents from a held-out pair keep their pair, against 89.8% and 92.5% of the ascents from the two seen pairs.',
      tabs: ['t = 300', 't = 400'],
      tabsLabel: 'Noise level',
      steps: [
        { label: 'Noised copy', say: 'A noised copy of each image. A draw from a noisy marginal is visibly noisy.' },
        { label: '1 step', say: 'One ascent step removes most of the noise.' },
        { label: '3 steps', say: 'After three ascent steps the noise is gone.' },
        { label: '10 steps', say: 'The later steps move the image toward a mode.' },
        { label: '40 steps', say: 'After 40 ascent steps the image from the held-out pair shows a seen pair. The image from the seen pair still shows its pair.' },
      ],
      notes: [
        'Images: two of the four noise levels of the paper’s figure. The seen pair is the same digit recolored to yellow on deep red, which keeps the background. Each ascent result is decoded with Tweedie’s formula.',
        'Table: 40 queries with a held-out color pair, each recolored to two seen pairs, with 32 ascents of 40 steps from each image at every noise level.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    weights: {
      title: 'Eight prototypes, their weights, and the mean of their product of experts',
      description: 'The eight prototypes selected for the query, a green digit on deep red, with the per-dimension weights of each. The weights of the prototypes on deep red are high on the background, and the weights of the green prototypes are high along the digit. The mean of the product of experts is a green digit on deep red.',
      notes: [
        'A weight map is white where the weight is 1. ColorMNIST, K = 8, one product of experts.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    samples: {
      title: 'One query, and the samples of each method',
      description: 'For one held-out ColorMNIST query, the digit 0 in green on deep red, and one held-out CelebA query: the query, three of its eight selected prototypes, and five samples each of our method, Comp. 1, Comp. 3, and SDEdit. On ColorMNIST our samples and those of SDEdit have the held-out pair of the query. The samples of Comp. 1 have a seen pair with the same background, cyan on deep red, and those of Comp. 3 a seen pair with the same digit color, green on dark purple. On CelebA the samples of Comp. 1 and Comp. 3 show other attribute combinations.',
      tabs: ['ColorMNIST', 'CelebA'],
      tabsLabel: 'Benchmark',
      notes: [
        'Three of the K = 8 selected prototypes are shown. On CelebA they belong to the first of four products of experts.',
        'SDEdit at t0 = 50. The grid places each method by the color pair that its five samples show.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    results: {
      title: 'Attribute correctness against KID, for SDEdit and for our method',
      description: 'On ColorMNIST our method reaches 92.5% attribute correctness at a KID of 0.079. SDEdit reaches 92.9% at 0.107 with t0 = 50 and 92.3% at 0.082 with t0 = 200. On CelebA our method reaches 77.0% at 0.166, and SDEdit reaches 78.3% at 0.218 and 77.1% at 0.179. At every attribute correctness that both methods reach, our method has the lower KID.',
      tabs: ['ColorMNIST', 'CelebA'],
      tabsLabel: 'Benchmark',
      notes: [
        'KID per batch of 16 samples, against the held-out members of the query’s class. Means over 40 held-out classes with 10 queries each on ColorMNIST, and over 23 held-out classes with 100 queries each on CelebA.',
        'SDEdit is drawn over its noise level t0. Our method is drawn at the setting of the paper’s results table, K = 8, and with K = 5 over the scale S of the variance of the product of experts. A wider product of experts lowers KID and attribute correctness together.',
        'Comp. 1 and Comp. 3 lie outside the plot, at 37.7% and 39.3% on ColorMNIST and at 63.4% and 62.2% on CelebA.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
    number: {
      title: 'Attribute correctness against the number of selected prototypes',
      description: 'On ColorMNIST, attribute correctness rises from 65.7% with one prototype to 92.5% with eight. With no ascent from the query it rises from 51.2% to 92.5%. On CelebA it rises from 72.8% to 77.0%, and from 59.6% to 77.1% with no ascent from the query. A near copy of the query reaches 92.9% and 78.3%, and Comp. 1 reaches 37.7% and 63.4%.',
      tabs: ['ColorMNIST', 'CelebA'],
      tabsLabel: 'Benchmark',
      notes: [
        'With no ascent from the query, every candidate is reached from a noised copy of one of the model’s own unconditional samples, 128 per noise level.',
        'The near copy of the query is SDEdit at t0 = 50.',
      ],
      sources: [{ label: 'Paper', href: paper }],
    },
  },

  papers: ['test-time-compositional-generalization-diffusion-2026'],

  references: [
    { id: 'fodor', title: 'Connectionism and Cognitive Architecture: A Critical Analysis', url: 'https://doi.org/10.1016/0010-0277(88)90031-5' },
    { id: 'scan', title: 'Generalization without Systematicity: On the Compositional Skills of Sequence-to-Sequence Recurrent Networks', url: 'https://proceedings.mlr.press/v80/lake18a.html' },
    { id: 'poe', title: 'Training Products of Experts by Minimizing Contrastive Divergence', url: 'https://doi.org/10.1162/089976602760128018' },
    { id: 'ebm-composition', title: 'Compositional Visual Generation with Energy Based Models', url: 'https://arxiv.org/abs/2004.06030' },
    { id: 'composable', title: 'Compositional Visual Generation with Composable Diffusion Models', url: 'https://arxiv.org/abs/2206.01714' },
    { id: 'reduce', title: 'Reduce, Reuse, Recycle: Compositional Generation with Energy-Based Diffusion Models and MCMC', url: 'https://arxiv.org/abs/2302.11552' },
    { id: 'ddpm', title: 'Denoising Diffusion Probabilistic Models', url: 'https://arxiv.org/abs/2006.11239' },
    { id: 'score-sde', title: 'Score-Based Generative Modeling through Stochastic Differential Equations', url: 'https://arxiv.org/abs/2011.13456' },
    { id: 'tweedie', title: 'Tweedie’s Formula and Selection Bias', url: 'https://doi.org/10.1198/jasa.2011.tm11181' },
    { id: 'scale-space', title: 'Scale-Space Filtering', url: 'https://www.ijcai.org/Proceedings/83-2/Papers/091.pdf' },
    { id: 'mean-shift', title: 'Mean Shift: A Robust Approach Toward Feature Space Analysis', url: 'https://doi.org/10.1109/34.1000236' },
    { id: 'concept-formation', title: 'Diffusion Models and Concept Formation', url: 'https://arxiv.org/abs/2609.13047' },
    { id: 'dit', title: 'Scalable Diffusion Models with Transformers', url: 'https://arxiv.org/abs/2212.09748' },
    { id: 'ldm', title: 'High-Resolution Image Synthesis with Latent Diffusion Models', url: 'https://arxiv.org/abs/2112.10752' },
    { id: 'phase', title: 'A Phase Transition in Diffusion Models Reveals the Hierarchical Nature of Data', url: 'https://doi.org/10.1073/pnas.2408799121' },
    { id: 'speciation', title: 'Dynamical Regimes of Diffusion Models', url: 'https://doi.org/10.1038/s41467-024-54281-3' },
    { id: 'cfg', title: 'Classifier-Free Diffusion Guidance', url: 'https://arxiv.org/abs/2207.12598' },
    { id: 'celeba', title: 'Deep Learning Face Attributes in the Wild', url: 'https://arxiv.org/abs/1411.7766' },
    { id: 'sdedit', title: 'SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations', url: 'https://arxiv.org/abs/2108.01073' },
    { id: 'kid', title: 'Demystifying MMD GANs', url: 'https://arxiv.org/abs/1801.01401' },
    { id: 'dpp', title: 'Determinantal Point Processes for Machine Learning', url: 'https://arxiv.org/abs/1207.6083' },
  ],
} as const satisfies Essay
