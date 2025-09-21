---
layout: about
title: about
permalink: /
subtitle: <a href='https://tail.cc.gatech.edu/people.html'>Georgia Institute of Technology</a>

profile:
  align: right
  image: profile_pic.JPG
  image_circular: false # crops the image to make it circular
  more_info: >
    <p>TSRB 230B</p>
    <p>Atlanta, GA 30332</p>

news: true  # includes a list of news items
latest_posts: false  # includes a list of the newest posts
selected_papers: true # includes a list of papers marked as "selected={true}"
social: true  # includes social icons at the bottom of the page
---
**About Me**

Hello there! I'm Zekun "Anderson" Wang. I'm a second year Ph.D. student at Georgia Tech with Prof. [Christopher J. MacLellan](https://chrismaclellan.com/). I'm interested in the intersection of cognitive science and artificial intelligence and how we can "learn so much from so little" that supports far transfer. Before joining Georgia Tech, I completed my M.S. in Computer Science at the University of Michigan, where I had a great fortune to work with [Dr. Joyce Chai](https://web.eecs.umich.edu/~chaijy/) and [Dr. Rada Mihalcea](https://web.eecs.umich.edu/~mihalcea/). I obtained my B.S. in Computer Science and B.S. in Mathematics from the Pennsylvania State University, where I worked with [Dr. Rebecca J. Passonneau](https://sites.psu.edu/becky/) in NLP.

**Research Interests**

I am deeply interested in the way we, particularly children, acquire and derive novel knowledge from past learned experiences (limited data) and then transfer far. Such learning scheme posts a stark contrast to the current deep learning paradigm, which is data-hungry and "modeling", where "learning" is an active, interactive, efficient, adaptive and creative process. My research interests are exploring these fundemental limitations in **deep learning and machine learning** using approaches inspired by human cognitive functions. I'm interested in exploring the following fundemental questions:
- **Compositionality**: One of the key component that I deemed essential that enabled us to learn fast and be creative. My hypothesis is that our mind creates heuristics to search and compose past knowledge (or parts of) to create the best fit for current understanding. Consider the example of learning math. In principle, if one knows how to perform elementary arithmetic, then one should can derive calculus, linear algebra, and so on. However, such derivation may never arrive without proper "kicks", or the right heuristics. I'm interested 1. how we can develop a compositional memory and 2. how we can learn the best "kicks" for knowledge composition.
- **Continual Learning**: A natural extension of compositionality. In the real world, we are constantly learning new things and at the same time we forget things. However, that doesn't hugely impact on how we utilize old knowledge and acquire new knowledge. Theories in replay buffer, memory consolidation, and catastrophic forgetting suggest that our learning is not linear and might be stochastic.
- **Active Learning**: Goal-oriented agents like human creates unique objectives for different needs. This requires the agent to 1. derive desires and 2. be able to plan subgoals to achieve the desires. My current apporach would be framing such problem in the contetx of reinforcement learning and inverse reinforcement learning.
- **Meta-Learning**: Finally, meta-learning is the general underlining principle that enables all of the above. Human will learn how to learn math by adjusting their leanring behavior through practice and experience, and learn what past knowledge to use and what to ignore.